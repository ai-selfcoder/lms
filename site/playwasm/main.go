//go:build js && wasm

// Command playwasm registers a global JS function runGo(code) -> {stdout,
// stderr, err, durationMs} and signals readiness via __goReady().
package main

import (
	"syscall/js"

	"goconcurrency/playwasm/runner"
)

func runGo(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return map[string]any{"err": "no code", "stdout": "", "stderr": "", "durationMs": 0}
	}
	r := runner.Run(args[0].String())
	return map[string]any{
		"stdout":     r.Stdout,
		"stderr":     r.Stderr,
		"err":        r.Err,
		"durationMs": r.DurationMs,
	}
}

func main() {
	js.Global().Set("runGo", js.FuncOf(runGo))
	if ready := js.Global().Get("__goReady"); ready.Type() == js.TypeFunction {
		ready.Invoke()
	}
	select {} // keep the runtime alive, otherwise runGo disappears
}
