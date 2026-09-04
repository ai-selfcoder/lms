package main

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

// RunResult is the outcome of grading one submission.
type RunResult struct {
	Pass     bool   `json:"pass"`
	Output   string `json:"output"`
	Duration string `json:"duration"`
	TimedOut bool   `json:"timedOut"`
}

const moduleFile = `module solution

go 1.25
`

// runTask assembles an isolated Go module from the task's fixed files plus the
// user's code, then runs `go test -race`. The user's code is written as
// solution.go; the task's solution_test.go and optional support.go are copied
// verbatim so the grader stays hidden and tamper-proof.
func runTask(taskDir, userCode string) (RunResult, error) {
	work, err := os.MkdirTemp("", "gotrainer-")
	if err != nil {
		return RunResult{}, err
	}
	defer os.RemoveAll(work)

	if err := os.WriteFile(filepath.Join(work, "go.mod"), []byte(moduleFile), 0o644); err != nil {
		return RunResult{}, err
	}
	if err := os.WriteFile(filepath.Join(work, "solution.go"), []byte(userCode), 0o644); err != nil {
		return RunResult{}, err
	}

	// Copy fixed task files (the hidden test and any support code).
	for _, name := range []string{"solution_test.go", "support.go"} {
		src := filepath.Join(taskDir, name)
		data, err := os.ReadFile(src)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return RunResult{}, err
		}
		if err := os.WriteFile(filepath.Join(work, name), data, 0o644); err != nil {
			return RunResult{}, err
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()

	start := time.Now()
	cmd := exec.CommandContext(ctx, "go", "test", "-race", "-count=1", "-timeout", "30s", "-v", "./...")
	cmd.Dir = work
	cmd.Env = append(os.Environ(), "GOFLAGS=", "CGO_ENABLED=1")

	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out
	runErr := cmd.Run()
	dur := time.Since(start)

	res := RunResult{
		Output:   out.String(),
		Duration: dur.Round(time.Millisecond).String(),
	}
	if ctx.Err() == context.DeadlineExceeded {
		res.TimedOut = true
		res.Output += "\n\n⏱  Превышен лимит времени (возможен deadlock или бесконечный цикл)."
	}
	res.Pass = runErr == nil && !res.TimedOut
	return res, nil
}
