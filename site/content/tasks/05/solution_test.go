package solution

import (
	"sync"
	"testing"
)

const (
	goroutines = 1000
	perGo      = 1000
	wantTotal  = int64(goroutines * perGo)
)

func TestMutexCounter(t *testing.T) {
	c := &MutexCounter{}
	var wg sync.WaitGroup
	wg.Add(goroutines)
	for i := 0; i < goroutines; i++ {
		go func() {
			defer wg.Done()
			for j := 0; j < perGo; j++ {
				c.Inc()
			}
		}()
	}
	wg.Wait()
	if got := c.Value(); got != wantTotal {
		t.Fatalf("MutexCounter.Value() = %d, ожидалось %d", got, wantTotal)
	}
}

func TestAtomicCounter(t *testing.T) {
	c := &AtomicCounter{}
	var wg sync.WaitGroup
	wg.Add(goroutines)
	for i := 0; i < goroutines; i++ {
		go func() {
			defer wg.Done()
			for j := 0; j < perGo; j++ {
				c.Inc()
			}
		}()
	}
	wg.Wait()
	if got := c.Value(); got != wantTotal {
		t.Fatalf("AtomicCounter.Value() = %d, ожидалось %d", got, wantTotal)
	}
}

func TestCountersZeroValue(t *testing.T) {
	m := &MutexCounter{}
	if got := m.Value(); got != 0 {
		t.Fatalf("новый MutexCounter.Value() = %d, ожидалось 0", got)
	}
	a := &AtomicCounter{}
	if got := a.Value(); got != 0 {
		t.Fatalf("новый AtomicCounter.Value() = %d, ожидалось 0", got)
	}
}
