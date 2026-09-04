package solution

import "sync"

const maxConcurrency = 10
const maxDepth = 3

// CollectFriends собирает ID всех друзей до глубины 3, опрашивая getFriends.
// Ограничение: не более 10 одновременных вызовов getFriends.
// Защита от циклов. Сборка результата без гонок.
func CollectFriends(startID int, getFriends func(id int) ([]int, error)) ([]int, error) {
	var mu sync.Mutex
	visited := map[int]bool{startID: true} // не обходим стартовую вершину повторно
	result := make(map[int]bool)
	var firstErr error

	sem := make(chan struct{}, maxConcurrency)

	// frontier — вершины текущего уровня, чьих друзей нужно запросить.
	frontier := []int{startID}

	for depth := 0; depth < maxDepth && len(frontier) > 0; depth++ {
		var wg sync.WaitGroup
		var nextMu sync.Mutex
		var next []int

		for _, id := range frontier {
			wg.Add(1)
			go func(id int) {
				defer wg.Done()

				sem <- struct{}{}        // занять слот
				defer func() { <-sem }() // освободить слот

				friends, err := getFriends(id)
				if err != nil {
					mu.Lock()
					if firstErr == nil {
						firstErr = err
					}
					mu.Unlock()
					return
				}

				mu.Lock()
				var newOnes []int
				for _, f := range friends {
					result[f] = true
					if !visited[f] {
						visited[f] = true
						newOnes = append(newOnes, f)
					}
				}
				mu.Unlock()

				if len(newOnes) > 0 {
					nextMu.Lock()
					next = append(next, newOnes...)
					nextMu.Unlock()
				}
			}(id)
		}

		wg.Wait()

		if firstErr != nil {
			return nil, firstErr
		}

		frontier = next
	}

	out := make([]int, 0, len(result))
	for id := range result {
		out = append(out, id)
	}
	return out, nil
}
