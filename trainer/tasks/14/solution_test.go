package solution

import (
	"context"
	"sync/atomic"
	"testing"
	"time"
)

func TestRunServiceGraceful(t *testing.T) {
	var observed int32

	mkTask := func() func(ctx context.Context) {
		return func(ctx context.Context) {
			<-ctx.Done()
			atomic.AddInt32(&observed, 1)
		}
	}

	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan error, 1)
	go func() {
		done <- RunService(ctx, 2*time.Second, mkTask(), mkTask(), mkTask())
	}()

	// Даём задачам стартовать, затем отменяем.
	time.Sleep(50 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("RunService: при graceful-завершении ожидался nil, получено: %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatalf("RunService: не вернулась вовремя при graceful-завершении")
	}

	if got := atomic.LoadInt32(&observed); got != 3 {
		t.Fatalf("RunService: не все задачи увидели отмену: ожидалось 3, получено %d", got)
	}
}

func TestRunServiceForced(t *testing.T) {
	stuck := func(ctx context.Context) {
		// Игнорирует ctx и спит дольше grace.
		time.Sleep(2 * time.Second)
	}
	good := func(ctx context.Context) {
		<-ctx.Done()
	}

	ctx, cancel := context.WithCancel(context.Background())

	start := time.Now()
	done := make(chan error, 1)
	go func() {
		done <- RunService(ctx, 300*time.Millisecond, good, stuck)
	}()

	time.Sleep(50 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err == nil {
			t.Fatalf("RunService: при зависшей задаче ожидалась ошибка принудительного завершения, получено nil")
		}
		if elapsed := time.Since(start); elapsed > 1500*time.Millisecond {
			t.Fatalf("RunService: не уложилась в grace при принудительном завершении, заняло %v", elapsed)
		}
	case <-time.After(5 * time.Second):
		t.Fatalf("RunService: зависла на «застрявшей» задаче — grace не применён")
	}
}
