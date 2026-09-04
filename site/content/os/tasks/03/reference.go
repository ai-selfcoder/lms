// В песочницу не отправляется.
package solution

// TranslateReference — эталонная реализация base-and-bounds трансляции.
func TranslateReference(va, base, bound int) (int, bool) {
	if va < 0 || va >= bound {
		return 0, false
	}
	return base + va, true
}
