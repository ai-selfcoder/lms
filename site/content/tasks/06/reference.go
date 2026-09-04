package solution

import "sync"

// Cache — потокобезопасный кэш «ключ-значение», оптимизированный под чтения.
type Cache struct {
	mu sync.RWMutex
	m  map[string]interface{}
}

// NewCache создаёт готовый к использованию кэш.
func NewCache() *Cache {
	return &Cache{
		m: make(map[string]interface{}),
	}
}

// Set сохраняет значение по ключу.
func (c *Cache) Set(key string, value interface{}) {
	c.mu.Lock()
	c.m[key] = value
	c.mu.Unlock()
}

// Get возвращает значение и true, если ключ присутствует; иначе nil, false.
func (c *Cache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	v, ok := c.m[key]
	c.mu.RUnlock()
	return v, ok
}

// Delete удаляет ключ из кэша.
func (c *Cache) Delete(key string) {
	c.mu.Lock()
	delete(c.m, key)
	c.mu.Unlock()
}
