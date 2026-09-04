package solution

import (
	"container/heap"
	"sync"
)

// PriorityPool — пул воркеров с приоритетной очередью на базе heap + sync.Cond.
type PriorityPool struct {
	workers int

	mu      sync.Mutex
	cond    *sync.Cond
	pq      taskHeap
	seq     int64 // монотонный счётчик для FIFO при равном приоритете
	stopped bool

	wg sync.WaitGroup
}

// pqItem — элемент кучи. Больший приоритет — раньше; при равенстве — меньший seq.
type pqItem struct {
	task Task
	seq  int64
}

type taskHeap []pqItem

func (h taskHeap) Len() int { return len(h) }
func (h taskHeap) Less(i, j int) bool {
	if h[i].task.Priority != h[j].task.Priority {
		return h[i].task.Priority > h[j].task.Priority
	}
	return h[i].seq < h[j].seq
}
func (h taskHeap) Swap(i, j int) { h[i], h[j] = h[j], h[i] }
func (h *taskHeap) Push(x any) {
	*h = append(*h, x.(pqItem))
}
func (h *taskHeap) Pop() any {
	old := *h
	n := len(old)
	it := old[n-1]
	*h = old[:n-1]
	return it
}

// NewPriorityPool создаёт пул из workers воркеров.
func NewPriorityPool(workers int) *PriorityPool {
	if workers < 1 {
		workers = 1
	}
	p := &PriorityPool{workers: workers}
	p.cond = sync.NewCond(&p.mu)
	return p
}

// Submit добавляет задачу. Неблокирующий: просто кладёт в кучу под мьютексом.
func (p *PriorityPool) Submit(t Task) {
	p.mu.Lock()
	if p.stopped {
		p.mu.Unlock()
		return
	}
	heap.Push(&p.pq, pqItem{task: t, seq: p.seq})
	p.seq++
	p.mu.Unlock()
	p.cond.Signal()
}

// Start запускает воркеры.
func (p *PriorityPool) Start() {
	p.wg.Add(p.workers)
	for i := 0; i < p.workers; i++ {
		go p.worker()
	}
}

func (p *PriorityPool) worker() {
	defer p.wg.Done()
	for {
		p.mu.Lock()
		for p.pq.Len() == 0 && !p.stopped {
			p.cond.Wait()
		}
		if p.pq.Len() == 0 && p.stopped {
			p.mu.Unlock()
			return
		}
		it := heap.Pop(&p.pq).(pqItem)
		p.mu.Unlock()

		if it.task.Run != nil {
			it.task.Run()
		}
	}
}

// Stop дренирует очередь и останавливает пул.
func (p *PriorityPool) Stop() {
	p.mu.Lock()
	p.stopped = true
	p.mu.Unlock()
	p.cond.Broadcast()
	p.wg.Wait()
}
