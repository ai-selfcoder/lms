package solution

import "time"

// Pool — воркер-пул с graceful shutdown по таймауту.
type Pool struct {
	tasks   <-chan Job
	workers int
}

// NewPool создаёт пул из workers воркеров, читающих задачи из tasks.
func NewPool(workers int, tasks <-chan Job) *Pool {
	return &Pool{tasks: tasks, workers: workers}
}

// Start запускает воркеров.
func (p *Pool) Start() {
	// TODO: запустить воркеров, читающих из p.tasks.
}

// Stop прекращает приём новых задач, даёт текущим время timeout доделаться.
// Возвращает ID задач, НЕ успевших завершиться за timeout.
func (p *Pool) Stop(timeout time.Duration) []int {
	// TODO: дождаться завершения с таймаутом, вернуть ID незавершённых.
	_ = timeout
	return nil
}
