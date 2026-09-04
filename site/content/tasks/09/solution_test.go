package solution

import (
	"sort"
	"testing"
	"time"
)

func makeChan(values ...int) <-chan int {
	ch := make(chan int, len(values))
	for _, v := range values {
		ch <- v
	}
	close(ch)
	return ch
}

func TestMerge(t *testing.T) {
	a := makeChan(1, 2, 3)
	b := makeChan(10, 20)
	c := makeChan(100, 200, 300, 400)

	out := Merge(a, b, c)

	var got []int
	done := make(chan struct{})
	go func() {
		for v := range out {
			got = append(got, v)
		}
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatalf("Merge: выходной канал не закрылся вовремя — нет корректного закрытия после слива всех входов")
	}

	want := []int{1, 2, 3, 10, 20, 100, 200, 300, 400}
	sort.Ints(got)
	sort.Ints(want)

	if len(got) != len(want) {
		t.Fatalf("Merge: ожидалось %d значений, получено %d", len(want), len(got))
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("Merge: мультимножество не совпало: ожидалось %v, получено %v", want, got)
		}
	}
}

func TestMergeEmpty(t *testing.T) {
	out := Merge()

	done := make(chan struct{})
	go func() {
		for range out {
		}
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatalf("Merge(): без каналов должен вернуться уже закрытый пустой канал")
	}
}
