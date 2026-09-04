package main

import (
	"archive/zip"
	"bytes"
	"encoding/base64"
	"testing"
	"time"
)

func b64(s string) string { return base64.StdEncoding.EncodeToString([]byte(s)) }

func TestMapJudge0Result(t *testing.T) {
	tests := []struct {
		name     string
		in       judge0Result
		wantPass bool
		wantCE   bool
		wantTLE  bool
	}{
		{
			name:     "accepted",
			in:       judge0Result{Status: statusOf(statusAccepted), Stdout: b64("PASS\nok\n"), Time: "1.5"},
			wantPass: true,
		},
		{
			name:   "compile error status",
			in:     judge0Result{Status: statusOf(statusCompileError), CompileOutput: b64("./solution.go:2: syntax error")},
			wantCE: true,
		},
		{
			name:    "time limit",
			in:      judge0Result{Status: statusOf(statusTimeLimit)},
			wantTLE: true,
		},
		{
			name: "wrong answer is plain fail",
			in:   judge0Result{Status: statusOf(statusWrongAnswer), Stdout: b64("--- FAIL: TestMerge\nFAIL\n")},
		},
		{
			name:   "build-failed surfaced as runtime status still maps to compileError",
			in:     judge0Result{Status: statusOf(statusRuntimeErrSIGSEGV), Stderr: b64("# solution\n./solution.go:5: undefined: x")},
			wantCE: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := mapJudge0Result(tt.in, 2*time.Second)
			if got.Pass != tt.wantPass {
				t.Errorf("Pass = %v, want %v", got.Pass, tt.wantPass)
			}
			if got.CompileError != tt.wantCE {
				t.Errorf("CompileError = %v, want %v", got.CompileError, tt.wantCE)
			}
			if got.TimedOut != tt.wantTLE {
				t.Errorf("TimedOut = %v, want %v", got.TimedOut, tt.wantTLE)
			}
			if got.DurationMs <= 0 {
				t.Errorf("DurationMs = %d, want > 0", got.DurationMs)
			}
		})
	}
}

func statusOf(id int) struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
} {
	return struct {
		ID          int    `json:"id"`
		Description string `json:"description"`
	}{ID: id, Description: "x"}
}

func TestBuildSubmissionZipExcludesReference(t *testing.T) {
	// content/tasks/09 has reference.go + solution_test.go; reference must not leak.
	data, err := buildSubmissionZip("../content/tasks/09", "package solution\n")
	if err != nil {
		t.Fatalf("buildSubmissionZip: %v", err)
	}
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		t.Fatalf("read zip: %v", err)
	}
	names := map[string]bool{}
	for _, f := range zr.File {
		names[f.Name] = true
	}
	for _, want := range []string{"go.mod", "solution.go", "solution_test.go", "compile", "run"} {
		if !names[want] {
			t.Errorf("zip missing %q", want)
		}
	}
	if names["reference.go"] {
		t.Fatal("SECURITY: reference.go leaked into the sandbox submission")
	}
}
