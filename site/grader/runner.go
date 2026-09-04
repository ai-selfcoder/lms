package main

import "context"

// RunRequest is the decoded /api/run request body.
//
// Course selects which course's task tree to grade against. It is optional and
// defaults to the historical Go course (tasks live directly under ContentDir).
// Other courses resolve to <contentRoot>/<course>/tasks/<taskId>.
type RunRequest struct {
	TaskID string `json:"taskId"`
	Course string `json:"course"`
	Code   string `json:"code"`
}

// RunResult is the /api/run response body and the canonical verdict contract
// shared by every Runner implementation.
//
// The first five fields are the original, frozen contract; callers may rely on
// their exact semantics. Race/Summary/Tests are additive structured detail
// parsed from `go test -json` and are safe to ignore by old clients.
type RunResult struct {
	Pass         bool   `json:"pass"`
	Output       string `json:"output"`
	DurationMs   int64  `json:"durationMs"`
	TimedOut     bool   `json:"timedOut"`
	CompileError bool   `json:"compileError"`

	// Race is true when the race detector reported a data race during the run.
	Race bool `json:"race"`
	// Summary holds aggregate pass/fail/skip counts across all parsed tests.
	Summary TestSummary `json:"summary"`
	// Tests is the per-test breakdown (top-level tests and sub-tests).
	Tests []TestCase `json:"tests"`
}

// TestSummary aggregates the parsed test outcomes.
type TestSummary struct {
	Passed  int `json:"passed"`
	Failed  int `json:"failed"`
	Skipped int `json:"skipped"`
	Total   int `json:"total"`
}

// TestCase is a single parsed test (or sub-test) outcome.
type TestCase struct {
	Name      string `json:"name"`
	Status    string `json:"status"` // "pass" | "fail" | "skip"
	ElapsedMs int64  `json:"elapsedMs"`
}

// Runner grades a single submission for a task. Implementations must be safe
// for concurrent use. The taskDir is the absolute path to content/tasks/NN and
// holds the hidden grader files (solution_test.go, optional support.go). The
// reference.go file MUST never be shipped to the sandbox.
type Runner interface {
	// Run grades userCode against the task in taskDir and returns a verdict.
	// A non-nil error means the grader itself failed (infrastructure), not that
	// the submission was rejected — submission failures live inside RunResult.
	Run(ctx context.Context, taskDir, userCode string) (RunResult, error)
}

// goModFile is the module manifest assembled for every submission. The package
// name is "solution" to match starter/reference/test files.
const goModFile = `module solution

go 1.25
`

// taskFiles are the fixed, server-side files copied verbatim into the assembled
// module. support.go is optional; reference.go is deliberately excluded.
var taskFiles = []string{"solution_test.go", "support.go"}
