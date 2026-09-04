package solution

import (
	"sync"
	"testing"
	"time"
)

func TestPriorityPoolOrder(t *testing.T) {
	pool := NewPriorityPool(1)
	pool.Start()

	// Блокер удерживает единственного воркера, пока мы наполняем очередь.
	blockerStarted := make(chan struct{})
	release := make(chan struct{})
	pool.Submit(Task{
		Priority: 2,
		Run: func() {
			close(blockerStarted)
			<-release
		},
	})

	// Ждём, пока воркер реально захватил блокер.
	select {
	case <-blockerStarted:
	case <-time.After(10 * time.Second):
		t.Fatalf("PriorityPool: воркер не начал выполнять блокирующую задачу")
	}

	var mu sync.Mutex
	var order []int
	record := func(p int) func() {
		return func() {
			mu.Lock()
			order = append(order, p)
			mu.Unlock()
		}
	}

	// Пока воркер занят, наполняем очередь смешанными приоритетами.
	pool.Submit(Task{Priority: 1, Run: record(1)})
	pool.Submit(Task{Priority: 3, Run: record(3)})
	pool.Submit(Task{Priority: 1, Run: record(1)})
	pool.Submit(Task{Priority: 3, Run: record(3)})
	pool.Submit(Task{Priority: 2, Run: record(2)})

	// Освобождаем воркера: он должен разобрать очередь по убыванию приоритета.
	close(release)

	// Submit не должен блокировать — проверка косвенно: мы дошли сюда мгновенно.
	pool.Stop()

	mu.Lock()
	defer mu.Unlock()

	if len(order) != 5 {
		t.Fatalf("PriorityPool: выполнено %d задач, ожидалось 5: %v", len(order), order)
	}

	// Ожидаем: сначала приоритет 3, потом 2, потом 1 (по убыванию).
	want := []int{3, 3, 2, 1, 1}
	for i := range want {
		if order[i] != want[i] {
			t.Fatalf("PriorityPool: нарушен приоритетный порядок: получено %v, ожидалось %v", order, want)
		}
	}
}

func TestPriorityPoolSubmitNonBlocking(t *testing.T) {
	pool := NewPriorityPool(2)
	pool.Start()

	// Много Submit подряд не должны заблокировать вызывающего.
	done := make(chan struct{})
	go func() {
		for i := 0; i < 1000; i++ {
			pool.Submit(Task{Priority: (i % 3) + 1, Run: func() {}})
		}
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(10 * time.Second):
		t.Fatalf("PriorityPool: Submit заблокировал вызывающую сторону")
	}

	pool.Stop()
}
