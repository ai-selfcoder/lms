package solution

import (
	"sync/atomic"
	"testing"
	"time"
)

// TestElasticScalesAndShrinks: всплеск задач поднимает воркеров выше минимума,
// после простоя число воркеров возвращается к минимуму.
func TestElasticScalesAndShrinks(t *testing.T) {
	const (
		minW        = 2
		maxW        = 16
		idleTimeout = 50 * time.Millisecond
		nTasks      = 100
	)

	tasks := make(chan func())
	p := NewElasticPool(minW, maxW, idleTimeout, tasks)
	p.Start()
	defer p.Stop()

	var done int64

	// Бёрст из 100 задач, каждая спит ~5ms.
	go func() {
		for i := 0; i < nTasks; i++ {
			tasks <- func() {
				time.Sleep(5 * time.Millisecond)
				atomic.AddInt64(&done, 1)
			}
		}
	}()

	// Ждём выполнения всех задач (с большим запасом).
	deadline := time.After(15 * time.Second)
	for atomic.LoadInt64(&done) < nTasks {
		select {
		case <-deadline:
			t.Fatalf("выполнено лишь %d из %d задач", atomic.LoadInt64(&done), nTasks)
		case <-time.After(2 * time.Millisecond):
		}
	}

	if got := atomic.LoadInt64(&done); got != nTasks {
		t.Fatalf("выполнено %d задач, ожидалось %d", got, nTasks)
	}

	// Под нагрузкой пул должен был подняться выше минимума.
	if peak := p.Peak(); peak <= minW {
		t.Fatalf("пиковое число воркеров %d, ожидалось > %d (пул должен расширяться под нагрузкой)", peak, minW)
	}
	if peak := p.Peak(); peak > maxW {
		t.Fatalf("пиковое число воркеров %d превысило максимум %d", peak, maxW)
	}

	// Даём пулу простоять дольше idleTimeout — лишние воркеры должны выйти.
	time.Sleep(300 * time.Millisecond)

	active := p.Active()
	if active < minW {
		t.Fatalf("после простоя активных воркеров %d, ожидалось не меньше минимума %d", active, minW)
	}
	if active > minW+2 {
		t.Fatalf("после простоя активных воркеров %d, ожидалось около минимума %d (лишние должны уснуть)", active, minW)
	}
}

// TestElasticStopClean: Stop завершается без зависаний.
func TestElasticStopClean(t *testing.T) {
	tasks := make(chan func())
	p := NewElasticPool(2, 8, 50*time.Millisecond, tasks)
	p.Start()

	var cnt int64
	go func() {
		for i := 0; i < 10; i++ {
			tasks <- func() { atomic.AddInt64(&cnt, 1) }
		}
	}()

	// Дать задачам отработать.
	time.Sleep(100 * time.Millisecond)

	doneCh := make(chan struct{})
	go func() {
		p.Stop()
		close(doneCh)
	}()
	select {
	case <-doneCh:
	case <-time.After(10 * time.Second):
		t.Fatalf("Stop не завершился вовремя")
	}

	if got := atomic.LoadInt64(&cnt); got == 0 {
		t.Fatalf("ни одна задача не выполнилась")
	}
}
