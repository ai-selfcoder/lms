package solution

import (
	"fmt"
	"sort"
	"sync"
	"testing"
	"time"
)

func TestRunRateLimitedResults(t *testing.T) {
	ids := make([]int, 30)
	for i := range ids {
		ids[i] = i
	}

	callAPI := func(id int) string {
		return fmt.Sprintf("user-%d", id)
	}

	got := RunRateLimited(ids, 10, 50, callAPI)

	if len(got) != len(ids) {
		t.Fatalf("RunRateLimited: получено %d результатов, ожидалось %d", len(got), len(ids))
	}

	want := make([]string, len(ids))
	for i, id := range ids {
		want[i] = fmt.Sprintf("user-%d", id)
	}
	sort.Strings(got)
	sort.Strings(want)
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("RunRateLimited: результат %d = %q, ожидался %q", i, got[i], want[i])
		}
	}
}

func TestRunRateLimitedRate(t *testing.T) {
	const (
		n   = 40
		rps = 20
	)
	ids := make([]int, n)
	for i := range ids {
		ids[i] = i
	}

	var (
		mu    sync.Mutex
		times []time.Time
	)
	callAPI := func(id int) string {
		mu.Lock()
		times = append(times, time.Now())
		mu.Unlock()
		return fmt.Sprintf("u-%d", id)
	}

	start := time.Now()
	got := RunRateLimited(ids, 10, rps, callAPI)
	elapsed := time.Since(start)

	if len(got) != n {
		t.Fatalf("RunRateLimited: получено %d результатов, ожидалось %d", len(got), n)
	}

	// Нижняя граница по времени: n вызовов при rps не могут пройти
	// быстрее, чем за ~ (n/rps - 1) секунд. Широкий запас.
	minExpected := time.Duration(float64(n)/float64(rps)-1.0) * time.Second
	if elapsed < minExpected {
		t.Fatalf("RunRateLimited: выполнено за %v, ожидалось не быстрее %v (лимит %d rps) — лимитер не работает", elapsed, minExpected, rps)
	}

	// Проверка: ни в одном скользящем окне в 1 секунду число вызовов
	// не превышает rps + запас.
	mu.Lock()
	ts := append([]time.Time(nil), times...)
	mu.Unlock()
	sort.Slice(ts, func(i, j int) bool { return ts[i].Before(ts[j]) })

	const margin = 5
	for i := range ts {
		count := 0
		for j := i; j < len(ts); j++ {
			if ts[j].Sub(ts[i]) < time.Second {
				count++
			} else {
				break
			}
		}
		if count > rps+margin {
			t.Fatalf("RunRateLimited: в окне 1с зафиксировано %d вызовов, лимит %d (+запас %d)", count, rps, margin)
		}
	}
}
