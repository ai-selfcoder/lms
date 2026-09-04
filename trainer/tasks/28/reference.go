package solution

import "sync"

// CtxPool — пул воркеров с учётом контекста каждой задачи.
type CtxPool struct {
	workers int
	tasks   chan CtxTask
	wg      sync.WaitGroup
	once    sync.Once
}

// NewCtxPool создаёт пул на workers воркеров.
func NewCtxPool(workers int) *CtxPool {
	if workers < 1 {
		workers = 1
	}
	return &CtxPool{
		workers: workers,
		tasks:   make(chan CtxTask),
	}
}

// Submit ставит задачу в очередь.
func (p *CtxPool) Submit(t CtxTask) {
	p.tasks <- t
}

// Start запускает воркеров.
func (p *CtxPool) Start() {
	p.wg.Add(p.workers)
	for i := 0; i < p.workers; i++ {
		go p.work()
	}
}

func (p *CtxPool) work() {
	defer p.wg.Done()
	for t := range p.tasks {
		if t.Run == nil {
			continue
		}
		ctx := t.Ctx
		if ctx == nil {
			// Без контекста — просто выполняем.
			t.Run(nil)
			continue
		}
		// Выполняем задачу. Если её контекст отменён, Run обязан
		// оперативно вернуться, после чего воркер свободен.
		select {
		case <-ctx.Done():
			// Контекст уже отменён до старта — пропускаем выполнение.
			continue
		default:
			t.Run(ctx)
		}
	}
}

// Stop останавливает пул без утечек горутин.
func (p *CtxPool) Stop() {
	p.once.Do(func() {
		close(p.tasks)
	})
	p.wg.Wait()
}
