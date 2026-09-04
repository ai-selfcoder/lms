package solution

// Cache — потокобезопасный кэш «ключ-значение», оптимизированный под чтения.
type Cache struct {
	// Ваши поля
}

// NewCache создаёт готовый к использованию кэш.
func NewCache() *Cache {
	// Ваша реализация
	return &Cache{}
}

// Set сохраняет значение по ключу.
func (c *Cache) Set(key string, value interface{}) {
	// Ваша реализация
}

// Get возвращает значение и true, если ключ присутствует; иначе nil, false.
func (c *Cache) Get(key string) (interface{}, bool) {
	// Ваша реализация
	return nil, false
}

// Delete удаляет ключ из кэша.
func (c *Cache) Delete(key string) {
	// Ваша реализация
}
