package solution

import (
	"context"
	"errors"
	"sync"
	"time"
)

// RunService запускает фоновые задачи; каждая слушает ctx.Done(). Когда внешний
// код отменяет ctx, всем задачам даётся grace на завершение. Возвращает, когда
// все завершились, либо по истечении grace.
func RunService(ctx context.Context, grace time.Duration, tasks ...func(ctx context.Context)) error {
	var wg sync.WaitGroup
	for _, task := range tasks {
		wg.Add(1)
		go func(t func(ctx context.Context)) {
			defer wg.Done()
			t(ctx)
		}(task)
	}

	// Ждём сигнал на остановку.
	<-ctx.Done()

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		return nil
	case <-time.After(grace):
		return errors.New("принудительное завершение: задачи не уложились в grace")
	}
}
