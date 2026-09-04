package solution

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"time"
)

func TestQueryReplicasFirstWins(t *testing.T) {
	var slowCancelled int32

	fast := func(ctx context.Context) (string, error) {
		time.Sleep(50 * time.Millisecond)
		return "fast", nil
	}
	mkSlow := func() func(ctx context.Context) (string, error) {
		return func(ctx context.Context) (string, error) {
			select {
			case <-time.After(3 * time.Second):
				return "slow", nil
			case <-ctx.Done():
				atomic.AddInt32(&slowCancelled, 1)
				return "", ctx.Err()
			}
		}
	}

	start := time.Now()
	got, err := QueryReplicas(context.Background(), []func(ctx context.Context) (string, error){
		mkSlow(), fast, mkSlow(),
	})
	if err != nil {
		t.Fatalf("QueryReplicas: ожидался успех быстрой реплики, получена ошибка: %v", err)
	}
	if got != "fast" {
		t.Fatalf("QueryReplicas: ожидался результат %q, получено %q", "fast", got)
	}
	if elapsed := time.Since(start); elapsed > 1500*time.Millisecond {
		t.Fatalf("QueryReplicas: ждала медленные реплики вместо быстрого ответа, заняло %v", elapsed)
	}

	// Даём отменённым репликам зафиксировать отмену.
	deadline := time.Now().Add(2 * time.Second)
	for atomic.LoadInt32(&slowCancelled) < 2 && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	if got := atomic.LoadInt32(&slowCancelled); got != 2 {
		t.Fatalf("QueryReplicas: медленные реплики не увидели отмену: ожидалось 2, получено %d", got)
	}
}

func TestQueryReplicasAllFail(t *testing.T) {
	mkFail := func() func(ctx context.Context) (string, error) {
		return func(ctx context.Context) (string, error) {
			return "", errors.New("реплика недоступна")
		}
	}

	got, err := QueryReplicas(context.Background(), []func(ctx context.Context) (string, error){
		mkFail(), mkFail(), mkFail(),
	})
	if err == nil {
		t.Fatalf("QueryReplicas: при падении всех реплик ожидалась ошибка, получено nil (результат %q)", got)
	}
}
