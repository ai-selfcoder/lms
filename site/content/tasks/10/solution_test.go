package solution

import (
	"errors"
	"sync/atomic"
	"testing"
	"time"
)

func TestProcessOrdersHappyPath(t *testing.T) {
	ids := make([]int, 500)
	for i := range ids {
		ids[i] = i
	}

	const w = 8
	var processed int64
	var current int64
	var maxConcurrent int64

	process := func(id int) error {
		c := atomic.AddInt64(&current, 1)
		for {
			m := atomic.LoadInt64(&maxConcurrent)
			if c <= m || atomic.CompareAndSwapInt64(&maxConcurrent, m, c) {
				break
			}
		}
		time.Sleep(time.Millisecond)
		atomic.AddInt64(&current, -1)
		atomic.AddInt64(&processed, 1)
		return nil
	}

	err := ProcessOrders(ids, w, process)
	if err != nil {
		t.Fatalf("ProcessOrders: ожидался nil при успешной обработке, получено: %v", err)
	}
	if got := atomic.LoadInt64(&processed); got != int64(len(ids)) {
		t.Fatalf("ProcessOrders: обработано %d заказов, ожидалось %d", got, len(ids))
	}
	if got := atomic.LoadInt64(&maxConcurrent); got > w {
		t.Fatalf("ProcessOrders: параллелизм превысил лимит: max=%d, лимит w=%d", got, w)
	}
}

func TestProcessOrdersError(t *testing.T) {
	ids := make([]int, 1000)
	for i := range ids {
		ids[i] = i
	}

	wantErr := errors.New("заказ 42 невалиден")
	var processed int64

	process := func(id int) error {
		if id == 42 {
			return wantErr
		}
		time.Sleep(time.Millisecond)
		atomic.AddInt64(&processed, 1)
		return nil
	}

	err := ProcessOrders(ids, 4, process)
	if !errors.Is(err, wantErr) {
		t.Fatalf("ProcessOrders: ожидалась ошибка %v, получено: %v", wantErr, err)
	}
	if got := atomic.LoadInt64(&processed); got >= int64(len(ids)) {
		t.Fatalf("ProcessOrders: после ошибки обработаны все %d заказов (%d) — отмена не сработала", len(ids), got)
	}
}
