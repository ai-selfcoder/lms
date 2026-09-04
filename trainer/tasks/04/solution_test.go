package solution

import (
	"sort"
	"testing"
	"time"
)

func TestProcessPriorityAllProcessed(t *testing.T) {
	high := make(chan int)
	low := make(chan int)

	go func() {
		for i := 1; i <= 5; i++ {
			high <- i
		}
		close(high)
	}()
	go func() {
		low <- 100
		low <- 101
		close(low)
	}()

	done := make(chan []int, 1)
	go func() { done <- ProcessPriority(high, low) }()

	var got []int
	select {
	case got = <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("ProcessPriority не завершился после закрытия обоих каналов")
	}

	if len(got) != 7 {
		t.Fatalf("ожидалось 7 обработанных значений, получено %d: %v", len(got), got)
	}

	// Проверяем равенство множеств: обработано ровно объединение входов.
	sorted := append([]int(nil), got...)
	sort.Ints(sorted)
	want := []int{1, 2, 3, 4, 5, 100, 101}
	for i := range want {
		if sorted[i] != want[i] {
			t.Fatalf("обработанные значения не совпадают с объединением входов: %v", sorted)
		}
	}
}

func TestProcessPriorityHighFirst(t *testing.T) {
	// Подаём оба канала уже заполненными (буферизированными), затем закрываем,
	// чтобы high был приоритетнее на старте детерминированно.
	high := make(chan int, 5)
	low := make(chan int, 2)
	for i := 1; i <= 5; i++ {
		high <- i
	}
	low <- 100
	low <- 101
	close(high)
	close(low)

	done := make(chan []int, 1)
	go func() { done <- ProcessPriority(high, low) }()

	var got []int
	select {
	case got = <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("ProcessPriority не завершился")
	}

	if len(got) != 7 {
		t.Fatalf("ожидалось 7 значений, получено %d: %v", len(got), got)
	}

	// Первые элементы должны быть из high (приоритет). Считаем, сколько high
	// встретилось до первого low.
	isHigh := func(v int) bool { return v >= 1 && v <= 5 }
	firstLowIdx := -1
	for i, v := range got {
		if !isHigh(v) {
			firstLowIdx = i
			break
		}
	}
	if firstLowIdx == -1 {
		t.Fatalf("low значения не обработаны вовсе: %v", got)
	}
	// При предзаполненных каналах high должен идти первым: ожидаем, что
	// до первого low обработано большинство high (как минимум 3 из 5).
	if firstLowIdx < 3 {
		t.Fatalf("приоритет high нарушен: low появился слишком рано (индекс %d) в %v", firstLowIdx, got)
	}
}

func TestProcessPriorityOnlyLow(t *testing.T) {
	high := make(chan int)
	low := make(chan int, 3)
	low <- 7
	low <- 8
	low <- 9
	close(low)
	close(high)

	done := make(chan []int, 1)
	go func() { done <- ProcessPriority(high, low) }()

	select {
	case got := <-done:
		if len(got) != 3 {
			t.Fatalf("ожидалось 3 значения из low, получено %d: %v", len(got), got)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("ProcessPriority не завершился при пустом high и закрытых каналах")
	}
}

func TestProcessPriorityNoStarvation(t *testing.T) {
	// Долгий поток high и несколько low — low не должен голодать.
	high := make(chan int)
	low := make(chan int)

	go func() {
		for i := 0; i < 50; i++ {
			high <- i
		}
		close(high)
	}()
	go func() {
		for i := 0; i < 5; i++ {
			low <- 1000 + i
		}
		close(low)
	}()

	done := make(chan []int, 1)
	go func() { done <- ProcessPriority(high, low) }()

	select {
	case got := <-done:
		if len(got) != 55 {
			t.Fatalf("ожидалось 55 значений, получено %d", len(got))
		}
		lowCount := 0
		for _, v := range got {
			if v >= 1000 {
				lowCount++
			}
		}
		if lowCount != 5 {
			t.Fatalf("low голодал: обработано %d из 5 low-значений", lowCount)
		}
	case <-time.After(10 * time.Second):
		t.Fatal("ProcessPriority не завершился (возможно голодание low заблокировало отправителя)")
	}
}
