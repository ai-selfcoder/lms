package solution

import (
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
)

// TestBasicSetGetDelete: базовая функциональная корректность.
func TestBasicSetGetDelete(t *testing.T) {
	m := NewShardedMap()

	if _, ok := m.Get("missing"); ok {
		t.Fatalf("Get несуществующего ключа вернул ok=true")
	}

	m.Set("a", 1)
	m.Set("b", "two")
	if v, ok := m.Get("a"); !ok || v != 1 {
		t.Fatalf("Get(a) = (%v, %v), ожидалось (1, true)", v, ok)
	}
	if v, ok := m.Get("b"); !ok || v != "two" {
		t.Fatalf("Get(b) = (%v, %v), ожидалось (two, true)", v, ok)
	}

	// Перезапись.
	m.Set("a", 99)
	if v, _ := m.Get("a"); v != 99 {
		t.Fatalf("после перезаписи Get(a) = %v, ожидалось 99", v)
	}

	if got := m.Len(); got != 2 {
		t.Fatalf("Len() = %d, ожидалось 2", got)
	}

	m.Delete("a")
	if _, ok := m.Get("a"); ok {
		t.Fatalf("после Delete(a) ключ всё ещё присутствует")
	}
	if got := m.Len(); got != 1 {
		t.Fatalf("после Delete Len() = %d, ожидалось 1", got)
	}
}

// TestManyKeysDistribute: множество различных ключей корректно хранятся.
// Len, равный числу различных ключей, подтверждает распределение без коллизий
// (все ключи доступны независимо от шарда, куда попали).
func TestManyKeysDistribute(t *testing.T) {
	m := NewShardedMap()
	const n = 1000
	for i := 0; i < n; i++ {
		m.Set(fmt.Sprintf("key-%d", i), i)
	}
	if got := m.Len(); got != n {
		t.Fatalf("Len() = %d, ожидалось %d", got, n)
	}
	for i := 0; i < n; i++ {
		v, ok := m.Get(fmt.Sprintf("key-%d", i))
		if !ok || v != i {
			t.Fatalf("Get(key-%d) = (%v, %v), ожидалось (%d, true)", i, v, ok, i)
		}
	}
}

// TestConcurrentAccess: тяжёлая конкурентная нагрузка под -race.
func TestConcurrentAccess(t *testing.T) {
	m := NewShardedMap()
	const workers = 64
	const perWorker = 500

	var mismatch int32
	var wg sync.WaitGroup
	wg.Add(workers)
	for w := 0; w < workers; w++ {
		go func(w int) {
			defer wg.Done()
			for i := 0; i < perWorker; i++ {
				key := fmt.Sprintf("w%d-k%d", w, i)
				m.Set(key, i)
				if v, ok := m.Get(key); !ok || v != i {
					atomic.AddInt32(&mismatch, 1)
				}
				if i%2 == 0 {
					m.Delete(key)
				}
			}
		}(w)
	}
	wg.Wait()

	if mismatch != 0 {
		t.Fatalf("обнаружено %d несоответствий Set/Get под нагрузкой", mismatch)
	}

	// Осталась половина ключей (нечётные i).
	want := workers * (perWorker / 2)
	if got := m.Len(); got != want {
		t.Fatalf("после конкурентной нагрузки Len() = %d, ожидалось %d", got, want)
	}
}

// TestConcurrentSameKeys: конкурентная работа над пересекающимися ключами.
func TestConcurrentSameKeys(t *testing.T) {
	m := NewShardedMap()
	const workers = 32
	var wg sync.WaitGroup
	wg.Add(workers)
	for w := 0; w < workers; w++ {
		go func() {
			defer wg.Done()
			for i := 0; i < 200; i++ {
				key := fmt.Sprintf("shared-%d", i%50)
				m.Set(key, i)
				_, _ = m.Get(key)
			}
		}()
	}
	wg.Wait()

	if got := m.Len(); got != 50 {
		t.Fatalf("Len() = %d, ожидалось 50 различных ключей", got)
	}
}
