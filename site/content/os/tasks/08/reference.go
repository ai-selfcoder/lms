// В песочницу не отправляется.
package solution

// Эталонная реализация детекта дедлока через DFS с тремя цветами.
func HasDeadlockReference(waitsFor map[int][]int) bool {
	const (
		white = 0
		gray  = 1
		black = 2
	)
	color := make(map[int]int)

	var dfs func(node int) bool
	dfs = func(node int) bool {
		color[node] = gray
		for _, next := range waitsFor[node] {
			switch color[next] {
			case gray:
				return true
			case white:
				if dfs(next) {
					return true
				}
			}
		}
		color[node] = black
		return false
	}

	for node := range waitsFor {
		if color[node] == white {
			if dfs(node) {
				return true
			}
		}
	}
	return false
}
