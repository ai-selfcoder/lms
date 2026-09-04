package solution

import (
	"sort"
	"sync/atomic"
	"testing"
	"time"
)

// graph с циклами. Стартуем с 1.
//
// 1 -> 2, 3
// 2 -> 1, 4        (1 — цикл назад)
// 3 -> 4, 5
// 4 -> 6
// 5 -> 7
// 6 -> 8
// 7 -> 9
// 8 -> 10
// 9, 10 -> (нет)
//
// Уровни запросов getFriends (BFS, 3 итерации):
//   итерация 0: запросили 1        -> найдены {2,3}
//   итерация 1: запросили 2,3      -> найдены {1,4,5}  (1 уже visited, но в result попадает)
//   итерация 2: запросили 4,5      -> найдены {6,7}
// Итог result = {2,3,1,4,5,6,7}.
var testGraph = map[int][]int{
	1:  {2, 3},
	2:  {1, 4},
	3:  {4, 5},
	4:  {6},
	5:  {7},
	6:  {8},
	7:  {9},
	8:  {10},
	9:  {},
	10: {},
}

func sortedCopy(s []int) []int {
	out := append([]int(nil), s...)
	sort.Ints(out)
	return out
}

// TestCollectCorrect: множество достижимых за 3 шага вершин, без дубликатов.
func TestCollectCorrect(t *testing.T) {
	getFriends := func(id int) ([]int, error) {
		time.Sleep(2 * time.Millisecond)
		return append([]int(nil), testGraph[id]...), nil
	}

	got, err := CollectFriends(1, getFriends)
	if err != nil {
		t.Fatalf("CollectFriends вернул ошибку: %v", err)
	}

	// Проверка отсутствия дубликатов.
	seen := map[int]bool{}
	for _, v := range got {
		if seen[v] {
			t.Fatalf("в результате дубликат: %d", v)
		}
		seen[v] = true
	}

	want := []int{1, 2, 3, 4, 5, 6, 7}
	gs := sortedCopy(got)
	if len(gs) != len(want) {
		t.Fatalf("получено %v, ожидалось %v", gs, want)
	}
	for i := range want {
		if gs[i] != want[i] {
			t.Fatalf("получено %v, ожидалось %v", gs, want)
		}
	}
}

// TestConcurrencyLimited: число одновременных вызовов getFriends <= 10.
func TestConcurrencyLimited(t *testing.T) {
	var live int32
	var maxLive int32

	// Широкий граф: вершина 0 имеет 100 друзей, каждый из них тоже ветвится,
	// чтобы создать много одновременных вызовов.
	wide := map[int][]int{}
	wide[0] = make([]int, 0, 100)
	for i := 1; i <= 100; i++ {
		wide[0] = append(wide[0], i)
		wide[i] = []int{1000 + i}
	}

	getFriends := func(id int) ([]int, error) {
		cur := atomic.AddInt32(&live, 1)
		for {
			m := atomic.LoadInt32(&maxLive)
			if cur <= m || atomic.CompareAndSwapInt32(&maxLive, m, cur) {
				break
			}
		}
		time.Sleep(5 * time.Millisecond)
		atomic.AddInt32(&live, -1)
		return append([]int(nil), wide[id]...), nil
	}

	if _, err := CollectFriends(0, getFriends); err != nil {
		t.Fatalf("CollectFriends вернул ошибку: %v", err)
	}

	if m := atomic.LoadInt32(&maxLive); m > 10 {
		t.Fatalf("максимум одновременных вызовов getFriends = %d, ожидалось <=10", m)
	}
	if m := atomic.LoadInt32(&maxLive); m < 2 {
		t.Fatalf("параллелизм не использовался: maxLive=%d", m)
	}
}

// TestCycleSafe: взаимные друзья не приводят к бесконечному обходу.
func TestCycleSafe(t *testing.T) {
	cyclic := map[int][]int{
		1: {2},
		2: {1, 3},
		3: {2, 1},
	}
	var calls int32
	getFriends := func(id int) ([]int, error) {
		atomic.AddInt32(&calls, 1)
		return append([]int(nil), cyclic[id]...), nil
	}

	done := make(chan struct{})
	var got []int
	var err error
	go func() {
		got, err = CollectFriends(1, getFriends)
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(10 * time.Second):
		t.Fatalf("CollectFriends зациклился на графе с циклами")
	}

	if err != nil {
		t.Fatalf("CollectFriends вернул ошибку: %v", err)
	}

	// Достижимы 1,2,3 (1 — как друг 2 и 3).
	want := []int{1, 2, 3}
	gs := sortedCopy(got)
	if len(gs) != len(want) {
		t.Fatalf("получено %v, ожидалось %v", gs, want)
	}
	for i := range want {
		if gs[i] != want[i] {
			t.Fatalf("получено %v, ожидалось %v", gs, want)
		}
	}
}

// TestEmpty: у пользователя нет друзей.
func TestEmpty(t *testing.T) {
	getFriends := func(id int) ([]int, error) {
		return nil, nil
	}
	got, err := CollectFriends(42, getFriends)
	if err != nil {
		t.Fatalf("CollectFriends вернул ошибку: %v", err)
	}
	if len(got) != 0 {
		t.Fatalf("получено %v, ожидался пустой результат", got)
	}
}
