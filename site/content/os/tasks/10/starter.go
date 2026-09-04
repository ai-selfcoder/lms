package solution

// UsableCapacity возвращает полезную (доступную под данные) ёмкость RAID-массива.
//
// Параметры:
//   - level    — уровень RAID, одно из {0, 1, 5, 10};
//   - disks    — количество дисков в массиве;
//   - diskSize — ёмкость одного диска (в одинаковых единицах).
//
// Формулы по уровням:
//   - RAID0:  disks * diskSize          (нет избыточности);
//   - RAID1:  diskSize                  (зеркало, нужно disks >= 2);
//   - RAID5:  (disks - 1) * diskSize    (один диск под чётность, disks >= 3);
//   - RAID10: (disks / 2) * diskSize    (зеркальные пары, disks чётно и >= 4).
//
// Если конфигурация невалидна (неизвестный level, мало дисков, нечётное число
// дисков для RAID10, disks <= 0 или diskSize < 0) — возвращается 0.
//
// Пример: UsableCapacity(5, 4, 100) → 300
func UsableCapacity(level, disks, diskSize int) int {
	// твоя реализация
	return 0
}
