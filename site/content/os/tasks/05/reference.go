package solution

// В песочницу не отправляется.
// Эталонная реализация подсчёта промахов при LRU.
func LRUMissesReference(refs []int, capacity int) int {
	if capacity <= 0 {
		return len(refs)
	}

	misses := 0
	order := make([]int, 0, capacity) // голова — самая старая, хвост — самая свежая
	inCache := make(map[int]bool, capacity)

	makeFreshest := func(page int) {
		for i, p := range order {
			if p == page {
				order = append(order[:i], order[i+1:]...)
				break
			}
		}
		order = append(order, page)
	}

	for _, page := range refs {
		if inCache[page] {
			makeFreshest(page)
			continue
		}
		misses++
		if len(order) >= capacity {
			victim := order[0]
			order = order[1:]
			delete(inCache, victim)
		}
		inCache[page] = true
		makeFreshest(page)
	}
	return misses
}
