package solution

// Translate переводит виртуальный адрес va в физический через одноуровневую
// таблицу страниц table. pageSize — размер страницы в байтах, всегда степень
// двойки.
//
// Алгоритм:
//   - vpn (virtual page number) = va / pageSize
//   - offset = va % pageSize
//   - если vpn выходит за границы table или table[vpn] < 0 (запись невалидна),
//     это page fault: вернуть (0, false)
//   - иначе физический адрес pa = table[vpn]*pageSize + offset, вернуть (pa, true)
//
// Пример:
//
//	table := []int{2, -1, 5} // pageSize = 16
//	Translate(35, table, 16) // vpn=2, offset=3 -> pa = 5*16+3 = 83, true
//	Translate(20, table, 16) // vpn=1 -> table[1] = -1 -> (0, false)  // page fault
func Translate(va int, table []int, pageSize int) (int, bool) {
	return 0, false
}
