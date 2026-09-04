package solution

import (
	"sync"
	"time"
)

// scheduledJob — зарегистрированная периодическая задача.
type scheduledJob struct {
	interval time.Duration
	job      func()
}

// Scheduler — планировщик периодических задач на воркер-пуле.
//
// На каждую задачу заводится горутина с time.Ticker, которая по тику кладёт
// функцию задачи в общий канал tasks. Пул из workers воркеров разбирает канал
// и выполняет функции. Stop закрывает quit (останавливает тикеры), затем
// закрывает tasks и дожидается воркеров.
type Scheduler struct {
	workers int
	jobs    []scheduledJob

	tasks chan func()
	quit  chan struct{}

	tickerWG sync.WaitGroup
	workerWG sync.WaitGroup

	stopOnce sync.Once
}

// NewScheduler создаёт планировщик с пулом из workers воркеров.
func NewScheduler(workers int) *Scheduler {
	return &Scheduler{
		workers: workers,
		tasks:   make(chan func(), 1024),
		quit:    make(chan struct{}),
	}
}

// Add регистрирует задачу job, которую нужно запускать каждые interval.
func (s *Scheduler) Add(interval time.Duration, job func()) {
	s.jobs = append(s.jobs, scheduledJob{interval: interval, job: job})
}

// Start запускает планировщик: тикеры и воркеры.
func (s *Scheduler) Start() {
	for i := 0; i < s.workers; i++ {
		s.workerWG.Add(1)
		go s.worker()
	}
	for _, j := range s.jobs {
		s.tickerWG.Add(1)
		go s.runTicker(j)
	}
}

func (s *Scheduler) worker() {
	defer s.workerWG.Done()
	for fn := range s.tasks {
		fn()
	}
}

func (s *Scheduler) runTicker(j scheduledJob) {
	defer s.tickerWG.Done()
	ticker := time.NewTicker(j.interval)
	defer ticker.Stop()
	for {
		select {
		case <-s.quit:
			return
		case <-ticker.C:
			// Не блокируемся навсегда: если планировщик остановлен
			// между тиком и отправкой — выходим.
			select {
			case s.tasks <- j.job:
			case <-s.quit:
				return
			}
		}
	}
}

// Stop корректно останавливает планировщик: тикеры и воркеры завершаются.
func (s *Scheduler) Stop() {
	s.stopOnce.Do(func() {
		// Останавливаем тикеры.
		close(s.quit)
		s.tickerWG.Wait()
		// Закрываем канал задач и дожидаемся воркеров.
		close(s.tasks)
		s.workerWG.Wait()
	})
}
