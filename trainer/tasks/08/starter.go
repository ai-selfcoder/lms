package solution

// MyWaitGroup — собственная реализация sync.WaitGroup.
// Запрещено использовать sync.WaitGroup и sync/atomic для счётчика;
// используйте каналы и/или sync.Mutex / sync.Cond.
type MyWaitGroup struct {
	// Ваши поля
}

// Add изменяет счётчик незавершённых задач на delta.
func (wg *MyWaitGroup) Add(delta int) {
	// Ваша реализация
}

// Done уменьшает счётчик на единицу.
func (wg *MyWaitGroup) Done() {
	// Ваша реализация
}

// Wait блокируется, пока счётчик не станет равным нулю.
func (wg *MyWaitGroup) Wait() {
	// Ваша реализация
}
