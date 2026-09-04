package solution

import (
	"context"
	"sync"
)

// ProcessOrders обрабатывает orderIDs пулом из w воркеров (w одновременно).
// process(id) может вернуть error. При первой критической ошибке все воркеры
// немедленно прекращают работу, функция возвращает эту ошибку.
func ProcessOrders(orderIDs []int, w int, process func(id int) error) error {
	if w < 1 {
		w = 1
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	tasks := make(chan int)

	var (
		mu      sync.Mutex
		firstErr error
	)

	var wg sync.WaitGroup
	wg.Add(w)
	for i := 0; i < w; i++ {
		go func() {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case id, ok := <-tasks:
					if !ok {
						return
					}
					if err := process(id); err != nil {
						mu.Lock()
						if firstErr == nil {
							firstErr = err
						}
						mu.Unlock()
						cancel()
						return
					}
				}
			}
		}()
	}

	// Раздаём задачи, останавливаясь при отмене контекста.
feed:
	for _, id := range orderIDs {
		select {
		case <-ctx.Done():
			break feed
		case tasks <- id:
		}
	}
	close(tasks)

	wg.Wait()

	mu.Lock()
	defer mu.Unlock()
	return firstErr
}
