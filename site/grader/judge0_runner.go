package main

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// multiFileLanguageID is Judge0's "Multi-file program" language. In a stock
// self-hosted Judge0 this is language id 89. Override via JUDGE0_LANGUAGE_ID if
// your install differs.
const multiFileLanguageID = 89

// Judge0Runner grades submissions inside a self-hosted Judge0 sandbox using the
// "Multi-file program" language. The user's code, the hidden grader files, and
// compile/run scripts are packed into a base64 zip and submitted with wait=true.
// Untrusted code only ever runs here — never on the host.
type Judge0Runner struct {
	BaseURL    string // e.g. http://judge0-server:2358
	LanguageID int
	HTTPClient *http.Client

	// Sandbox limits. The race build is heavy, so these are generous.
	CPUTimeLimit  float64 // seconds of CPU time
	WallTimeLimit float64 // seconds of wall-clock time
	MemoryLimitKB int     // peak memory in KB
	AuthToken     string  // optional X-Auth-Token for secured Judge0
}

// NewJudge0Runner builds a runner from config with generous defaults.
func NewJudge0Runner(cfg Config) *Judge0Runner {
	langID := multiFileLanguageID
	if cfg.Judge0LanguageID > 0 {
		langID = cfg.Judge0LanguageID
	}
	return &Judge0Runner{
		BaseURL:       strings.TrimRight(cfg.Judge0URL, "/"),
		LanguageID:    langID,
		HTTPClient:    &http.Client{Timeout: 120 * time.Second},
		CPUTimeLimit:  35,
		WallTimeLimit: 40,
		MemoryLimitKB: 1024 * 1024, // 1 GiB; race builds are memory-hungry
		AuthToken:     cfg.Judge0AuthToken,
	}
}

// compile builds the test binary; race needs CGO.
const compileScript = `#!/bin/sh
set -e
export CGO_ENABLED=1
go test -race -c -o solution.test ./...
`

// run executes the tests, emitting a `go test -json` event stream on stdout so
// the grader can parse a structured breakdown. The wall/cpu guards live in
// Judge0. We run `go test -json` (rather than the prebuilt binary directly) so
// the output is the same test2json stream the LocalRunner parses.
const runScript = `#!/bin/sh
go test -json -race -count=1 -timeout 30s ./...
`

// judge0Submission is the POST /submissions body.
type judge0Submission struct {
	LanguageID             int     `json:"language_id"`
	AdditionalFiles        string  `json:"additional_files"` // base64 zip
	CPUTimeLimit           float64 `json:"cpu_time_limit"`
	WallTimeLimit          float64 `json:"wall_time_limit"`
	MemoryLimit            int     `json:"memory_limit"`
	EnableNetwork          bool    `json:"enable_network"`
	RedirectStderrToStdout bool    `json:"redirect_stderr_to_stdout"`
}

// judge0Result is the (subset of the) submission response with wait=true.
type judge0Result struct {
	Stdout        string `json:"stdout"`
	Stderr        string `json:"stderr"`
	CompileOutput string `json:"compile_output"`
	Message       string `json:"message"`
	Time          string `json:"time"`
	Status        struct {
		ID          int    `json:"id"`
		Description string `json:"description"`
	} `json:"status"`
}

// Judge0 status IDs (stable across installs).
const (
	statusAccepted          = 3
	statusWrongAnswer       = 4
	statusTimeLimit         = 5
	statusCompileError      = 6
	statusRuntimeErrSIGSEGV = 7
	statusInternalError     = 13
	statusExecFormatError   = 14
)

func (r *Judge0Runner) Run(ctx context.Context, taskDir, userCode string) (RunResult, error) {
	archive, err := buildSubmissionZip(taskDir, userCode)
	if err != nil {
		return RunResult{}, fmt.Errorf("build submission zip: %w", err)
	}

	body := judge0Submission{
		LanguageID:             r.LanguageID,
		AdditionalFiles:        base64.StdEncoding.EncodeToString(archive),
		CPUTimeLimit:           r.CPUTimeLimit,
		WallTimeLimit:          r.WallTimeLimit,
		MemoryLimit:            r.MemoryLimitKB,
		EnableNetwork:          false, // no network in the sandbox
		RedirectStderrToStdout: false,
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return RunResult{}, fmt.Errorf("marshal submission: %w", err)
	}

	url := r.BaseURL + "/submissions?base64_encoded=true&wait=true"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return RunResult{}, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if r.AuthToken != "" {
		req.Header.Set("X-Auth-Token", r.AuthToken)
	}

	start := time.Now()
	resp, err := r.HTTPClient.Do(req)
	if err != nil {
		return RunResult{}, fmt.Errorf("judge0 request: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return RunResult{}, fmt.Errorf("read judge0 response: %w", err)
	}
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return RunResult{}, fmt.Errorf("judge0 status %d: %s", resp.StatusCode, truncate(string(raw), 512))
	}

	var jr judge0Result
	if err := json.Unmarshal(raw, &jr); err != nil {
		return RunResult{}, fmt.Errorf("decode judge0 result: %w", err)
	}

	return mapJudge0Result(jr, time.Since(start)), nil
}

