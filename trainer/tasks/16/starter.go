package solution

// RateLimiter — ограничитель частоты по алгоритму token bucket.
type RateLimiter struct {
	// Ваши поля
}

// NewRateLimiter создаёт лимитер на rps разрешений в секунду.
func NewRateLimiter(rps int) *RateLimiter {
	// Ваша реализация
	return &RateLimiter{}
}

// Allow возвращает true, если операция укладывается в лимит.
// Метод не блокирует.
func (rl *RateLimiter) Allow() bool {
	// Ваша реализация
	return false
}
