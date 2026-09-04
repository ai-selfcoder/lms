package solution

import "sync"

// Metric — единичная метрика.
type Metric struct {
	Name  string
	Value float64
}

// ClickHouseClient — потокобезопасный фейковый клиент хранилища.
// Save принимает батч метрик и атомарно учитывает их количество и содержимое.
type ClickHouseClient struct {
	mu      sync.Mutex
	total   int
	batches int
	seen    map[string]int
}

// NewClickHouseClient создаёт пустой клиент.
func NewClickHouseClient() *ClickHouseClient {
	return &ClickHouseClient{seen: make(map[string]int)}
}

// Save сохраняет батч метрик. Потокобезопасен: его можно вызывать из
// нескольких горутин одновременно.
func (c *ClickHouseClient) Save(metrics []Metric) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.total += len(metrics)
	c.batches++
	for _, m := range metrics {
		c.seen[m.Name]++
	}
}

// Total — суммарное число сохранённых метрик за все батчи.
func (c *ClickHouseClient) Total() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.total
}

// Count возвращает, сколько раз метрика с данным именем была сохранена.
func (c *ClickHouseClient) Count(name string) int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.seen[name]
}
