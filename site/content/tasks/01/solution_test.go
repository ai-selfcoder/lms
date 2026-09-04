package solution

import (
	"testing"
	"time"
)

// sig возвращает канал, который закроется через d.
func sig(d time.Duration) <-chan interface{} {
	c := make(chan interface{})
	go func() {
		defer close(c)
		time.Sleep(d)
	}()
	return c
}

func TestOrClosesByFastest(t *testing.T) {
	start := time.Now()
	<-or(
		sig(2*time.Hour),
		sig(5*time.Minute),
		sig(1*time.Second),
		sig(50*time.Millisecond),
		sig(3*time.Hour),
	)
	elapsed := time.Since(start)
	if elapsed > 600*time.Millisecond {
		t.Fatalf("or закрылся через %v, ожидалось ~50ms (по самому быстрому каналу)", elapsed)
	}
}

func TestOrSingle(t *testing.T) {
	c := make(chan interface{})
	out := or(c)
	go close(c)
	select {
	case <-out:
	case <-time.After(time.Second):
		t.Fatal("or с одним каналом должен закрыться при закрытии входного")
	}
}

func TestOrClosedNotJustSignalled(t *testing.T) {
	c := make(chan interface{})
	out := or(c, sig(time.Hour))
	close(c)
	// Первое чтение разблокируется.
	select {
	case <-out:
	case <-time.After(time.Second):
		t.Fatal("выходной канал не разблокировался после закрытия входного")
	}
	// Канал должен быть ИМЕННО закрыт: повторное чтение тоже не блокирует.
	select {
	case _, ok := <-out:
		if ok {
			t.Fatal("выходной канал должен быть закрыт, а не получать значения")
		}
	case <-time.After(time.Second):
		t.Fatal("выходной канал не закрыт (повторное чтение заблокировалось)")
	}
}

func TestOrEmpty(t *testing.T) {
	if or() != nil {
		t.Fatal("or() без аргументов должен вернуть nil")
	}
}
