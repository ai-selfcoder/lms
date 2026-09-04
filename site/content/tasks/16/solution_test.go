package solution

import (
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// TestBurstWithinLimit: быстрый всплеск из 1000 вызовов при rps=100
// должен пропустить примерно 100 запросов (с запасом на разброс refill).
func TestBurstWithinLimit(t *testing.T) {
	rl := NewRateLimiter(100)

	var allowed int
	for i := 0; i < 1000; i++ {
		if rl.Allow() {
			allowed++
		}
	}

	// Всплеск выполняется очень быстро, поэтому пополнение минимально.
	// Ожидаем порядка 100 разрешений; допускаем широкий коридор.
	if allowed < 90 || allowed > 130 {
		t.Fatalf("во всплеске пропущено %d запросов, ожидалось ~100 (90..130)", allowed)
	}
}

// TestRefill: после исчерпания лимита и паузы бакет должен восполниться.
func TestRefill(t *testing.T) {
	rl := NewRateLimiter(100)

	// Исчерпываем бакет.
	for i := 0; i < 1000; i++ {
		rl.Allow()
	}

	// Сразу после исчерпания запросов почти не должно проходить.
	immediate := 0
	for i := 0; i < 50; i++ {
		if rl.Allow() {
			immediate++
		}
	}
	if immediate > 30 {
		t.Fatalf("сразу после исчерпания пропущено %d запросов, ожидалось мало", immediate)
	}

	// Ждём полную секунду — бакет должен восполниться.
	time.Sleep(1100 * time.Millisecond)

	refilled := 0
	for i := 0; i < 1000; i++ {
		if rl.Allow() {
			refilled++
		}
	}
	if refilled < 90 {
		t.Fatalf("после пополнения пропущено %d запросов, ожидалось >=90", refilled)
	}
}

// TestConcurrentAllow: Allow вызывается из множества горутин под -race.
// Проверяем отсутствие гонок и что общий лимит не превышен грубо.
func TestConcurrentAllow(t *testing.T) {
	rl := NewRateLimiter(100)

	var allowed int64
	var wg sync.WaitGroup
	const workers = 50
	wg.Add(workers)
	for w := 0; w < workers; w++ {
		go func() {
			defer wg.Done()
			for i := 0; i < 100; i++ {
				if rl.Allow() {
					atomic.AddInt64(&allowed, 1)
				}
			}
		}()
	}
	wg.Wait()

	// 5000 быстрых вызовов; пройти должно заметно меньше — порядка сотни.
	got := atomic.LoadInt64(&allowed)
	if got < 1 {
		t.Fatalf("ни один запрос не прошёл, ожидалось >=1")
	}
	if got > 300 {
		t.Fatalf("прошло %d запросов при быстром всплеске, лимит явно не работает", got)
	}
}
