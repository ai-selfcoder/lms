package solution

// ProcessPriority читает из high и low и возвращает срез обработанных значений.
// При наличии данных в обоих каналах — сначала high. Не должно быть голодания
// low. Останавливается, когда оба канала закрыты.
func ProcessPriority(high, low <-chan int) []int {
	result := make([]int, 0)

	for high != nil || low != nil {
		// Шаг 1: пробуем сначала high без блокировки.
		select {
		case v, ok := <-high:
			if !ok {
				high = nil
				continue
			}
			result = append(result, v)
			continue
		default:
		}

		// Шаг 2: high пуст — ждём любой из каналов.
		select {
		case v, ok := <-high:
			if !ok {
				high = nil
				continue
			}
			result = append(result, v)
		case v, ok := <-low:
			if !ok {
				low = nil
				continue
			}
			result = append(result, v)
		}
	}

	return result
}
