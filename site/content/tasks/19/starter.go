package solution

// ShardedMap — потокобезопасная map с шардированием на 32 шарда.
type ShardedMap struct {
	// Ваши поля
}

// NewShardedMap создаёт пустую шардированную map.
func NewShardedMap() *ShardedMap {
	// Ваша реализация
	return &ShardedMap{}
}

// Set сохраняет значение по ключу.
func (m *ShardedMap) Set(key string, value interface{}) {
	// Ваша реализация
}

// Get возвращает значение по ключу и признак его наличия.
func (m *ShardedMap) Get(key string) (interface{}, bool) {
	// Ваша реализация
	return nil, false
}

// Delete удаляет ключ.
func (m *ShardedMap) Delete(key string) {
	// Ваша реализация
}

// Len возвращает суммарное число элементов во всех шардах.
func (m *ShardedMap) Len() int {
	// Ваша реализация
	return 0
}
