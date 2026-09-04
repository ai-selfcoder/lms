package solution

import (
	"sync"
	"time"
)

// ElasticPool — воркер-пул с минимумом постоянных воркеров, эластичным
// расширением под нагрузку и засыпанием лишних воркеров по idleTimeout.
//
// Диспетчер читает задачи из tasks и раздаёт их через внутренний канал jobs.
// Если ни один воркер не готов принять задачу прямо сейчас и активных воркеров
// меньше maxWorkers — поднимается дополнительный эластичный воркер. Постоянные
// воркеры (minWorkers) живут всегда; эластичные засыпают на jobs с таймаутом
// idleTimeout и выходят при простое.
type ElasticPool struct {
	minWorkers  int
	maxWorkers  int
	idleTimeout time.Duration
	tasks       <-chan func()

	jobs chan func()
	quit chan struct{}

	wg       sync.WaitGroup
	stopOnce sync.Once

	mu     sync.Mutex
	active int
	peak   int
}

// NewElasticPool создаёт пул: minWorkers постоянных, до maxWorkers под нагрузкой,
// лишние засыпают и выходят после idleTimeout простоя. Задачи читаются из tasks.
func NewElasticPool(minWorkers, maxWorkers int, idleTimeout time.Duration, tasks <-chan func()) *ElasticPool {
	if maxWorkers < minWorkers {
		maxWorkers = minWorkers
	}
	return &ElasticPool{
		minWorkers:  minWorkers,
		maxWorkers:  maxWorkers,
		idleTimeout: idleTimeout,
		tasks:       tasks,
		jobs:        make(chan func()),
		quit:        make(chan struct{}),
	}
}

// Start запускает пул.
func (p *ElasticPool) Start() {
	// Постоянные воркеры.
	for i := 0; i < p.minWorkers; i++ {
		p.spawn(true)
	}
	// Диспетчер.
	p.wg.Add(1)
	go p.dispatch()
}

func (p *ElasticPool) dispatch() {
	defer p.wg.Done()
	for {
		select {
		case <-p.quit:
			return
		case task, ok := <-p.tasks:
			if !ok {
				return
			}
			p.assign(task)
		}
	}
}

// assign передаёт задачу свободному воркеру; при нехватке поднимает эластичного.
func (p *ElasticPool) assign(task func()) {
	for {
		// Пытаемся отдать задачу готовому воркеру без блокировки.
		select {
		case p.jobs <- task:
			return
		case <-p.quit:
			return
		default:
		}

		// Свободных нет — пробуем поднять эластичного воркера.
		if p.spawn(false) {
			// Новый воркер скоро будет готов; повторяем попытку отдать.
			select {
			case p.jobs <- task:
				return
			case <-p.quit:
				return
			}
		}

		// Достигнут maxWorkers — блокирующе ждём освобождения воркера.
		select {
		case p.jobs <- task:
			return
		case <-p.quit:
			return
		}
	}
}

// spawn запускает воркера, если не превышен maxWorkers. permanent — постоянный
// (никогда не засыпает). Возвращает true, если воркер действительно запущен.
func (p *ElasticPool) spawn(permanent bool) bool {
	p.mu.Lock()
	if p.active >= p.maxWorkers {
		p.mu.Unlock()
		return false
	}
	p.active++
	if p.active > p.peak {
		p.peak = p.active
	}
	p.mu.Unlock()

	p.wg.Add(1)
	go p.worker(permanent)
	return true
}

func (p *ElasticPool) worker(permanent bool) {
	defer p.wg.Done()
	defer func() {
		p.mu.Lock()
		p.active--
		p.mu.Unlock()
	}()

	if permanent {
		for {
			select {
			case <-p.quit:
				return
			case task := <-p.jobs:
				task()
			}
		}
	}

	// Эластичный воркер: засыпает и выходит по таймауту простоя.
	timer := time.NewTimer(p.idleTimeout)
	defer timer.Stop()
	for {
		select {
		case <-p.quit:
			return
		case task := <-p.jobs:
			task()
			if !timer.Stop() {
				select {
				case <-timer.C:
				default:
				}
			}
			timer.Reset(p.idleTimeout)
		case <-timer.C:
			// Долго простаивали — выходим.
			return
		}
	}
}

// Stop останавливает пул, завершая всех воркеров.
func (p *ElasticPool) Stop() {
	p.stopOnce.Do(func() {
		close(p.quit)
		p.wg.Wait()
	})
}

// Peak — максимальное число одновременно живых воркеров за всё время.
func (p *ElasticPool) Peak() int {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.peak
}

// Active — текущее число живых воркеров.
func (p *ElasticPool) Active() int {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.active
}
