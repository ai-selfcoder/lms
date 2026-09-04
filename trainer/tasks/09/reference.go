package solution

import "sync"

// Merge объединяет произвольное число входных каналов в один выходной канал.
// Выходной канал закрывается, когда все входные каналы вычитаны и закрыты.
func Merge(channels ...<-chan int) <-chan int {
	out := make(chan int)

	var wg sync.WaitGroup
	wg.Add(len(channels))

	for _, ch := range channels {
		go func(c <-chan int) {
			defer wg.Done()
			for v := range c {
				out <- v
			}
		}(ch)
	}

	go func() {
		wg.Wait()
		close(out)
	}()

	return out
}
