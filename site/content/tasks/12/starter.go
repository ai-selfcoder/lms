package solution

// Batcher накапливает события и сбрасывает их пачкой по размеру или по таймеру.
type Batcher struct {
	// Ваши поля
}

// NewBatcher создаёт Batcher: flush при накоплении 100 событий ИЛИ через 50ms
// после последнего сброса.
func NewBatcher(flush func(batch []Event)) *Batcher {
	// Ваша реализация
	return nil
}

// Add добавляет событие в батчер.
func (b *Batcher) Add(event Event) {
	// Ваша реализация
}

// Stop сбрасывает остаток и корректно останавливает фоновую горутину.
func (b *Batcher) Stop() {
	// Ваша реализация
}
