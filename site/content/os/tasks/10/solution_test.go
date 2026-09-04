package solution

import "testing"

func TestUsableCapacity_Table(t *testing.T) {
	cases := []struct {
		name     string
		level    int
		disks    int
		diskSize int
		want     int
	}{
		{"raid0 typical", 0, 4, 100, 400},
		{"raid0 single disk", 0, 1, 100, 100},
		{"raid1 mirror", 1, 2, 100, 100},
		{"raid1 three disks still one size", 1, 3, 100, 100},
		{"raid1 too few disks", 1, 1, 100, 0},
		{"raid5 typical", 5, 4, 100, 300},
		{"raid5 min disks", 5, 3, 50, 100},
		{"raid5 too few disks", 5, 2, 100, 0},
		{"raid10 two pairs", 10, 4, 100, 200},
		{"raid10 three pairs", 10, 6, 100, 300},
		{"raid10 odd disks invalid", 10, 5, 100, 0},
		{"raid10 too few disks", 10, 2, 100, 0},
		{"unknown level", 7, 4, 100, 0},
		{"zero disks", 0, 0, 100, 0},
		{"negative disk size", 0, 4, -10, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := UsableCapacity(c.level, c.disks, c.diskSize)
			if got != c.want {
				t.Fatalf("UsableCapacity(%d, %d, %d) = %d, want %d",
					c.level, c.disks, c.diskSize, got, c.want)
			}
		})
	}
}
