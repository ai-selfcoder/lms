package solution

import (
	"sync"
	"sync/atomic"
)

// MutexCounter — потокобезопасный счётчик на основе sync.Mutex.
type MutexCounter struct {
	mu sync.Mutex
	n  int64
}

// Inc атомарно увеличивает счётчик на единицу.
func (c *MutexCounter) Inc() {
	c.mu.Lock()
	c.n++
	c.mu.Unlock()
}

// Value возвращает текущее значение счётчика.
func (c *MutexCounter) Value() int64 {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.n
}

// AtomicCounter — потокобезопасный счётчик на основе sync/atomic.
type AtomicCounter struct {
	n int64
}

// Inc атомарно увеличивает счётчик на единицу.
func (c *AtomicCounter) Inc() {
	atomic.AddInt64(&c.n, 1)
}

// Value возвращает текущее значение счётчика.
func (c *AtomicCounter) Value() int64 {
	return atomic.LoadInt64(&c.n)
}
