package solution

import "time"

// MetricsAggregator буферизует метрики и сбрасывает их батчами в ClickHouse.
//
// Исправленная версия: единственная фоновая горутина владеет буфером,
// батч копируется в свежий слайс перед передачей в Save (нет aliasing),
// Stop() корректно завершает горутину и досбрасывает остаток (нет утечки).
type MetricsAggregator struct {
	ch   chan Metric
	db   *ClickHouseClient
	done chan struct{}
}

const flushSize = 50

// NewMetricsAggregator запускает фоновую горутину агрегации.
func NewMetricsAggregator(db *ClickHouseClient) *MetricsAggregator {
	ma := &MetricsAggregator{
		ch:   make(chan Metric, 1024),
		db:   db,
		done: make(chan struct{}),
	}
	go ma.run()
	return ma
}

func (ma *MetricsAggregator) run() {
	defer close(ma.done)

	ticker := time.NewTicker(5 * time.Millisecond)
	defer ticker.Stop()

	var buffer []Metric

	flush := func() {
		if len(buffer) == 0 {
			return
		}
		// Копируем батч в свежий слайс: горутина Save работает со своей
		// копией, агрегатор спокойно переиспользует buffer дальше.
		batch := make([]Metric, len(buffer))
		copy(batch, buffer)
		ma.db.Save(batch)
		buffer = buffer[:0]
	}

	for {
		select {
		case m, ok := <-ma.ch:
			if !ok {
				// Канал закрыт в Stop(): досбрасываем остаток и выходим.
				flush()
				return
			}
			buffer = append(buffer, m)
			if len(buffer) >= flushSize {
				flush()
			}
		case <-ticker.C:
			flush()
		}
	}
}

// AddMetric добавляет метрику в буфер.
func (ma *MetricsAggregator) AddMetric(m Metric) {
	ma.ch <- m
}

// Stop корректно завершает агрегатор и сбрасывает остаток буфера.
func (ma *MetricsAggregator) Stop() {
	close(ma.ch)
	<-ma.done
}
