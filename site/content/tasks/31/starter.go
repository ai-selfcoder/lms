package solution

import "time"

// scheduledJob — зарегистрированная периодическая задача.
type scheduledJob struct {
	interval time.Duration
	job      func()
}

// Scheduler — планировщик периодических задач на воркер-пуле.
type Scheduler struct {
	workers int
	jobs    []scheduledJob
}

// NewScheduler создаёт планировщик с пулом из workers воркеров.
func NewScheduler(workers int) *Scheduler {
	return &Scheduler{workers: workers}
}

// Add регистрирует задачу job, которую нужно запускать каждые interval.
func (s *Scheduler) Add(interval time.Duration, job func()) {
	s.jobs = append(s.jobs, scheduledJob{interval: interval, job: job})
}

// Start запускает планировщик: тикеры и воркеры.
func (s *Scheduler) Start() {
	// TODO: запустить воркеров и тикеры для каждой задачи.
}

// Stop корректно останавливает планировщик: тикеры и воркеры завершаются.
func (s *Scheduler) Stop() {
	// TODO: остановить тикеры и воркеров.
}
