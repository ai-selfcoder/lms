// В песочницу не отправляется.
package solution

// Эталонная реализация расчёта максимального размера файла по inode.
func MaxFileSizeReference(blockSize, direct, ptrSize int) int {
	if blockSize <= 0 || ptrSize <= 0 {
		return 0
	}
	p := blockSize / ptrSize
	blocks := direct + p + p*p + p*p*p
	return blocks * blockSize
}
