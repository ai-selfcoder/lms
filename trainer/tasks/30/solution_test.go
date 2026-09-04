package solution

import (
	"sort"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// TestGracefulShutdownTimeout: быстрые задачи успевают завершиться,
// медленные (> timeout) попадают в список незавершённых.
func TestGracefulShutdownTimeout(t *testing.T) {
	tasks := make(chan Job, 16)
	p := NewPool(4, tasks)
	p.Start()

	var quickDone int64

	// Быстрые задачи: ID 1..3, длительность 10ms (<< timeout=100ms).
	quickIDs := []int{1, 2, 3}
	// Медленные задачи: ID 100, 101, длительность 1s (>> timeout).
	slowIDs := []int{100, 101}

	// Сигнал, что обе медленные задачи реально начали выполняться.
	var slowStarted sync.WaitGroup
	slowStarted.Add(len(slowIDs))

	// Подаём быстрые задачи и ждём их завершения, чтобы тест был
	// детерминированным.
	var quickWG sync.WaitGroup
	quickWG.Add(len(quickIDs))
	go func() {
		for _, id := range quickIDs {
			id := id
			tasks <- Job{ID: id, Run: func() {
				time.Sleep(10 * time.Millisecond)
				atomic.AddInt64(&quickDone, 1)
				quickWG.Done()
			}}
		}
	}()
	quickDoneCh := make(chan struct{})
	go func() {
		quickWG.Wait()
		close(quickDoneCh)
	}()
	select {
	case <-quickDoneCh:
	case <-time.After(10 * time.Second):
		t.Fatalf("быстрые задачи не завершились вовремя")
	}

	// Подаём медленные задачи и ждём, пока обе захватят воркеров.
	go func() {
		for _, id := range slowIDs {
			id := id
			tasks <- Job{ID: id, Run: func() {
				slowStarted.Done()
				time.Sleep(1 * time.Second)
			}}
		}
	}()

	// Ждём, что обе медленные задачи стартовали (с большим запасом).
	startedCh := make(chan struct{})
	go func() {
		slowStarted.Wait()
		close(startedCh)
	}()
	select {
	case <-startedCh:
	case <-time.After(10 * time.Second):
		t.Fatalf("медленные задачи не стартовали вовремя")
	}

	// Останавливаемся с коротким таймаутом — медленные не успеют.
	unfinished := p.Stop(100 * time.Millisecond)

	if got := atomic.LoadInt64(&quickDone); got != int64(len(quickIDs)) {
		t.Fatalf("быстрых задач завершилось %d, ожидалось %d", got, len(quickIDs))
	}

	got := append([]int(nil), unfinished...)
	sort.Ints(got)
	want := append([]int(nil), slowIDs...)
	sort.Ints(want)

	if len(got) != len(want) {
		t.Fatalf("незавершённых задач %v, ожидалось %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("незавершённые задачи %v, ожидалось %v", got, want)
		}
	}
}

// TestStopReturnsPromptly: Stop возвращается примерно за timeout, не дожидаясь
// медленной задачи в 1s.
func TestStopReturnsPromptly(t *testing.T) {
	tasks := make(chan Job)
	p := NewPool(2, tasks)
	p.Start()

	started := make(chan struct{})
	go func() {
		tasks <- Job{ID: 7, Run: func() {
			close(started)
			time.Sleep(1 * time.Second)
		}}
	}()

	select {
	case <-started:
	case <-time.After(10 * time.Second):
		t.Fatalf("задача не стартовала")
	}

	begin := time.Now()
	unfinished := p.Stop(100 * time.Millisecond)
	elapsed := time.Since(begin)

	if elapsed > 5*time.Second {
		t.Fatalf("Stop вернулся за %v, ожидалось около таймаута (не дожидаясь 1s задачи)", elapsed)
	}
	if len(unfinished) != 1 || unfinished[0] != 7 {
		t.Fatalf("незавершённые задачи %v, ожидалось [7]", unfinished)
	}
}
