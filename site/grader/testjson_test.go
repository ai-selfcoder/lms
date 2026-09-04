package main

import (
	"errors"
	"testing"
)

func TestParseTestJSON(t *testing.T) {
	stream := `{"Action":"run","Test":"TestMerge"}
{"Action":"output","Test":"TestMerge","Output":"=== RUN   TestMerge\n"}
{"Action":"run","Test":"TestMerge/empty"}
{"Action":"output","Test":"TestMerge/empty","Output":"=== RUN   TestMerge/empty\n"}
{"Action":"pass","Test":"TestMerge/empty","Elapsed":0.01}
{"Action":"pass","Test":"TestMerge","Elapsed":0.02}
{"Action":"run","Test":"TestSkipped"}
{"Action":"skip","Test":"TestSkipped","Elapsed":0}
{"Action":"run","Test":"TestBad"}
{"Action":"output","Test":"TestBad","Output":"    WARNING: DATA RACE\n"}
{"Action":"fail","Test":"TestBad","Elapsed":0.5}
{"Action":"output","Output":"FAIL\n"}
{"Action":"fail","Package":"solution","Elapsed":0.6}
`
	p := parseTestJSON(stream)

	if !p.SawEvents {
		t.Fatal("SawEvents = false, want true")
	}
	if !p.Race {
		t.Error("Race = false, want true (DATA RACE present)")
	}
	if !p.PackageFailed {
		t.Error("PackageFailed = false, want true")
	}
	if p.Summary.Total != 4 || p.Summary.Passed != 2 || p.Summary.Failed != 1 || p.Summary.Skipped != 1 {
		t.Errorf("Summary = %+v, want passed=2 failed=1 skipped=1 total=4", p.Summary)
	}
	// Sub-test captured with parent/child name and ms conversion.
	var foundSub, foundElapsed bool
	for _, tc := range p.Tests {
		if tc.Name == "TestMerge/empty" && tc.Status == "pass" {
			foundSub = true
			if tc.ElapsedMs != 10 {
				t.Errorf("sub-test ElapsedMs = %d, want 10", tc.ElapsedMs)
			}
		}
		if tc.Name == "TestBad" && tc.ElapsedMs == 500 {
			foundElapsed = true
		}
	}
	if !foundSub {
		t.Error("sub-test TestMerge/empty not captured")
	}
	if !foundElapsed {
		t.Error("TestBad elapsed (500ms) not captured")
	}

	// Reconstructed log reads like go test output.
	if want := "=== RUN   TestMerge\n"; !contains(p.Output, want) {
		t.Errorf("Output missing %q", want)
	}
}

func TestApplyTestJSONPass(t *testing.T) {
	p := parseTestJSON(`{"Action":"run","Test":"TestA"}
{"Action":"pass","Test":"TestA","Elapsed":0.01}
{"Action":"pass","Package":"solution","Elapsed":0.02}
`)
	res := applyTestJSON(RunResult{}, p, nil, "raw")
	if !res.Pass {
		t.Errorf("Pass = false, want true; res = %+v", res)
	}
	if res.CompileError {
		t.Error("CompileError = true, want false")
	}
}

func TestApplyTestJSONFail(t *testing.T) {
	p := parseTestJSON(`{"Action":"run","Test":"TestA"}
{"Action":"fail","Test":"TestA","Elapsed":0.01}
{"Action":"fail","Package":"solution","Elapsed":0.02}
`)
	res := applyTestJSON(RunResult{}, p, errors.New("exit 1"), "raw")
	if res.Pass {
		t.Error("Pass = true, want false")
	}
	if res.Summary.Failed != 1 {
		t.Errorf("Failed = %d, want 1", res.Summary.Failed)
	}
}

func TestApplyTestJSONBuildError(t *testing.T) {
	// No JSON events, just a bare build error line on stderr.
	raw := "# solution\n./solution.go:2:1: syntax error: unexpected x\nFAIL\tsolution [build failed]\n"
	p := parseTestJSON(raw)
	if p.SawEvents {
		t.Fatal("SawEvents = true, want false for a bare build error")
	}
	res := applyTestJSON(RunResult{}, p, errors.New("exit 2"), raw)
	if !res.CompileError {
		t.Errorf("CompileError = false, want true; output=%q", res.Output)
	}
	if res.Pass {
		t.Error("Pass = true, want false")
	}
	if !contains(res.Output, "build failed") {
		t.Errorf("Output should preserve build error, got %q", res.Output)
	}
}

func contains(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
