// В песочницу не отправляется.
package solution

import "sort"

func seekAbs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// TotalSeekReference — эталонная реализация подсчёта суммарного хода головки.
func TotalSeekReference(start int, requests []int, policy string) int {
	if len(requests) == 0 {
		return 0
	}

	switch policy {
	case "FIFO":
		total, cur := 0, start
		for _, r := range requests {
			total += seekAbs(r - cur)
			cur = r
		}
		return total

	case "SSTF":
		pending := make([]int, len(requests))
		copy(pending, requests)
		total, cur := 0, start
		for len(pending) > 0 {
			best, bestIdx := -1, -1
			for i, r := range pending {
				d := seekAbs(r - cur)
				if best == -1 || d < best || (d == best && r < pending[bestIdx]) {
					best, bestIdx = d, i
				}
			}
			total += best
			cur = pending[bestIdx]
			pending = append(pending[:bestIdx], pending[bestIdx+1:]...)
		}
		return total

	case "SCAN":
		var up, down []int
		for _, r := range requests {
			if r >= start {
				up = append(up, r)
			} else {
				down = append(down, r)
			}
		}
		sort.Ints(up)
		sort.Sort(sort.Reverse(sort.IntSlice(down)))
		total, cur := 0, start
		for _, r := range up {
			total += seekAbs(r - cur)
			cur = r
		}
		for _, r := range down {
			total += seekAbs(r - cur)
			cur = r
		}
		return total
	}

	return 0
}
