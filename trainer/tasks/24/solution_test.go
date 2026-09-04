package solution

import (
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestSafePoolPanicsHandled(t *testing.T) {
	const normalCount = 300
	const panicCount = 100
	const total = normalCount + panicCount

	tasks := make(chan func(), total)
	errs := make(chan error, total)

	var executed int64
	for i := 0; i < normalCount; i++ {
		tasks <- func() {
			atomic.AddInt64(&executed, 1)
		}
	}
	for i := 0; i < panicCount; i++ {
		tasks <- func() {
			panic("boom")
		}
	}
	close(tasks)

	// Собираем ошибки в отдельной горутине.
	var errCount int64
	var collectWg sync.WaitGroup
	collectWg.Add(1)
	go func() {
		defer collectWg.Done()
		for range errs {
			atomic.AddInt64(&errCount, 1)
		}
	}()

	pool := NewSafePool(8, tasks, errs)
	pool.Start()

	done := make(chan struct{})
	go func() {
		pool.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(20 * time.Second):
		t.Fatalf("SafePool: Wait не завершился за отведённое время (возможна паника, обрушившая воркер)")
	}

	close(errs)
	collectWg.Wait()

	if got := atomic.LoadInt64(&executed); got != normalCount {
		t.Fatalf("SafePool: выполнено %d нормальных задач, ожидалось %d", got, normalCount)
	}
	if got := atomic.LoadInt64(&errCount); got != panicCount {
		t.Fatalf("SafePool: получено %d ошибок, ожидалось %d (по числу паникующих задач)", got, panicCount)
	}
}

func TestSafePoolContinuesAfterPanic(t *testing.T) {
	// Чередуем панику и нормальную задачу: воркер должен продолжать работать.
	const pairs = 50
	tasks := make(chan func(), pairs*2)
	errs := make(chan error, pairs*2)

	var executed int64
	for i := 0; i < pairs; i++ {
		tasks <- func() { panic("fail") }
		tasks <- func() { atomic.AddInt64(&executed, 1) }
	}
	close(tasks)

	var errCount int64
	var collectWg sync.WaitGroup
	collectWg.Add(1)
	go func() {
		defer collectWg.Done()
		for range errs {
			atomic.AddInt64(&errCount, 1)
		}
	}()

	pool := NewSafePool(1, tasks, errs)
	pool.Start()

	done := make(chan struct{})
	go func() {
		pool.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(20 * time.Second):
		t.Fatalf("SafePool: воркер не продолжил работу после паники")
	}

	close(errs)
	collectWg.Wait()

	if got := atomic.LoadInt64(&executed); got != pairs {
		t.Fatalf("SafePool: после паник выполнено %d нормальных задач, ожидалось %d", got, pairs)
	}
	if got := atomic.LoadInt64(&errCount); got != pairs {
		t.Fatalf("SafePool: получено %d ошибок, ожидалось %d", got, pairs)
	}
}
