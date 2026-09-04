package solution

import (
	"runtime"
	"sync/atomic"
	"testing"
	"time"
)

// TestSchedulerPeriodic: задача A (интервал 20ms) запускается заметно чаще,
// чем задача B (интервал 100ms), за ~250ms наблюдения.
func TestSchedulerPeriodic(t *testing.T) {
	s := NewScheduler(4)

	var a, b int64
	s.Add(20*time.Millisecond, func() { atomic.AddInt64(&a, 1) })
	s.Add(100*time.Millisecond, func() { atomic.AddInt64(&b, 1) })

	s.Start()
	time.Sleep(250 * time.Millisecond)
	s.Stop()

	gotA := atomic.LoadInt64(&a)
	gotB := atomic.LoadInt64(&b)

	// Широкие границы, чтобы избежать флака.
	// Идеал A ~ 250/20 = 12, B ~ 250/100 = 2.
	if gotA < 6 || gotA > 20 {
		t.Fatalf("задача A выполнилась %d раз, ожидалось примерно 6..20", gotA)
	}
	if gotB < 1 || gotB > 4 {
		t.Fatalf("задача B выполнилась %d раз, ожидалось примерно 1..4", gotB)
	}
	if gotA <= gotB {
		t.Fatalf("частая задача A (%d) должна выполняться чаще редкой B (%d)", gotA, gotB)
	}
}

// TestSchedulerStopClean: после Stop задачи больше не выполняются и нет утечки
// горутин.
func TestSchedulerStopClean(t *testing.T) {
	runtime.GC()
	base := runtime.NumGoroutine()

	s := NewScheduler(3)
	var cnt int64
	s.Add(10*time.Millisecond, func() { atomic.AddInt64(&cnt, 1) })
	s.Start()

	time.Sleep(100 * time.Millisecond)
	s.Stop()

	after := atomic.LoadInt64(&cnt)
	// Дать время «зомби»-запускам, если они есть, проявиться.
	time.Sleep(150 * time.Millisecond)
	final := atomic.LoadInt64(&cnt)

	if final != after {
		t.Fatalf("после Stop задача продолжила выполняться: было %d, стало %d", after, final)
	}

	// Дать горутинам осесть и проверить отсутствие утечки с запасом.
	settleGoroutines()
	leaked := runtime.NumGoroutine() - base
	if leaked > 5 {
		t.Fatalf("похоже на утечку горутин: прирост %d относительно базы %d", leaked, base)
	}
}

func settleGoroutines() {
	for i := 0; i < 20; i++ {
		runtime.GC()
		time.Sleep(20 * time.Millisecond)
	}
}
