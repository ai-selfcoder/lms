package main

import (
	"bufio"
	"encoding/json"
	"strings"
)

// testEvent is a single line of `go test -json` output. See `go doc
// test2json`. Only the fields we consume are decoded.
type testEvent struct {
	Action  string  `json:"Action"`  // "run"|"pass"|"fail"|"skip"|"output"|"start"|...
	Test    string  `json:"Test"`    // empty for package-level events
	Package string  `json:"Package"` // the test package
	Elapsed float64 `json:"Elapsed"` // seconds, on pass/fail events
	Output  string  `json:"Output"`  // raw line for "output" events
}

// parsedTests is the result of consuming a `go test -json` stream.
type parsedTests struct {
	// Output is the reconstructed human-readable log (all "output" events in
	// order). It reads like normal `go test` output.
	Output string
	// Tests is the per-test breakdown, ordered by completion.
	Tests []TestCase
	// Summary aggregates Tests.
	Summary TestSummary
	// Race is true if any output line reported a data race.
	Race bool
	// PackageFailed is true if any package-level event reported "fail".
	PackageFailed bool
	// SawEvents is false when no valid JSON event was decoded (e.g. a build
	// failure printed a bare error line instead of the event stream).
	SawEvents bool
	// NonJSON collects lines that were not valid JSON events. These are
	// typically build/compile error messages emitted before the stream.
	NonJSON string
}

// parseTestJSON consumes the combined stdout/stderr of `go test -json`. It is
// tolerant: lines that are not valid JSON events are skipped from the
// structured breakdown but preserved in NonJSON so build errors still surface.
func parseTestJSON(raw string) parsedTests {
	var p parsedTests
	var logBuf strings.Builder
	var nonJSON strings.Builder

	sc := bufio.NewScanner(strings.NewReader(raw))
	// Test output lines can be long (goroutine dumps); grow the buffer.
	sc.Buffer(make([]byte, 0, 64*1024), 8*1024*1024)

	for sc.Scan() {
		line := sc.Text()
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		// JSON events always start with '{'. Anything else is a bare line
		// (commonly a build error). Skip the JSON decode attempt for those.
		if !strings.HasPrefix(trimmed, "{") {
			nonJSON.WriteString(line)
			nonJSON.WriteByte('\n')
			logBuf.WriteString(line)
			logBuf.WriteByte('\n')
			continue
		}

		var ev testEvent
		if err := json.Unmarshal([]byte(line), &ev); err != nil {
			// Not a decodable event; treat like a bare line.
			nonJSON.WriteString(line)
			nonJSON.WriteByte('\n')
			logBuf.WriteString(line)
			logBuf.WriteByte('\n')
			continue
		}
		p.SawEvents = true

		switch ev.Action {
		case "output":
			logBuf.WriteString(ev.Output)
			if strings.Contains(ev.Output, "WARNING: DATA RACE") {
				p.Race = true
			}
		case "pass", "fail", "skip":
			if ev.Test != "" {
				p.Tests = append(p.Tests, TestCase{
					Name:      ev.Test,
					Status:    ev.Action,
					ElapsedMs: int64(ev.Elapsed * 1000),
				})
				switch ev.Action {
				case "pass":
					p.Summary.Passed++
				case "fail":
					p.Summary.Failed++
				case "skip":
					p.Summary.Skipped++
				}
				p.Summary.Total++
			} else if ev.Action == "fail" {
				// Package-level failure (e.g. the package failed to build or a
				// test panicked) with no Test name.
				p.PackageFailed = true
			}
		}
	}
	if err := sc.Err(); err != nil {
		// On scan error (e.g. an absurdly long line), preserve what we have and
		// note the truncation in the log.
		logBuf.WriteString("\n[grader] warning: test output truncated: " + err.Error() + "\n")
	}

	p.Output = logBuf.String()
	p.NonJSON = nonJSON.String()
	return p
}

// applyTestJSON fills the structured fields of res from a parsed `go test
// -json` stream and computes Pass/CompileError. It does NOT touch TimedOut or
// DurationMs (the caller owns those). runErr is the error returned by running
// the test command (nil on a clean exit). It returns the updated result.
//
// Output precedence: if the JSON stream produced events we use the
// reconstructed human-readable log; otherwise we fall back to fallbackOutput
// (the raw captured bytes) so build errors are never swallowed.
func applyTestJSON(res RunResult, p parsedTests, runErr error, fallbackOutput string) RunResult {
	res.Race = p.Race
	res.Summary = p.Summary
	res.Tests = p.Tests

	if p.SawEvents {
		res.Output = p.Output
	} else if fallbackOutput != "" {
		res.Output = fallbackOutput
	}

	// A build failure may produce no JSON events but a bare error line, or a
	// package-level "fail" whose output matches a compile marker. We only flag a
	// compile error from the conservative marker set; callers that have stronger
	// signal (e.g. an exit error with no events) layer that on top.
	if isCompileError(res.Output) {
		res.CompileError = true
	}

	// Pass requires: the command exited cleanly, no failed tests, no
	// package-level failure, and not a build error. TimedOut is enforced by the
	// caller after this returns.
	res.Pass = runErr == nil &&
		res.Summary.Failed == 0 &&
		!p.PackageFailed &&
		!res.CompileError &&
		p.SawEvents
	return res
}
