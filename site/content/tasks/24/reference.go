package solution

import (
	"fmt"
	"sync"
)

// SafePool — пул воркеров, устойчивый к панике в задачах.
type SafePool struct {
	workers int
	tasks   <-chan func()
	errs    chan<- error
	wg      sync.WaitGroup
}

// NewSafePool создаёт пул из workers воркеров.
func NewSafePool(workers int, tasks <-chan func(), errs chan<- error) *SafePool {
	if workers < 1 {
		workers = 1
	}
	return &SafePool{
		workers: workers,
		tasks:   tasks,
		errs:    errs,
	}
}

// Start запускает воркеры.
func (p *SafePool) Start() {
	p.wg.Add(p.workers)
	for i := 0; i < p.workers; i++ {
		go p.worker()
	}
}

func (p *SafePool) worker() {
	defer p.wg.Done()
	for task := range p.tasks {
		p.runSafely(task)
	}
}

// runSafely выполняет одну задачу под защитой recover.
func (p *SafePool) runSafely(task func()) {
	defer func() {
		if r := recover(); r != nil {
			p.errs <- fmt.Errorf("паника в задаче: %v", r)
		}
	}()
	if task != nil {
		task()
	}
}

// Wait дожидается дренажа tasks и завершения всех воркеров.
func (p *SafePool) Wait() {
	p.wg.Wait()
}
