package solution

import (
	"fmt"
	"sync"
	"testing"
)

func TestCacheSetGet(t *testing.T) {
	c := NewCache()
	c.Set("a", 1)
	c.Set("b", "hello")

	if v, ok := c.Get("a"); !ok || v != 1 {
		t.Fatalf("Get(\"a\") = (%v, %v), ожидалось (1, true)", v, ok)
	}
	if v, ok := c.Get("b"); !ok || v != "hello" {
		t.Fatalf("Get(\"b\") = (%v, %v), ожидалось (\"hello\", true)", v, ok)
	}
}

func TestCacheGetMissing(t *testing.T) {
	c := NewCache()
	if v, ok := c.Get("nope"); ok || v != nil {
		t.Fatalf("Get несуществующего ключа = (%v, %v), ожидалось (nil, false)", v, ok)
	}
}

func TestCacheOverwrite(t *testing.T) {
	c := NewCache()
	c.Set("k", 1)
	c.Set("k", 2)
	if v, ok := c.Get("k"); !ok || v != 2 {
		t.Fatalf("после перезаписи Get(\"k\") = (%v, %v), ожидалось (2, true)", v, ok)
	}
}

func TestCacheDelete(t *testing.T) {
	c := NewCache()
	c.Set("k", 42)
	c.Delete("k")
	if v, ok := c.Get("k"); ok || v != nil {
		t.Fatalf("после Delete Get(\"k\") = (%v, %v), ожидалось (nil, false)", v, ok)
	}
	// Повторное удаление должно быть безопасным.
	c.Delete("k")
	c.Delete("never-existed")
}

func TestCacheConcurrent(t *testing.T) {
	c := NewCache()
	const writers = 8
	const readers = 64
	const ops = 2000

	// Предзаполним пространство ключей.
	keys := make([]string, 32)
	for i := range keys {
		keys[i] = fmt.Sprintf("key-%d", i)
		c.Set(keys[i], i)
	}

	var wg sync.WaitGroup

	// Писатели: Set и Delete (примерно 5% нагрузки в реальности, здесь
	// просто проверяем отсутствие гонок).
	wg.Add(writers)
	for w := 0; w < writers; w++ {
		go func(w int) {
			defer wg.Done()
			for i := 0; i < ops; i++ {
				k := keys[(w+i)%len(keys)]
				if i%2 == 0 {
					c.Set(k, w*1000+i)
				} else {
					c.Delete(k)
				}
			}
		}(w)
	}

	// Читатели: основная масса операций.
	wg.Add(readers)
	for r := 0; r < readers; r++ {
		go func(r int) {
			defer wg.Done()
			for i := 0; i < ops; i++ {
				k := keys[(r+i)%len(keys)]
				_, _ = c.Get(k)
			}
		}(r)
	}

	wg.Wait()

	// После конкурентной фазы кэш должен оставаться рабочим.
	c.Set("final", "ok")
	if v, ok := c.Get("final"); !ok || v != "ok" {
		t.Fatalf("после конкурентной нагрузки Get(\"final\") = (%v, %v), ожидалось (\"ok\", true)", v, ok)
	}
}
