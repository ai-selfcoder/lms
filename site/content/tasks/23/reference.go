package solution

import (
	"sync"
	"sync/atomic"
	"time"
)

// ScalingPool — пул воркеров с динамическим масштабированием.
type ScalingPool struct {
	minWorkers int
	maxWorkers int
	tasks      <-chan func()

	mu       sync.Mutex
	active   int   // текущее число воркеров
	peak      int32 // пиковое число воркеров (atomic)

	wg       sync.WaitGroup
	stopCh   chan struct{}
	stopOnce sync.Once
}

// NewScalingPool создаёт пул, читающий задачи из канала tasks.
func NewScalingPool(minWorkers, maxWorkers int, tasks <-chan func()) *ScalingPool {
	if minWorkers < 1 {
		minWorkers = 1
	}
	if maxWorkers < minWorkers {
		maxWorkers = minWorkers
	}
	return &ScalingPool{
		minWorkers: minWorkers,
		maxWorkers: maxWorkers,
		tasks:      tasks,
		stopCh:     make(chan struct{}),
	}
}

// Start запускает минимальный набор воркеров и менеджер масштабирования.
func (p *ScalingPool) Start() {
	for i := 0; i < p.minWorkers; i++ {
		p.spawn(true)
	}
	p.wg.Add(1)
	go p.manager()
}

// spawn запускает одного воркера. permanent=true означает, что воркер не
// завершается по простою (входит в гарантированный минимум).
func (p *ScalingPool) spawn(permanent bool) {
	p.mu.Lock()
	if p.active >= p.maxWorkers {
		p.mu.Unlock()
		return
	}
	p.active++
	cur := int32(p.active)
	p.mu.Unlock()

	for {
		old := atomic.LoadInt32(&p.peak)
		if cur <= old || atomic.CompareAndSwapInt32(&p.peak, old, cur) {
			break
		}
	}

	p.wg.Add(1)
	go p.worker(permanent)
}

func (p *ScalingPool) worker(permanent bool) {
	defer p.wg.Done()
	defer func() {
		p.mu.Lock()
		p.active--
		p.mu.Unlock()
	}()

	idle := time.NewTimer(50 * time.Millisecond)
	defer idle.Stop()

	for {
		if !idle.Stop() {
			select {
			case <-idle.C:
			default:
			}
		}
		idle.Reset(50 * time.Millisecond)

		select {
		case <-p.stopCh:
			return
		case task, ok := <-p.tasks:
			if !ok {
				return
			}
			if task != nil {
				task()
			}
		case <-idle.C:
			// Простой: лишние воркеры завершаются.
			if !permanent {
				p.mu.Lock()
				if p.active > p.minWorkers {
					p.mu.Unlock()
					return
				}
				p.mu.Unlock()
			}
		}
	}
}

// manager периодически проверяет загрузку и масштабирует пул вверх.
func (p *ScalingPool) manager() {
	defer p.wg.Done()
	ticker := time.NewTicker(5 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-p.stopCh:
			return
		case <-ticker.C:
			// Если в канале есть ожидающие задачи — добавляем воркеров.
			if len(p.tasks) > 0 {
				p.mu.Lock()
				room := p.active < p.maxWorkers
				p.mu.Unlock()
				if room {
					p.spawn(false)
				}
			}
		}
	}
}

// Stop корректно останавливает все воркеры.
func (p *ScalingPool) Stop() {
	p.stopOnce.Do(func() {
		close(p.stopCh)
	})
	p.wg.Wait()
}

// Peak возвращает максимальное число одновременно работавших воркеров.
func (p *ScalingPool) Peak() int {
	return int(atomic.LoadInt32(&p.peak))
}
