package solution

import (
	"sync"
	"time"
)

// RateLimiter — ограничитель частоты по алгоритму token bucket.
//
// Бакет вмещает до rps токенов и полностью пополняется раз в секунду.
// Каждый разрешённый Allow() тратит один токен.
type RateLimiter struct {
	mu       sync.Mutex
	rps      int
	tokens   int
	lastFill time.Time
	now      func() time.Time
}

// NewRateLimiter создаёт лимитер на rps разрешений в секунду.
func NewRateLimiter(rps int) *RateLimiter {
	return &RateLimiter{
		rps:      rps,
		tokens:   rps,
		lastFill: time.Now(),
		now:      time.Now,
	}
}

// Allow возвращает true, если операция укладывается в лимит.
// Метод не блокирует.
func (rl *RateLimiter) Allow() bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := rl.now()
	// Пополнение: за прошедшее время добавляем rps токенов в секунду,
	// но не превышаем ёмкость бакета.
	elapsed := now.Sub(rl.lastFill)
	if elapsed > 0 {
		add := int(float64(rl.rps) * elapsed.Seconds())
		if add > 0 {
			rl.tokens += add
			if rl.tokens > rl.rps {
				rl.tokens = rl.rps
			}
			rl.lastFill = now
		}
	}

	if rl.tokens > 0 {
		rl.tokens--
		return true
	}
	return false
}
