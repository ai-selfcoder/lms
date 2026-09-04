package solution

import (
	"sync"
	"time"
)

// Pool — воркер-пул с graceful shutdown по таймауту.
//
// Воркеры читают задачи из входного канала. На время выполнения задача
// регистрируется в множестве inFlight (по ID). При Stop вход «закрывается»
// (воркеры перестают брать новые задачи), затем мы ждём завершения текущих
// не дольше timeout; всё, что осталось в inFlight по истечении таймаута, —
// и есть незавершённые задачи.
type Pool struct {
	tasks   <-chan Job
	workers int

	done chan struct{} // сигнал воркерам прекратить приём новых задач
	wg   sync.WaitGroup

	mu       sync.Mutex
	inFlight map[int]struct{}
}

// NewPool создаёт пул из workers воркеров, читающих задачи из tasks.
func NewPool(workers int, tasks <-chan Job) *Pool {
	return &Pool{
		tasks:    tasks,
		workers:  workers,
		done:     make(chan struct{}),
		inFlight: make(map[int]struct{}),
	}
}

// Start запускает воркеров.
func (p *Pool) Start() {
	for i := 0; i < p.workers; i++ {
		p.wg.Add(1)
		go p.worker()
	}
}

func (p *Pool) worker() {
	defer p.wg.Done()
	for {
		select {
		case <-p.done:
			return
		case job, ok := <-p.tasks:
			if !ok {
				return
			}
			p.markStart(job.ID)
			if job.Run != nil {
				job.Run()
			}
			p.markDone(job.ID)
		}
	}
}

func (p *Pool) markStart(id int) {
	p.mu.Lock()
	p.inFlight[id] = struct{}{}
	p.mu.Unlock()
}

func (p *Pool) markDone(id int) {
	p.mu.Lock()
	delete(p.inFlight, id)
	p.mu.Unlock()
}

// Stop прекращает приём новых задач, даёт текущим время timeout доделаться.
// Возвращает ID задач, НЕ успевших завершиться за timeout.
func (p *Pool) Stop(timeout time.Duration) []int {
	// Перестаём принимать новые задачи.
	close(p.done)

	// Ждём завершения текущих задач, но не дольше timeout.
	finished := make(chan struct{})
	go func() {
		p.wg.Wait()
		close(finished)
	}()

	select {
	case <-finished:
	case <-time.After(timeout):
	}

	// Те, кто всё ещё в полёте, — незавершённые.
	p.mu.Lock()
	unfinished := make([]int, 0, len(p.inFlight))
	for id := range p.inFlight {
		unfinished = append(unfinished, id)
	}
	p.mu.Unlock()
	return unfinished
}
