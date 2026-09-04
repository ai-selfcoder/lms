package solution

import (
	"sync"
	"time"
)

// RunRateLimited: стадия 1 даёт userIDs; стадия 2 опрашивает API в `workers`
// воркерах, но суммарный темп вызовов callAPI не превышает rps запросов/сек.
func RunRateLimited(userIDs []int, workers, rps int, callAPI func(id int) string) []string {
	if workers < 1 {
		workers = 1
	}
	if rps < 1 {
		rps = 1
	}

	// Стадия 1: поставка userIDs в канал.
	ids := make(chan int)
	go func() {
		defer close(ids)
		for _, id := range userIDs {
			ids <- id
		}
	}()

	// Общий на весь пул лимитер: тик каждые time.Second/rps.
	ticker := time.NewTicker(time.Second / time.Duration(rps))
	defer ticker.Stop()

	var (
		mu      sync.Mutex
		results []string
	)

	var wg sync.WaitGroup
	wg.Add(workers)
	for i := 0; i < workers; i++ {
		go func() {
			defer wg.Done()
			for id := range ids {
				// Ждём разрешения от общего лимитера перед каждым вызовом.
				<-ticker.C
				res := callAPI(id)
				mu.Lock()
				results = append(results, res)
				mu.Unlock()
			}
		}()
	}

	wg.Wait()
	return results
}
