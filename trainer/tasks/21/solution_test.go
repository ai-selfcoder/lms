package solution

import (
	"fmt"
	"testing"
	"time"
)

func TestMetricsAggregator_AllMetricsSavedOnce(t *testing.T) {
	const N = 250

	db := NewClickHouseClient()
	ma := NewMetricsAggregator(db)

	for i := 0; i < N; i++ {
		ma.AddMetric(Metric{Name: fmt.Sprintf("m-%d", i), Value: float64(i)})
	}

	// Корректное завершение: Stop должен досбросить остаток буфера
	// и дождаться фоновой горутины.
	ma.Stop()

	// Небольшой запас на случай асинхронных Save в наивных реализациях.
	time.Sleep(50 * time.Millisecond)

	if got := db.Total(); got != N {
		t.Fatalf("ожидалось сохранение ровно %d метрик, получено %d (потеря или дублирование)", N, got)
	}

	for i := 0; i < N; i++ {
		name := fmt.Sprintf("m-%d", i)
		if c := db.Count(name); c != 1 {
			t.Fatalf("метрика %q должна быть сохранена ровно 1 раз, сохранена %d раз", name, c)
		}
	}
}
