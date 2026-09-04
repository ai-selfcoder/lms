package solution

import (
	"runtime"
	"sync/atomic"
	"testing"
	"time"
)

func TestScalingPoolAllTasksRunOnce(t *testing.T) {
	const total = 200

	// Буферизованный канал создаёт бэклог, чтобы пул мог масштабироваться.
	tasks := make(chan func(), total)
	var done int64
	for i := 0; i < total; i++ {
		tasks <- func() {
			time.Sleep(5 * time.Millisecond)
			atomic.AddInt64(&done, 1)
		}
	}

	pool := NewScalingPool(2, 16, tasks)
	pool.Start()

	deadline := time.After(8 * time.Second)
	for atomic.LoadInt64(&done) < total {
		select {
		case <-deadline:
			t.Fatalf("ScalingPool: за отведённое время выполнено %d из %d задач",
				atomic.LoadInt64(&done), total)
		default:
			time.Sleep(2 * time.Millisecond)
		}
	}

	if got := atomic.LoadInt64(&done); got != total {
		t.Fatalf("ScalingPool: выполнено %d задач, ожидалось ровно %d", got, total)
	}

	if peak := pool.Peak(); peak <= 2 {
		t.Fatalf("ScalingPool: пул не масштабировался под нагрузкой, Peak=%d (ожидалось > minWorkers=2)", peak)
	}
	if peak := pool.Peak(); peak > 16 {
		t.Fatalf("ScalingPool: превышен maxWorkers: Peak=%d > 16", peak)
	}

	pool.Stop()
}

func TestScalingPoolNoGoroutineLeak(t *testing.T) {
	runtime.GC()
	time.Sleep(50 * time.Millisecond)
	base := runtime.NumGoroutine()

	const total = 50
	tasks := make(chan func(), total)
	var done int64
	for i := 0; i < total; i++ {
		tasks <- func() {
			time.Sleep(2 * time.Millisecond)
			atomic.AddInt64(&done, 1)
		}
	}

	pool := NewScalingPool(2, 8, tasks)
	pool.Start()

	deadline := time.After(8 * time.Second)
	for atomic.LoadInt64(&done) < total {
		select {
		case <-deadline:
			t.Fatalf("ScalingPool: выполнено %d из %d задач", atomic.LoadInt64(&done), total)
		default:
			time.Sleep(2 * time.Millisecond)
		}
	}

	pool.Stop()

	// Даём горутинам устаканиться.
	var leaked int
	for i := 0; i < 50; i++ {
		runtime.GC()
		time.Sleep(40 * time.Millisecond)
		leaked = runtime.NumGoroutine()
		if leaked <= base+2 {
			return
		}
	}
	t.Fatalf("ScalingPool: после Stop осталось слишком много горутин: было %d, стало %d (утечка)", base, leaked)
}
