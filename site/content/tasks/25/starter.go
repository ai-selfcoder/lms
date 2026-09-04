package solution

// PriorityPool — пул воркеров с приоритетной очередью.
type PriorityPool struct {
	// Ваши поля
}

// NewPriorityPool создаёт пул из workers воркеров.
func NewPriorityPool(workers int) *PriorityPool {
	// Ваша реализация
	return &PriorityPool{}
}

// Submit добавляет задачу в очередь. Не блокирует вызывающую сторону.
func (p *PriorityPool) Submit(t Task) {
	// Ваша реализация
}

// Start запускает воркеры.
func (p *PriorityPool) Start() {
	// Ваша реализация
}

// Stop дренирует очередь и останавливает пул.
func (p *PriorityPool) Stop() {
	// Ваша реализация
}
