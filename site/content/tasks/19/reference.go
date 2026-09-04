package solution

import (
	"hash/fnv"
	"sync"
)

const shardCount = 32

// shard — один сегмент map со своим мьютексом.
type shard struct {
	mu sync.RWMutex
	m  map[string]interface{}
}

// ShardedMap — потокобезопасная map с шардированием на 32 шарда.
type ShardedMap struct {
	shards [shardCount]*shard
}

// NewShardedMap создаёт пустую шардированную map.
func NewShardedMap() *ShardedMap {
	m := &ShardedMap{}
	for i := 0; i < shardCount; i++ {
		m.shards[i] = &shard{m: make(map[string]interface{})}
	}
	return m
}

// shardFor выбирает шард по хешу ключа.
func (m *ShardedMap) shardFor(key string) *shard {
	h := fnv.New32a()
	_, _ = h.Write([]byte(key))
	return m.shards[h.Sum32()%shardCount]
}

// Set сохраняет значение по ключу.
func (m *ShardedMap) Set(key string, value interface{}) {
	s := m.shardFor(key)
	s.mu.Lock()
	s.m[key] = value
	s.mu.Unlock()
}

// Get возвращает значение по ключу и признак его наличия.
func (m *ShardedMap) Get(key string) (interface{}, bool) {
	s := m.shardFor(key)
	s.mu.RLock()
	v, ok := s.m[key]
	s.mu.RUnlock()
	return v, ok
}

// Delete удаляет ключ.
func (m *ShardedMap) Delete(key string) {
	s := m.shardFor(key)
	s.mu.Lock()
	delete(s.m, key)
	s.mu.Unlock()
}

// Len возвращает суммарное число элементов во всех шардах.
func (m *ShardedMap) Len() int {
	n := 0
	for i := 0; i < shardCount; i++ {
		s := m.shards[i]
		s.mu.RLock()
		n += len(s.m)
		s.mu.RUnlock()
	}
	return n
}
