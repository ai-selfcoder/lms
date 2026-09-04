package solution

import (
	"testing"
	"time"
)

func TestProcessOrderedKeepsOrder(t *testing.T) {
	const n = 100
	in := make(chan int, n)
	for i := 0; i < n; i++ {
		in <- i
	}
	close(in)

	// Переменная задержка: некоторые поздние элементы завершаются раньше.
	work := func(x int) int {
		// Чем больше остаток от деления, тем дольше — порядок завершения
		// заведомо отличается от порядка поступления.
		d := time.Duration((n-x)%7) * time.Millisecond
		time.Sleep(d)
		return x * 2
	}

	out := ProcessOrdered(in, 10, work)

	got := make([]int, 0, n)
	done := make(chan struct{})
	go func() {
		for v := range out {
			got = append(got, v)
		}
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(20 * time.Second):
		t.Fatalf("ProcessOrdered: out не закрылся за отведённое время")
	}

	if len(got) != n {
		t.Fatalf("ProcessOrdered: получено %d результатов, ожидалось %d", len(got), n)
	}
	for i := 0; i < n; i++ {
		if got[i] != i*2 {
			t.Fatalf("ProcessOrdered: нарушен порядок на позиции %d: получено %d, ожидалось %d (полный срез: %v)",
				i, got[i], i*2, got)
		}
	}
}

func TestProcessOrderedEmpty(t *testing.T) {
	in := make(chan int)
	close(in)

	out := ProcessOrdered(in, 4, func(x int) int { return x })

	done := make(chan struct{})
	var count int
	go func() {
		for range out {
			count++
		}
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(10 * time.Second):
		t.Fatalf("ProcessOrdered: out не закрылся на пустом входе")
	}
	if count != 0 {
		t.Fatalf("ProcessOrdered: на пустом входе получено %d результатов, ожидалось 0", count)
	}
}

func TestProcessOrderedSingleWorker(t *testing.T) {
	const n = 30
	in := make(chan int, n)
	for i := 0; i < n; i++ {
		in <- i
	}
	close(in)

	out := ProcessOrdered(in, 1, func(x int) int { return x + 100 })

	got := make([]int, 0, n)
	done := make(chan struct{})
	go func() {
		for v := range out {
			got = append(got, v)
		}
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(10 * time.Second):
		t.Fatalf("ProcessOrdered: out не закрылся (1 воркер)")
	}

	if len(got) != n {
		t.Fatalf("ProcessOrdered: получено %d, ожидалось %d", len(got), n)
	}
	for i := 0; i < n; i++ {
		if got[i] != i+100 {
			t.Fatalf("ProcessOrdered: позиция %d = %d, ожидалось %d", i, got[i], i+100)
		}
	}
}
