package solution

import (
	"runtime"
	"testing"
	"time"
)

func settleGoroutines(baseline, margin int) int {
	deadline := time.Now().Add(2 * time.Second)
	cur := runtime.NumGoroutine()
	for time.Now().Before(deadline) {
		cur = runtime.NumGoroutine()
		if cur <= baseline+margin {
			return cur
		}
		time.Sleep(50 * time.Millisecond)
	}
	return cur
}

func TestGeneratorProducesValues(t *testing.T) {
	ch := NewGenerator()
	// Канал работает: быстро читаем несколько значений.
	for i := 0; i < 3; i++ {
		select {
		case _, ok := <-ch:
			if !ok {
				t.Fatalf("канал закрылся слишком рано на чтении %d", i)
			}
		case <-time.After(2 * time.Second):
			t.Fatalf("не дождались значения %d от генератора", i)
		}
	}
	// Дренируем до закрытия, чтобы не оставить висящую горутину для этого теста.
	go func() {
		for range ch {
		}
	}()
}

func TestGeneratorClosesOnIdle(t *testing.T) {
	ch := NewGenerator()
	// Читаем пару значений, подтверждая, что генератор жив.
	for i := 0; i < 2; i++ {
		select {
		case <-ch:
		case <-time.After(2 * time.Second):
			t.Fatalf("не дождались значения %d", i)
		}
	}

	// Перестаём читать дольше таймаута бездействия (500ms).
	time.Sleep(700 * time.Millisecond)

	// Теперь канал должен быть закрыт: чтение вернёт ok == false в течение ~1s.
	deadline := time.After(1 * time.Second)
	for {
		select {
		case _, ok := <-ch:
			if !ok {
				return // канал закрыт — успех.
			}
			// Возможно одно «застрявшее» значение, отправленное до таймера; продолжаем.
		case <-deadline:
			t.Fatal("канал не был закрыт после простоя > 500ms (генератор не завершился)")
		}
	}
}

func TestGeneratorNoLeak(t *testing.T) {
	runtime.GC()
	baseline := runtime.NumGoroutine()

	ch := NewGenerator()
	// Читаем немного.
	for i := 0; i < 2; i++ {
		select {
		case <-ch:
		case <-time.After(2 * time.Second):
			t.Fatalf("не дождались значения %d", i)
		}
	}
	// Перестаём читать — генератор должен сам завершиться.
	time.Sleep(700 * time.Millisecond)

	cur := settleGoroutines(baseline, 2)
	if cur > baseline+2 {
		t.Fatalf("утечка горутины: было %d, стало %d (генератор не завершился по таймауту?)", baseline, cur)
	}
}
