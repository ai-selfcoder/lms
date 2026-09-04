package solution

import "sync"

// job связывает входное значение с каналом-результатом (future).
type job struct {
	value  int
	result chan int
}

// ProcessOrdered обрабатывает вход параллельно, сохраняя порядок результатов.
func ProcessOrdered(in <-chan int, workers int, work func(int) int) <-chan int {
	if workers < 1 {
		workers = 1
	}

	out := make(chan int)
	// ordered — упорядоченная очередь future-каналов; буфер развязывает
	// диспетчер и воркеров.
	ordered := make(chan job, 1024)
	tasks := make(chan job, 1024)

	// Диспетчер: для каждого входа создаёт future, помещает его в обе очереди.
	go func() {
		for v := range in {
			j := job{value: v, result: make(chan int, 1)}
			ordered <- j
			tasks <- j
		}
		close(tasks)
		close(ordered)
	}()

	// Воркеры обрабатывают задачи параллельно.
	var wg sync.WaitGroup
	wg.Add(workers)
	for i := 0; i < workers; i++ {
		go func() {
			defer wg.Done()
			for j := range tasks {
				j.result <- work(j.value)
			}
		}()
	}

	// Коллектор читает future по порядку и пересылает результаты в out.
	// Дожидается завершения воркеров перед закрытием out (без утечек).
	go func() {
		defer close(out)
		for j := range ordered {
			out <- <-j.result
		}
		wg.Wait()
	}()

	return out
}
