package solution

import "sync"

// MyWaitGroup — собственная реализация sync.WaitGroup на базе sync.Mutex и
// sync.Cond. sync.WaitGroup и sync/atomic не используются.
type MyWaitGroup struct {
	mu      sync.Mutex
	cond    *sync.Cond
	counter int
}

// ensureCond лениво инициализирует условную переменную. Вызывается под mu.
func (wg *MyWaitGroup) ensureCond() {
	if wg.cond == nil {
		wg.cond = sync.NewCond(&wg.mu)
	}
}

// Add изменяет счётчик незавершённых задач на delta.
func (wg *MyWaitGroup) Add(delta int) {
	wg.mu.Lock()
	defer wg.mu.Unlock()
	wg.ensureCond()
	wg.counter += delta
	if wg.counter < 0 {
		panic("MyWaitGroup: отрицательный счётчик")
	}
	if wg.counter == 0 {
		wg.cond.Broadcast()
	}
}

// Done уменьшает счётчик на единицу.
func (wg *MyWaitGroup) Done() {
	wg.Add(-1)
}

// Wait блокируется, пока счётчик не станет равным нулю.
func (wg *MyWaitGroup) Wait() {
	wg.mu.Lock()
	defer wg.mu.Unlock()
	wg.ensureCond()
	for wg.counter != 0 {
		wg.cond.Wait()
	}
}