// mapJudge0Result translates a Judge0 verdict into the contract. Judge0 returns
// stdout/stderr/compile_output base64-encoded (we requested base64_encoded=true).
// stdout now carries a `go test -json` event stream which we parse into the
// structured breakdown; Judge0's status still owns the timeout/compile/internal
// verdicts that the stream cannot express.
func mapJudge0Result(jr judge0Result, fallbackDur time.Duration) RunResult {
	stdout := decodeB64(jr.Stdout)
	stderr := decodeB64(jr.Stderr)
	compileOut := decodeB64(jr.CompileOutput)

	// The JSON event stream lives on stdout. Build/compile errors land on
	// compile_output or stderr instead.
	parsed := parseTestJSON(stdout)

	// Raw fallback: everything Judge0 gave us, in a readable order. Used when no
	// JSON events were produced (build failure) or for context appended below.
	var b strings.Builder
	if compileOut != "" {
		b.WriteString(compileOut)
	}
	if stderr != "" {
		if b.Len() > 0 {
			b.WriteString("\n")
		}
		b.WriteString(stderr)
	}
	auxOutput := b.String() // compile/stderr text, excluding the JSON stream

	res := RunResult{}
	// Prefer Judge0's reported time; fall back to round-trip wall time.
	res.DurationMs = parseSecondsToMs(jr.Time, fallbackDur)

	// Fold the parsed stream in. For the fallback output, prefer the raw stdout
	// (or aux text) so nothing is lost when there are no events.
	fallback := stdout
	if fallback == "" {
		fallback = auxOutput
	}
	res = applyTestJSON(res, parsed, nil, fallback)

	// If there were events but Judge0 also surfaced compile/stderr noise, append
	// it so the log stays complete.
	if parsed.SawEvents && auxOutput != "" {
		res.Output += "\n" + auxOutput
	}

	switch jr.Status.ID {
	case statusAccepted:
		// Trust the parsed verdict; applyTestJSON already set Pass. If the
		// stream was empty but Judge0 says accepted, treat it as a pass.
		if !parsed.SawEvents {
			res.Pass = true
		}
	case statusCompileError:
		res.CompileError = true
		res.Pass = false
		if res.Output == "" {
			res.Output = jr.Status.Description
		}
	case statusTimeLimit:
		res.TimedOut = true
		res.Pass = false
		res.Output += "\n\n[timeout] Превышен лимит времени в песочнице (возможен deadlock)."
	default:
		// Wrong answer (test failed), runtime error, internal error, etc.
		// Some compile failures surface as a build-failed exit with output on
		// stderr rather than a CE status — catch those too.
		res.Pass = false
		if isCompileError(res.Output) {
			res.CompileError = true
		}
		if res.Output == "" && jr.Message != "" {
			res.Output = jr.Message
		}
	}
	return res
}

// buildSubmissionZip packs the multi-file submission. reference.go is never
// included — only taskFiles plus the user's solution and the scripts.
func buildSubmissionZip(taskDir, userCode string) ([]byte, error) {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	add := func(name, content string, mode os.FileMode) error {
		hdr := &zip.FileHeader{Name: name, Method: zip.Deflate}
		hdr.SetMode(mode)
		w, err := zw.CreateHeader(hdr)
		if err != nil {
			return err
		}
		_, err = io.WriteString(w, content)
		return err
	}

	if err := add("go.mod", goModFile, 0o644); err != nil {
		return nil, err
	}
	if err := add("solution.go", userCode, 0o644); err != nil {
		return nil, err
	}
	for _, name := range taskFiles {
		data, err := os.ReadFile(filepath.Join(taskDir, name))
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return nil, fmt.Errorf("read task file %s: %w", name, err)
		}
		if err := add(name, string(data), 0o644); err != nil {
			return nil, err
		}
	}
	// Executable scripts Judge0's multi-file language runs.
	if err := add("compile", compileScript, 0o755); err != nil {
		return nil, err
	}
	if err := add("run", runScript, 0o755); err != nil {
		return nil, err
	}

	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func decodeB64(s string) string {
	if s == "" {
		return ""
	}
	data, err := base64.StdEncoding.DecodeString(strings.TrimSpace(s))
	if err != nil {
		return s // already plain text
	}
	return string(data)
}

func parseSecondsToMs(s string, fallback time.Duration) int64 {
	if s == "" {
		return fallback.Milliseconds()
	}
	var secs float64
	if _, err := fmt.Sscanf(s, "%f", &secs); err != nil {
		return fallback.Milliseconds()
	}
	return int64(secs * 1000)
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
