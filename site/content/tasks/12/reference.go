package solution

import "time"

const (
	batchSize     = 100
	flushInterval = 50 * time.Millisecond
)

// Batcher накапливает события и сбрасывает их пачкой по размеру или по таймеру.
type Batcher struct {
	in    chan Event
	done  chan struct{}
	flush func(batch []Event)
}

// NewBatcher создаёт Batcher: flush при накоплении 100 событий ИЛИ через 50ms
// после последнего сброса.
func NewBatcher(flush func(batch []Event)) *Batcher {
	b := &Batcher{
		in:    make(chan Event),
		done:  make(chan struct{}),
		flush: flush,
	}
	go b.run()
	return b
}

func (b *Batcher) run() {
	defer close(b.done)

	buf := make([]Event, 0, batchSize)
	ticker := time.NewTicker(flushInterval)
	defer ticker.Stop()

	doFlush := func() {
		if len(buf) == 0 {
			return
		}
		batch := make([]Event, len(buf))
		copy(batch, buf)
		b.flush(batch)
		buf = buf[:0]
	}

	for {
		select {
		case ev, ok := <-b.in:
			if !ok {
				doFlush()
				return
			}
			buf = append(buf, ev)
			if len(buf) >= batchSize {
				doFlush()
			}
		case <-ticker.C:
			doFlush()
		}
	}
}

// Add добавляет событие в батчер.
func (b *Batcher) Add(event Event) {
	b.in <- event
}

// Stop сбрасывает остаток и корректно останавливает фоновую горутину.
func (b *Batcher) Stop() {
	close(b.in)
	<-b.done
}
