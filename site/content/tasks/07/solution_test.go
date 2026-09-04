package solution

import (
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestInitializerRunsOnce(t *testing.T) {
	var calls int64
	init := func() error {
		atomic.AddInt64(&calls, 1)
		time.Sleep(20 * time.Millisecond)
		return nil
	}
	in := NewInitializer(init)

	const n = 200
	var wg sync.WaitGroup
	wg.Add(n)
	errs := make([]error, n)
	for k := 0; k < n; k++ {
		go func(k int) {
			defer wg.Done()
			errs[k] = in.Do()
		}(k)
	}
	wg.Wait()

	if got := atomic.LoadInt64(&calls); got != 1 {
		t.Fatalf("init вызвана %d раз, ожидалось ровно 1", got)
	}
	for k, e := range errs {
		if e != nil {
			t.Fatalf("вызывающий %d получил ошибку %v, ожидалось nil", k, e)
		}
	}
}

func TestInitializerPropagatesError(t *testing.T) {
	sentinel := errors.New("boom")
	var calls int64
	init := func() error {
		atomic.AddInt64(&calls, 1)
		time.Sleep(20 * time.Millisecond)
		return sentinel
	}
	in := NewInitializer(init)

	const n = 200
	var wg sync.WaitGroup
	wg.Add(n)
	errs := make([]error, n)
	for k := 0; k < n; k++ {
		go func(k int) {
			defer wg.Done()
			errs[k] = in.Do()
		}(k)
	}
	wg.Wait()

	if got := atomic.LoadInt64(&calls); got != 1 {
		t.Fatalf("init вызвана %d раз, ожидалось ровно 1", got)
	}
	for k, e := range errs {
		if !errors.Is(e, sentinel) {
			t.Fatalf("вызывающий %d получил ошибку %v, ожидалось %v", k, e, sentinel)
		}
	}

	// Повторный вызов после завершения тоже отдаёт ту же ошибку и не запускает init.
	if e := in.Do(); !errors.Is(e, sentinel) {
		t.Fatalf("повторный Do() вернул %v, ожидалось %v", e, sentinel)
	}
	if got := atomic.LoadInt64(&calls); got != 1 {
		t.Fatalf("после повторного Do() init вызвана %d раз, ожидалось ровно 1", got)
	}
}
