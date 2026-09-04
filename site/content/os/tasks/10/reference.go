// В песочницу не отправляется.
package solution

// UsableCapacityReference — эталонная реализация подсчёта полезной ёмкости RAID.
func UsableCapacityReference(level, disks, diskSize int) int {
	if disks <= 0 || diskSize < 0 {
		return 0
	}
	switch level {
	case 0:
		return disks * diskSize
	case 1:
		if disks < 2 {
			return 0
		}
		return diskSize
	case 5:
		if disks < 3 {
			return 0
		}
		return (disks - 1) * diskSize
	case 10:
		if disks < 4 || disks%2 != 0 {
			return 0
		}
		return (disks / 2) * diskSize
	default:
		return 0
	}
}
