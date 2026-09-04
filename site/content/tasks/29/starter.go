package solution

// Router маршрутизирует сообщения подписчикам по тегам.
type Router struct{}

// NewRouter создаёт маршрутизатор.
func NewRouter() *Router {
	// Ваша реализация
	return &Router{}
}

// Subscribe регистрирует обработчик для тега.
func (r *Router) Subscribe(tag string, handler func(Message)) {
	// Ваша реализация
}

// Publish помещает сообщение в очередь на доставку.
func (r *Router) Publish(msg Message) {
	// Ваша реализация
}

// Start запускает цикл диспетчеризации.
func (r *Router) Start() {
	// Ваша реализация
}

// Stop дренирует очередь и останавливает диспетчер.
func (r *Router) Stop() {
	// Ваша реализация
}
