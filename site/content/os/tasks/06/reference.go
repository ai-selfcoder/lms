// В песочницу не отправляется.
package solution

// AllocateReference — эталонная реализация first-fit без освобождения.
func AllocateReference(size int, requests []int) []int {
	result := make([]int, 0, len(requests))
	cursor := 0
	for _, r := range requests {
		if r <= size-cursor {
			result = append(result, cursor)
			cursor += r
		} else {
			result = append(result, -1)
		}
	}
	return result
}
