package solution

import "time"

// LeakyBucket — ограничитель по алгоритму leaky bucket.
//
// Внутренний цикл по тикам ticker'а открывает «ворота» (читает один запрос
// из gate) раз в interval. Каждый Acquire отправляет себя в gate и блокируется,
// пока его не «выпустят».
type LeakyBucket struct {
	gate chan struct{}
	stop chan struct{}
}

// NewLeakyBucket создаёт ведро, пропускающее 1 запрос раз в interval.
func NewLeakyBucket(interval time.Duration) *LeakyBucket {
	lb := &LeakyBucket{
		gate: make(chan struct{}),
		stop: make(chan struct{}),
	}
	go lb.run(interval)
	return lb
}

func (lb *LeakyBucket) run(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-lb.stop:
			return
		case <-ticker.C:
			// Выпускаем одного ожидающего, если он есть.
			select {
			case lb.gate <- struct{}{}:
			case <-lb.stop:
				return
			}
		}
	}
}

// Acquire блокирует вызывающую горутину до её очереди.
func (lb *LeakyBucket) Acquire() {
	<-lb.gate
}

// Stop останавливает внутренний таймер.
func (lb *LeakyBucket) Stop() {
	close(lb.stop)
}
