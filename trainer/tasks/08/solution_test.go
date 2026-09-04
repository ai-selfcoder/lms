package solution

import (
	"sync"
	"testing"
	"time"
)

func TestMyWaitGroupWaitsForAll(t *testing.T) {
	const n = 50
	wg := &MyWaitGroup{}
	wg.Add(n)

	var mu sync.Mutex
	done := 0

	for i := 0; i < n; i++ {
		go func(i int) {
			// Детерминированная задержка, зависящая от индекса (без rand):
			// от 5ms до ~50ms.
			delay := time.Duration(5+i%10) * time.Millisecond
			time.Sleep(delay)
			mu.Lock()
			done++
			mu.Unlock()
			wg.Done()
		}(i)
	}

	waited := make(chan struct{})
	go func() {
		wg.Wait()
		close(waited)
	}()

	select {
	case <-waited:
		mu.Lock()
		d := done
		mu.Unlock()
		if d != n {
			t.Fatalf("Wait() вернулся, но завершилось только %d из %d горутин", d, n)
		}
	case <-time.After(10 * time.Second):
		t.Fatal("Wait() не вернулся вовремя: возможно, не пробуждается при достижении нуля")
	}
}

func TestMyWaitGroupZeroReturnsImmediately(t *testing.T) {
	wg := &MyWaitGroup{}
	done := make(chan struct{})
	go func() {
		wg.Wait() // счётчик уже 0
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("Wait() на нулевом счётчике должен вернуться сразу")
	}
}

func TestMyWaitGroupAddDoneBalance(t *testing.T) {
	wg := &MyWaitGroup{}
	wg.Add(3)

	var mu sync.Mutex
	done := 0

	released := make(chan struct{})
	go func() {
		wg.Wait()
		close(released)
	}()

	for i := 0; i < 3; i++ {
		// Wait не должен вернуться, пока есть незавершённые задачи.
		select {
		case <-released:
			t.Fatalf("Wait() вернулся преждевременно: выполнено %d из 3 Done", done)
		default:
		}
		time.Sleep(15 * time.Millisecond)
		mu.Lock()
		done++
		mu.Unlock()
		wg.Done()
	}

	select {
	case <-released:
		mu.Lock()
		d := done
		mu.Unlock()
		if d != 3 {
			t.Fatalf("Wait() вернулся, но выполнено %d из 3 Done", d)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("Wait() не вернулся после трёх Done")
	}
}
