package solution

import "sync"

// Router маршрутизирует сообщения подписчикам по тегам.
type Router struct {
	mu   sync.Mutex
	subs map[string][]func(Message)

	in   chan Message
	done chan struct{}
	wg   sync.WaitGroup
	once sync.Once
}

// NewRouter создаёт маршрутизатор.
func NewRouter() *Router {
	return &Router{
		subs: make(map[string][]func(Message)),
		in:   make(chan Message, 1024),
		done: make(chan struct{}),
	}
}

// Subscribe регистрирует обработчик для тега.
func (r *Router) Subscribe(tag string, handler func(Message)) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.subs[tag] = append(r.subs[tag], handler)
}

// Publish помещает сообщение в очередь на доставку.
func (r *Router) Publish(msg Message) {
	r.in <- msg
}

// Start запускает цикл диспетчеризации.
func (r *Router) Start() {
	r.wg.Add(1)
	go func() {
		defer r.wg.Done()
		for msg := range r.in {
			r.dispatch(msg)
		}
	}()
}

func (r *Router) dispatch(msg Message) {
	r.mu.Lock()
	handlers := r.subs[msg.Tag]
	// Копируем срез, чтобы не держать мьютекс во время вызовов.
	cp := make([]func(Message), len(handlers))
	copy(cp, handlers)
	r.mu.Unlock()

	for _, h := range cp {
		h(msg)
	}
}

// Stop дренирует очередь и останавливает диспетчер.
func (r *Router) Stop() {
	r.once.Do(func() {
		close(r.in)
	})
	r.wg.Wait()
}
