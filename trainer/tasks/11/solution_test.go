package solution

import (
	"testing"
)

func TestRunPipeline(t *testing.T) {
	lines := []string{
		"INFO|started",
		"WARN|low memory",
		"ERROR|crash",
		"DEBUG|trace",   // невалидный уровень
		"|no level",     // пустой уровень
		"INFO|ready",
		"TRACE|verbose", // невалидный уровень
		"ERROR|timeout",
	}

	want := map[LogRecord]int{
		{Level: "INFO", Msg: "started"}:    1,
		{Level: "WARN", Msg: "low memory"}: 1,
		{Level: "ERROR", Msg: "crash"}:     1,
		{Level: "INFO", Msg: "ready"}:      1,
		{Level: "ERROR", Msg: "timeout"}:   1,
	}

	got := RunPipeline(lines, 2, 10, 5)

	counts := map[LogRecord]int{}
	for _, r := range got {
		counts[r]++
	}

	if len(got) != 5 {
		t.Fatalf("RunPipeline: ожидалось 5 валидных записей, получено %d: %v", len(got), got)
	}

	for rec, n := range want {
		if counts[rec] != n {
			t.Fatalf("RunPipeline: запись %+v встречается %d раз, ожидалось %d", rec, counts[rec], n)
		}
	}
	for rec := range counts {
		if _, ok := want[rec]; !ok {
			t.Fatalf("RunPipeline: получена неожиданная запись %+v (должна была быть отброшена)", rec)
		}
	}
}
