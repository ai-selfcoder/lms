package solution

import (
	"runtime"
	"testing"
	"time"
)

// settleGoroutines ждёт, пока число горутин не опустится до baseline+margin,
// опрашивая с шагом 50ms в течение ~2s.
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

func TestProduceDeliversValues(t *testing.T) {
	done := make(chan struct{})
	defer close(done)
	ch := produce(5, done)
	for i := 1; i <= 5; i++ {
		select {
		case v, ok := <-ch:
			if !ok {
				t.Fatalf("канал закрылся раньше времени на значении %d", i)
			}
			if v != i {
				t.Fatalf("ожидалось значение %d, получено %d", i, v)
			}
		case <-time.After(2 * time.Second):
			t.Fatalf("не дождались значения %d из канала", i)
		}
	}
}

func TestProduceNoLeakOnPartialRead(t *testing.T) {
	runtime.GC()
	baseline := runtime.NumGoroutine()

	// Запускаем несколько продьюсеров и у каждого читаем только часть значений.
	// Наивная реализация (отправка без select на done) оставит по одной
	// зависшей горутине на каждый продьюсер — суммарная утечка станет заметной.
	const producers = 20
	done := make(chan struct{})

	for p := 0; p < producers; p++ {
		ch := produce(5, done)
		// Читаем только первые 2 из 5 значений.
		for i := 1; i <= 2; i++ {
			select {
			case v := <-ch:
				if v != i {
					t.Fatalf("ожидалось значение %d, получено %d", i, v)
				}
			case <-time.After(2 * time.Second):
				t.Fatalf("не дождались значения %d", i)
			}
		}
	}

	// Сообщаем всем продьюсерам, что больше читать не будем.
	close(done)

	cur := settleGoroutines(baseline, 2)
	if cur > baseline+2 {
		t.Fatalf("утечка горутины: было %d, стало %d (продьюсеры зависли на отправке?)", baseline, cur)
	}
}

func TestProduceClosesChannelAfterFullRead(t *testing.T) {
	done := make(chan struct{})
	defer close(done)
	ch := produce(3, done)
	count := 0
	for range ch {
		count++
		if count > 100 {
			t.Fatal("канал не закрылся после отправки всех значений")
		}
	}
	if count != 3 {
		t.Fatalf("ожидалось 3 значения до закрытия канала, получено %d", count)
	}
}
