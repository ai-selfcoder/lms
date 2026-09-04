package solution

// ScalingPool — пул воркеров с динамическим масштабированием.
type ScalingPool struct {
	// Ваши поля
}

// NewScalingPool создаёт пул, читающий задачи из канала tasks. Число
// воркеров динамически меняется в диапазоне [minWorkers, maxWorkers].
func NewScalingPool(minWorkers, maxWorkers int, tasks <-chan func()) *ScalingPool {
	// Ваша реализация
	return &ScalingPool{}
}

// Start запускает пул.
func (p *ScalingPool) Start() {
	// Ваша реализация
}

// Stop корректно останавливает все воркеры и ожидает их завершения.
func (p *ScalingPool) Stop() {
	// Ваша реализация
}

// Peak возвращает максимальное число одновременно работавших воркеров.
func (p *ScalingPool) Peak() int {
	// Ваша реализация
	return 0
}
