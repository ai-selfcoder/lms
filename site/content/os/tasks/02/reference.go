package solution

import "sort"

// Эталон. В песочницу не отправляется.
func AvgTurnaroundReference(jobs []Job) float64 {
	if len(jobs) == 0 {
		return 0
	}
	bursts := make([]int, len(jobs))
	for i, j := range jobs {
		bursts[i] = j.Burst
	}
	sort.Ints(bursts) // SJF: короткие первыми

	clock := 0
	sum := 0
	for _, b := range bursts {
		clock += b // момент завершения текущей задачи
		sum += clock
	}
	return float64(sum) / float64(len(jobs))
}
