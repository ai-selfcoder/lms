package solution

import "time"

// LeakyBucket — ограничитель по алгоритму leaky bucket.
type LeakyBucket struct {
	// Ваши поля
}

// NewLeakyBucket создаёт ведро, пропускающее 1 запрос раз в interval.
func NewLeakyBucket(interval time.Duration) *LeakyBucket {
	// Ваша реализация
	return &LeakyBucket{}
}

// Acquire блокирует вызывающую горутину до её очереди.
func (lb *LeakyBucket) Acquire() {
	// Ваша реализация
}

// Stop останавливает внутренний таймер.
func (lb *LeakyBucket) Stop() {
	// Ваша реализация
}
