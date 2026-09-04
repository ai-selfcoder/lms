package solution

import "time"

// MetricsAggregator буферизует метрики и сбрасывает их батчами в ClickHouse.
//
// ВНИМАНИЕ: код содержит ошибки (гонки данных, aliasing буфера, утечку
// горутины, потенциальную потерю/дублирование метрик). Найдите и исправьте их.
type MetricsAggregator struct {
	buffer []Metric
	ch     chan Metric
	db     *ClickHouseClient
}

const flushSize = 50

// NewMetricsAggregator запускает фоновую горутину агрегации.
func NewMetricsAggregator(db *ClickHouseClient) *MetricsAggregator {
	ma := &MetricsAggregator{
		ch: make(chan Metric, 1024),
		db: db,
	}
	go ma.run()
	return ma
}

func (ma *MetricsAggregator) run() {
	ticker := time.NewTicker(5 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case m := <-ma.ch:
			ma.buffer = append(ma.buffer, m)
			if len(ma.buffer) >= flushSize {
				// БАГ: отдаём текущий слайс в горутину и тут же
				// переиспользуем его под новый буфер.
				go ma.db.Save(ma.buffer)
				ma.buffer = ma.buffer[:0]
			}
		case <-ticker.C:
			if len(ma.buffer) > 0 {
				go ma.db.Save(ma.buffer)
				ma.buffer = ma.buffer[:0]
			}
		}
	}
}

// AddMetric добавляет метрику в буфер.
func (ma *MetricsAggregator) AddMetric(m Metric) {
	ma.ch <- m
}

// Stop корректно завершает агрегатор и сбрасывает остаток буфера.
func (ma *MetricsAggregator) Stop() {
	// БАГ: ничего не делает — горутина утекает, остаток буфера теряется.
}
