package solution

import (
	"context"
	"sync/atomic"
	"testing"
	"time"
)

func TestCtxPoolNormalTaskCompletes(t *testing.T) {
	p := NewCtxPool(2)
	p.Start()
	defer p.Stop()

	var done int64
	p.Submit(CtxTask{
		Ctx: context.Background(),
		Run: func(ctx context.Context) {
			atomic.AddInt64(&done, 1)
		},
	})

	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if atomic.LoadInt64(&done) == 1 {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatalf("CtxPool: задача с неотменённым контекстом не выполнилась за 1с")
}

func TestCtxPoolCanceledTaskFreesWorker(t *testing.T) {
	// Пул из одного воркера: если зависшая задача его не освободит,
	// следующая задача никогда не выполнится.
	p := NewCtxPool(1)
	p.Start()
	defer p.Stop()

	ctx, cancel := context.WithCancel(context.Background())

	var blockedStarted int64
	p.Submit(CtxTask{
		Ctx: ctx,
		Run: func(c context.Context) {
			atomic.StoreInt64(&blockedStarted, 1)
			// Долгая работа: ждём отмены собственного контекста.
			<-c.Done()
		},
	})

	// Дожидаемся старта блокирующей задачи.
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if atomic.LoadInt64(&blockedStarted) == 1 {
			break
		}
		time.Sleep(5 * time.Millisecond)
	}
	if atomic.LoadInt64(&blockedStarted) != 1 {
		t.Fatalf("CtxPool: блокирующая задача не стартовала")
	}

	// Ставим следующую нормальную задачу в очередь в отдельной горутине
	// (Submit может блокироваться, пока воркер занят).
	var nextDone int64
	go func() {
		p.Submit(CtxTask{
			Ctx: context.Background(),
			Run: func(c context.Context) {
				atomic.AddInt64(&nextDone, 1)
			},
		})
	}()

	// Отменяем контекст зависшей задачи через ~50мс.
	time.Sleep(50 * time.Millisecond)
	cancel()

	// В течение ~1с воркер должен освободиться и выполнить следующую задачу.
	deadline = time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if atomic.LoadInt64(&nextDone) == 1 {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatalf("CtxPool: после отмены зависшей задачи воркер не освободился — следующая задача не выполнена")
}
