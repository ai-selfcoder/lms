package solution

// SafePool — пул воркеров, устойчивый к панике в задачах.
type SafePool struct {
	// Ваши поля
}

// NewSafePool создаёт пул из workers воркеров, читающих задачи из tasks.
// При панике в задаче ошибка отправляется в errs, воркер продолжает работу.
func NewSafePool(workers int, tasks <-chan func(), errs chan<- error) *SafePool {
	// Ваша реализация
	return &SafePool{}
}

// Start запускает воркеры.
func (p *SafePool) Start() {
	// Ваша реализация
}

// Wait блокируется до дренажа tasks и завершения всех воркеров.
func (p *SafePool) Wait() {
	// Ваша реализация
}
