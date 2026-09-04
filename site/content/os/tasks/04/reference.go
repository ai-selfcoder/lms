// В песочницу не отправляется.
package solution

func TranslateReference(va int, table []int, pageSize int) (int, bool) {
	vpn := va / pageSize
	offset := va % pageSize
	if vpn < 0 || vpn >= len(table) {
		return 0, false
	}
	frame := table[vpn]
	if frame < 0 {
		return 0, false
	}
	return frame*pageSize + offset, true
}
