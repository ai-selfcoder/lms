package main

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// LocalRunner grades submissions by assembling a temp Go module and running
// `go test -race` directly on the host. It is intended for development only:
// it offers no sandboxing, so it must never grade untrusted code in production.
// Use Judge0Runner for that. This mirrors trainer/runner.go.
type LocalRunner struct {
	// TestTimeout is passed to `go test -timeout`. The process is given a small
	// grace period on top before the context kills it.
	TestTimeout time.Duration
}

// NewLocalRunner returns a LocalRunner with sensible defaults.
func NewLocalRunner() *LocalRunner {
	return &LocalRunner{TestTimeout: 30 * time.Second}
}

func (r *LocalRunner) Run(ctx context.Context, taskDir, userCode string) (RunResult, error) {
	work, err := os.MkdirTemp("", "gotrainer-")
	if err != nil {
		return RunResult{}, fmt.Errorf("create temp module: %w", err)
	}
	defer os.RemoveAll(work)

	if err := os.WriteFile(filepath.Join(work, "go.mod"), []byte(goModFile), 0o644); err != nil {
		return RunResult{}, fmt.Errorf("write go.mod: %w", err)
	}
	if err := os.WriteFile(filepath.Join(work, "solution.go"), []byte(userCode), 0o644); err != nil {
		return RunResult{}, fmt.Errorf("write solution.go: %w", err)
	}

	// Copy the fixed task files (hidden test + optional support). reference.go is
	// intentionally not in taskFiles.
	for _, name := range taskFiles {
		data, err := os.ReadFile(filepath.Join(taskDir, name))
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return RunResult{}, fmt.Errorf("read task file %s: %w", name, err)
		}
		if err := os.WriteFile(filepath.Join(work, name), data, 0o644); err != nil {
			return RunResult{}, fmt.Errorf("write task file %s: %w", name, err)
		}
	}

	// Generous grace on top of the in-test timeout so `go test` reports the
	// timeout itself (with a goroutine dump) before we hard-kill it.
	runCtx, cancel := context.WithTimeout(ctx, r.TestTimeout+15*time.Second)
	defer cancel()

	timeoutArg := fmt.Sprintf("%ds", int(r.TestTimeout.Seconds()))
	start := time.Now()
	// -json implies -v; it emits a machine-readable event stream we parse into
	// the structured breakdown. stdout carries the events; build errors land on
	// stderr, so we capture both into one buffer.
	cmd := exec.CommandContext(runCtx, "go", "test", "-json", "-race", "-count=1", "-timeout", timeoutArg, "./...")
	cmd.Dir = work
	cmd.Env = append(os.Environ(), "GOFLAGS=", "CGO_ENABLED=1")

	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out
	runErr := cmd.Run()
	dur := time.Since(start)

	raw := out.String()
	parsed := parseTestJSON(raw)

	res := RunResult{DurationMs: dur.Milliseconds()}
	res = applyTestJSON(res, parsed, runErr, raw)

	// A failed `go test` invocation that emitted no JSON events at all is a
	// build failure: test2json never started because compilation broke. Surface
	// it as a compile error (the conservative marker check may miss novel
	// toolchain phrasings).
	if runErr != nil && !parsed.SawEvents && strings.TrimSpace(parsed.NonJSON) != "" {
		res.CompileError = true
		res.Pass = false
	}

	// Timeout overrides everything: a deadline-exceeded run is never a pass and
	// keeps its dedicated flag/message regardless of what the stream contained.
	if runCtx.Err() == context.DeadlineExceeded {
		res.TimedOut = true
		res.Pass = false
		res.Output += "\n\n[timeout] Превышен лимит времени (возможен deadlock или бесконечный цикл)."
	}
	return res, nil
}
