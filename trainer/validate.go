package main

import (
	"fmt"
	"os"
	"path/filepath"
)

// runValidate grades every task's reference.go against its hidden test, proving
// that a correct solution passes. Tasks without a reference.go are reported as
// skipped. Exit code is non-zero if any reference fails.
func runValidate(root string) {
	s, err := newServer(root)
	if err != nil {
		fmt.Fprintln(os.Stderr, "load error:", err)
		os.Exit(1)
	}
	var failed, skipped int
	for _, t := range s.tasks {
		ref, err := os.ReadFile(filepath.Join(t.dir, "reference.go"))
		if err != nil {
			fmt.Printf("  ⚪ %-3s %-40s  (нет reference.go)\n", t.ID, t.Title)
			skipped++
			continue
		}
		res, err := runTask(t.dir, string(ref))
		if err != nil {
			fmt.Printf("  💥 %-3s %-40s  runner error: %v\n", t.ID, t.Title, err)
			failed++
			continue
		}
		if res.Pass {
			fmt.Printf("  ✅ %-3s %-40s  %s\n", t.ID, t.Title, res.Duration)
		} else {
			failed++
			fmt.Printf("  ❌ %-3s %-40s  %s\n", t.ID, t.Title, res.Duration)
			fmt.Println(indent(res.Output))
		}
	}
	fmt.Printf("\n  Итог: %d ok, %d fail, %d skip из %d\n", len(s.tasks)-failed-skipped, failed, skipped, len(s.tasks))
	if failed > 0 {
		os.Exit(1)
	}
}

func indent(s string) string {
	out := ""
	for _, line := range splitLines(s) {
		out += "        " + line + "\n"
	}
	return out
}

func splitLines(s string) []string {
	var lines []string
	cur := ""
	for _, r := range s {
		if r == '\n' {
			lines = append(lines, cur)
			cur = ""
			continue
		}
		cur += string(r)
	}
	if cur != "" {
		lines = append(lines, cur)
	}
	return lines
}
