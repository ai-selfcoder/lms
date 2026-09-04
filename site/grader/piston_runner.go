package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// PistonRunner grades submissions inside a self-hosted Piston sandbox
// (engineer-man/piston) using a custom "gotest" package whose run script is
// `go test -json -race`. Piston isolates each job with its own ephemeral user +
// namespaces and works on cgroup v2 hosts (unlike Judge0's isolate). Untrusted
// code only ever runs in Piston — never on the grader host.
type PistonRunner struct {
	BaseURL    string // e.g. http://sandbox-host:2000
	Language   string // Piston package language (default "gotest")
	Version    string // package version (default "1.26.4")
	HTTPClient *http.Client

	// Sandbox time budget (ms). The race build is heavy, so these are generous;
	// the Piston server must allow at least these (PISTON_RUN_CPU_TIME etc.).
	RunTimeoutMs int
	RunCPUMs     int
}

// NewPistonRunner builds a runner from config with generous defaults.
func NewPistonRunner(cfg Config) *PistonRunner {
	return &PistonRunner{
		BaseURL:      strings.TrimRight(cfg.PistonURL, "/"),
		Language:     cfg.PistonLanguage,
		Version:      cfg.PistonVersion,
		HTTPClient:   &http.Client{Timeout: 120 * time.Second},
		RunTimeoutMs: 55000,
		RunCPUMs:     55000,
	}
}

type pistonFile struct {
	Name    string `json:"name"`
	Content string `json:"content"`
}

// pistonExecRequest is the POST /api/v2/execute body.
type pistonExecRequest struct {
	Language       string       `json:"language"`
	Version        string       `json:"version"`
	Files          []pistonFile `json:"files"`
	RunTimeout     int          `json:"run_timeout"`
	RunCPUTime     int          `json:"run_cpu_time"`
	CompileTimeout int          `json:"compile_timeout"`
	CompileCPUTime int          `json:"compile_cpu_time"`
}

// pistonStage is one of the compile/run stages in the response.
type pistonStage struct {
	Stdout   string `json:"stdout"`
	Stderr   string `json:"stderr"`
	Output   string `json:"output"`
	Code     *int   `json:"code"`
	Signal   string `json:"signal"`
	Message  string `json:"message"`
	Status   string `json:"status"`
	WallTime int    `json:"wall_time"` // ms
	CPUTime  int    `json:"cpu_time"`  // ms
}

type pistonExecResponse struct {
	Run     pistonStage  `json:"run"`
	Compile *pistonStage `json:"compile"`
	Message string       `json:"message"` // top-level error on 4xx
}

func (r *PistonRunner) Run(ctx context.Context, taskDir, userCode string) (RunResult, error) {
	// Assemble the module exactly like LocalRunner/Judge0Runner: go.mod + the
	// user's solution + the hidden task files. reference.go is never shipped.
	files := []pistonFile{
		{Name: "go.mod", Content: goModFile},
		{Name: "solution.go", Content: userCode},
	}
	for _, name := range taskFiles {
		data, err := os.ReadFile(filepath.Join(taskDir, name))
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return RunResult{}, fmt.Errorf("read task file %s: %w", name, err)
		}
		files = append(files, pistonFile{Name: name, Content: string(data)})
	}

	body := pistonExecRequest{
		Language:       r.Language,
		Version:        r.Version,
		Files:          files,
		RunTimeout:     r.RunTimeoutMs,
		RunCPUTime:     r.RunCPUMs,
		CompileTimeout: r.RunTimeoutMs,
		CompileCPUTime: r.RunCPUMs,
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return RunResult{}, fmt.Errorf("marshal execute request: %w", err)
	}

	url := r.BaseURL + "/api/v2/execute"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return RunResult{}, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	start := time.Now()
	resp, err := r.HTTPClient.Do(req)
	if err != nil {
		return RunResult{}, fmt.Errorf("piston request: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return RunResult{}, fmt.Errorf("read piston response: %w", err)
	}

	var pr pistonExecResponse
	if err := json.Unmarshal(raw, &pr); err != nil {
		return RunResult{}, fmt.Errorf("decode piston response (status %d): %s", resp.StatusCode, truncate(string(raw), 300))
	}
	if resp.StatusCode != http.StatusOK {
		msg := pr.Message
		if msg == "" {
			msg = truncate(string(raw), 300)
		}
		return RunResult{}, fmt.Errorf("piston status %d: %s", resp.StatusCode, msg)
	}

	return mapPistonResult(pr, time.Since(start)), nil
}

