package solution

import "sync"

// call описывает одно выполнение fn для конкретного ключа.
type call struct {
	wg  sync.WaitGroup
	val interface{}
	err error
}

// Group подавляет дублирующиеся вызовы по ключу.
type Group struct {
	mu sync.Mutex
	m  map[string]*call
}

// Do выполняет fn для key. Параллельные вызовы с тем же key
// дожидаются результата единственного выполнения fn.
func (g *Group) Do(key string, fn func() (interface{}, error)) (interface{}, error) {
	g.mu.Lock()
	if g.m == nil {
		g.m = make(map[string]*call)
	}
	if c, ok := g.m[key]; ok {
		// Кто-то уже выполняет fn для этого ключа — ждём результат.
		g.mu.Unlock()
		c.wg.Wait()
		return c.val, c.err
	}

	// Мы первые: создаём call и запускаем fn.
	c := new(call)
	c.wg.Add(1)
	g.m[key] = c
	g.mu.Unlock()

	c.val, c.err = fn()
	c.wg.Done()

	// Удаляем запись, чтобы следующая волна снова могла выполнить fn.
	g.mu.Lock()
	delete(g.m, key)
	g.mu.Unlock()

	return c.val, c.err
}
