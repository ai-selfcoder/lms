package main

import "strings"

// compileErrorMarkers are substrings emitted by the Go toolchain when a build
// fails before tests run. They distinguish "your code does not compile" from
// "your tests failed", which the contract surfaces separately via compileError.
var compileErrorMarkers = []string{
	"[build failed]",
	"# solution",
	": syntax error",
	"undefined:",
	"cannot use",
	"not enough arguments",
	"too many arguments",
	"imported and not used",
	"declared and not used",
	"missing return",
	"cannot find package",
	"FAIL\tsolution [build failed]",
	"no required module provides package",
}

// isCompileError reports whether the toolchain output indicates a build failure
// rather than a test failure. It is intentionally conservative: when in doubt
// we treat the run as a normal test failure (pass:false, compileError:false).
func isCompileError(output string) bool {
	for _, m := range compileErrorMarkers {
		if strings.Contains(output, m) {
			return true
		}
	}
	return false
}