// mapPistonResult translates a Piston verdict into the contract. run.stdout
// carries the `go test -json` event stream (our gotest package's run script);
// Piston owns the timeout/kill verdicts the stream cannot express.
func mapPistonResult(pr pistonExecResponse, fallbackDur time.Duration) RunResult {
	run := pr.Run
	stdout := run.Stdout

	parsed := parseTestJSON(stdout)

	// applyTestJSON only marks Pass when the command exited cleanly. Piston has
	// no exec error object, so synthesise one from the run exit code/signal — a
	// non-zero exit (failed test or build failure) must never read as a pass.
	var runErr error
	if run.Code == nil || *run.Code != 0 {
		runErr = fmt.Errorf("run exited (code=%s signal=%s)", codeString(run.Code), run.Signal)
	}

	// Fallback output for the no-events / build-failure case: prefer the build
	// compiler text, else raw stderr alongside stdout.
	fallback := stdout
	if strings.TrimSpace(run.Stderr) != "" {
		fallback = strings.TrimSpace(stdout + "\n" + run.Stderr)
	}

	res := RunResult{}
	if run.WallTime > 0 {
		res.DurationMs = int64(run.WallTime)
	} else {
		res.DurationMs = fallbackDur.Milliseconds()
	}
	res = applyTestJSON(res, parsed, runErr, fallback)

	// Piston compile stage (our gotest compile is a no-op, but handle anyway).
	if pr.Compile != nil && pr.Compile.Code != nil && *pr.Compile.Code != 0 {
		res.CompileError = true
		res.Pass = false
		if strings.TrimSpace(res.Output) == "" {
			res.Output = firstNonEmpty(pr.Compile.Stderr, pr.Compile.Stdout, pr.Compile.Output)
		}
	}

	// A build failure: modern `go test -json` emits build-output/build-fail
	// events (Action not handled by the shared parser), so surface them here.
	if strings.Contains(stdout, `"Action":"build-fail"`) {
		res.CompileError = true
		res.Pass = false
		if strings.TrimSpace(res.Output) == "" {
			res.Output = extractBuildOutput(stdout)
		}
	}

	// Time limit exceeded → Piston reports status "TO" with a SIGKILL.
	if run.Status == "TO" || (run.Signal == "SIGKILL" && strings.Contains(run.Message, "Time limit")) {
		res.TimedOut = true
		res.Pass = false
		res.Output += "\n\n[timeout] Превышен лимит времени в песочнице (возможен deadlock)."
	}

	if strings.TrimSpace(res.Output) == "" && run.Message != "" {
		res.Output = run.Message
	}
	return res
}

// extractBuildOutput pulls the compiler text out of `go test -json`
// build-output events (emitted when user code fails to compile).
func extractBuildOutput(raw string) string {
	var b strings.Builder
	for _, line := range strings.Split(raw, "\n") {
		t := strings.TrimSpace(line)
		if !strings.HasPrefix(t, "{") || !strings.Contains(t, `"build-output"`) {
			continue
		}
		var ev testEvent
		if json.Unmarshal([]byte(t), &ev) == nil && ev.Action == "build-output" {
			b.WriteString(ev.Output)
		}
	}
	return b.String()
}

func codeString(c *int) string {
	if c == nil {
		return "nil"
	}
	return strconv.Itoa(*c)
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
