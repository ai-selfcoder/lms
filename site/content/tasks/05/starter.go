package solution

// MutexCounter — потокобезопасный счётчик на основе sync.Mutex.
type MutexCounter struct {
	// Ваши поля
}

// Inc атомарно увеличивает счётчик на единицу.
func (c *MutexCounter) Inc() {
	// Ваша реализация
}

// Value возвращает текущее значение счётчика.
func (c *MutexCounter) Value() int64 {
	// Ваша реализация
	return 0
}

// AtomicCounter — потокобезопасный счётчик на основе sync/atomic.
type AtomicCounter struct {
	// Ваши поля
}

// Inc атомарно увеличивает счётчик на единицу.
func (c *AtomicCounter) Inc() {
	// Ваша реализация
}

// Value возвращает текущее значение счётчика.
func (c *AtomicCounter) Value() int64 {
	// Ваша реализация
	return 0
}
