package solution

// CtxPool — пул воркеров с учётом контекста каждой задачи.
type CtxPool struct{}

// NewCtxPool создаёт пул на workers воркеров.
func NewCtxPool(workers int) *CtxPool {
	// Ваша реализация
	return &CtxPool{}
}

// Submit ставит задачу в очередь.
func (p *CtxPool) Submit(t CtxTask) {
	// Ваша реализация
}

// Start запускает воркеров.
func (p *CtxPool) Start() {
	// Ваша реализация
}

// Stop останавливает пул без утечек горутин.
func (p *CtxPool) Stop() {
	// Ваша реализация
}
