// Package runner interprets an arbitrary Go snippet via the yaegi interpreter
// and returns the captured output. No js dependencies — tested natively.
package runner

import (
	"bytes"
	"fmt"
	"time"

	"github.com/traefik/yaegi/interp"

	"goconcurrency/playwasm/symbols"
)

// Result is the outcome of one run.
type Result struct {
	Stdout     string
	Stderr     string
	Err        string
	DurationMs int64
}

// Run interprets code and returns captured stdout/stderr and any error.
// yaegi automatically calls main() when Eval-ing a main package.
//
// A recover() guards against panics inside yaegi (e.g. deep interpreted
// recursion): without it a panic would leave the WASM instance in an undefined
// state and silently break every subsequent run on the page. Recovering turns
// the panic into a normal error and keeps the instance reusable.
func Run(code string) (res Result) {
	var out, errb bytes.Buffer
	defer func() {
		if r := recover(); r != nil {
			res.Stdout = out.String()
			res.Stderr = errb.String()
			res.Err = fmt.Sprintf("internal panic: %v", r)
		}
	}()
	i := interp.New(interp.Options{Stdout: &out, Stderr: &errb})
	if err := i.Use(symbols.Symbols); err != nil {
		return Result{Err: err.Error()}
	}
	start := time.Now()
	_, err := i.Eval(code)
	dur := time.Since(start).Milliseconds()
	res = Result{Stdout: out.String(), Stderr: errb.String(), DurationMs: dur}
	if err != nil {
		res.Err = err.Error()
	}
	return res
}
