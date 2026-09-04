package solution

import "time"

// ElasticPool — воркер-пул с минимумом постоянных воркеров, эластичным
// расширением под нагрузку и засыпанием лишних воркеров по idleTimeout.
type ElasticPool struct {
	minWorkers  int
	maxWorkers  int
	idleTimeout time.Duration
	tasks       <-chan func()
}

// NewElasticPool создаёт пул: minWorkers постоянных, до maxWorkers под нагрузкой,
// лишние засыпают и выходят после idleTimeout простоя. Задачи читаются из tasks.
func NewElasticPool(minWorkers, maxWorkers int, idleTimeout time.Duration, tasks <-chan func()) *ElasticPool {
	return &ElasticPool{
		minWorkers:  minWorkers,
		maxWorkers:  maxWorkers,
		idleTimeout: idleTimeout,
		tasks:       tasks,
	}
}

// Start запускает пул.
func (p *ElasticPool) Start() {
	// TODO: запустить постоянных воркеров и логику эластичного расширения.
}

// Stop останавливает пул, завершая всех воркеров.
func (p *ElasticPool) Stop() {
	// TODO: завершить всех воркеров.
}

// Peak — максимальное число одновременно живых воркеров за всё время.
func (p *ElasticPool) Peak() int {
	return 0
}

// Active — текущее число живых воркеров.
func (p *ElasticPool) Active() int {
	return 0
}
