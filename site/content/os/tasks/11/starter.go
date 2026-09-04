package solution

// MaxFileSize вычисляет максимальный размер файла в байтах для inode с прямыми и
// косвенными (single/double/triple-indirect) указателями.
//
// Параметры:
//   - blockSize — размер блока в байтах;
//   - direct    — число прямых указателей в inode;
//   - ptrSize   — размер одного указателя в байтах.
//
// Модель: p = blockSize / ptrSize указателей помещается в один блок. Ёмкость в
// блоках данных равна direct + p + p*p + p*p*p (прямые + single + double +
// triple indirect). Размер в байтах = это число блоков * blockSize.
//
// Краевые случаи: если blockSize <= 0 или ptrSize <= 0 — верни 0. Считаем, что
// blockSize кратен ptrSize.
//
// Пример: MaxFileSize(8, 2, 4) → p = 2, blocks = 2+2+4+8 = 16, размер = 128.
func MaxFileSize(blockSize, direct, ptrSize int) int {
	// твоя реализация
	return 0
}
