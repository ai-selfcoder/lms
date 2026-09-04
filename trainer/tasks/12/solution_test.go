package solution

import (
	"sync"
	"testing"
	"time"
)

type collector struct {
	mu      sync.Mutex
	batches [][]Event
}

func (c *collector) flush(batch []Event) {
	c.mu.Lock()
	defer c.mu.Unlock()
	cp := make([]Event, len(batch))
	copy(cp, batch)
	c.batches = append(c.batches, cp)
}

func (c *collector) snapshot() [][]Event {
	c.mu.Lock()
	defer c.mu.Unlock()
	out := make([][]Event, len(c.batches))
	copy(out, c.batches)
	return out
}

func TestBatcherBySize(t *testing.T) {
	c := &collector{}
	b := NewBatcher(c.flush)

	const total = 250
	for i := 0; i < total; i++ {
		b.Add(Event{ID: i})
	}
	b.Stop()

	batches := c.snapshot()

	seen := map[int]bool{}
	for _, batch := range batches {
		if len(batch) > 100 {
			t.Fatalf("Batcher: пачка размером %d превышает лимит 100", len(batch))
		}
		for _, ev := range batch {
			if seen[ev.ID] {
				t.Fatalf("Batcher: событие ID=%d сброшено дважды", ev.ID)
			}
			seen[ev.ID] = true
		}
	}

	if len(seen) != total {
		t.Fatalf("Batcher: сброшено %d уникальных событий, ожидалось %d", len(seen), total)
	}
}

func TestBatcherByTime(t *testing.T) {
	c := &collector{}
	b := NewBatcher(c.flush)

	b.Add(Event{ID: 1})
	b.Add(Event{ID: 2})
	b.Add(Event{ID: 3})

	// Ждём заведомо дольше интервала сброса (50ms), не вызывая Stop.
	time.Sleep(150 * time.Millisecond)

	batches := c.snapshot()

	count := 0
	for _, batch := range batches {
		count += len(batch)
	}
	if count != 3 {
		t.Fatalf("Batcher: по таймеру ожидался сброс 3 событий, получено %d", count)
	}

	b.Stop()
}

func TestBatcherStopFlushesRemainder(t *testing.T) {
	c := &collector{}
	b := NewBatcher(c.flush)

	b.Add(Event{ID: 10})
	b.Add(Event{ID: 20})
	b.Stop()

	batches := c.snapshot()
	count := 0
	for _, batch := range batches {
		count += len(batch)
	}
	if count != 2 {
		t.Fatalf("Batcher: Stop должен сбросить остаток из 2 событий, сброшено %d", count)
	}
}
