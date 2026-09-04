package solution

import (
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// TestSingleflightDedup: 20 параллельных Do с одним ключом → fn один раз.
func TestSingleflightDedup(t *testing.T) {
	var g Group

	var calls int64
	const n = 20

	// release удерживает fn, пока все горутины не войдут в Do,
	// чтобы вызовы гарантированно слились в один.
	release := make(chan struct{})
	var started sync.WaitGroup
	started.Add(n)

	fn := func() (interface{}, error) {
		atomic.AddInt64(&calls, 1)
		<-release
		return "value-42", errors.New("boom")
	}

	results := make([]interface{}, n)
	errs := make([]error, n)
	var wg sync.WaitGroup
	wg.Add(n)
	for i := 0; i < n; i++ {
		go func(idx int) {
			defer wg.Done()
			started.Done()
			v, err := g.Do("same-key", fn)
			results[idx] = v
			errs[idx] = err
		}(i)
	}

	// Дожидаемся, пока все горутины зайдут в Do, и только потом
	// отпускаем fn — так все обязаны разделить один вызов.
	started.Wait()
	time.Sleep(50 * time.Millisecond)
	close(release)

	wg.Wait()

	if got := atomic.LoadInt64(&calls); got != 1 {
		t.Fatalf("fn выполнилась %d раз, ожидалось 1", got)
	}
	for i := 0; i < n; i++ {
		if results[i] != "value-42" {
			t.Fatalf("горутина %d получила значение %v, ожидалось value-42", i, results[i])
		}
		if errs[i] == nil || errs[i].Error() != "boom" {
			t.Fatalf("горутина %d получила ошибку %v, ожидалось boom", i, errs[i])
		}
	}
}

// TestSingleflightDifferentKeys: разные ключи → fn выполняется на каждый ключ.
func TestSingleflightDifferentKeys(t *testing.T) {
	var g Group

	var calls int64
	v, err := g.Do("a", func() (interface{}, error) {
		atomic.AddInt64(&calls, 1)
		return 1, nil
	})
	if err != nil || v != 1 {
		t.Fatalf("Do(a) = (%v, %v), ожидалось (1, nil)", v, err)
	}
	v, err = g.Do("b", func() (interface{}, error) {
		atomic.AddInt64(&calls, 1)
		return 2, nil
	})
	if err != nil || v != 2 {
		t.Fatalf("Do(b) = (%v, %v), ожидалось (2, nil)", v, err)
	}
	if got := atomic.LoadInt64(&calls); got != 2 {
		t.Fatalf("для разных ключей fn выполнилась %d раз, ожидалось 2", got)
	}
}

// TestSingleflightSequentialReuse: после завершения волны ключ можно вызвать снова.
func TestSingleflightSequentialReuse(t *testing.T) {
	var g Group
	var calls int64
	fn := func() (interface{}, error) {
		atomic.AddInt64(&calls, 1)
		return "x", nil
	}
	g.Do("k", fn)
	g.Do("k", fn)
	if got := atomic.LoadInt64(&calls); got != 2 {
		t.Fatalf("последовательные Do(k) дали %d выполнений, ожидалось 2", got)
	}
}
