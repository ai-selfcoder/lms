package solution

import "testing"

func TestTotalSeek_FIFO(t *testing.T) {
	reqs := []int{98, 183, 37, 122, 14, 124, 65, 67}
	got := TotalSeek(53, reqs, "FIFO")
	if got != 640 {
		t.Fatalf("FIFO: got %d, want 640", got)
	}
}

func TestTotalSeek_SSTF(t *testing.T) {
	reqs := []int{98, 183, 37, 122, 14, 124, 65, 67}
	got := TotalSeek(53, reqs, "SSTF")
	if got != 236 {
		t.Fatalf("SSTF: got %d, want 236", got)
	}
}

func TestTotalSeek_SCAN(t *testing.T) {
	reqs := []int{98, 183, 37, 122, 14, 124, 65, 67}
	got := TotalSeek(53, reqs, "SCAN")
	if got != 299 {
		t.Fatalf("SCAN: got %d, want 299", got)
	}
}

func TestTotalSeek_Empty(t *testing.T) {
	if got := TotalSeek(50, nil, "FIFO"); got != 0 {
		t.Fatalf("empty: got %d, want 0", got)
	}
}

func TestTotalSeek_SingleRequest(t *testing.T) {
	if got := TotalSeek(50, []int{30}, "SSTF"); got != 20 {
		t.Fatalf("single: got %d, want 20", got)
	}
}

func TestTotalSeek_SSTFTieLowerCylinder(t *testing.T) {
	// На равном расстоянии (|40-50|=|60-50|) первым берём 40 (меньший номер):
	// 50→40 = 10, затем 40→60 = 20, итого 30.
	if got := TotalSeek(50, []int{60, 40}, "SSTF"); got != 30 {
		t.Fatalf("tie: got %d, want 30", got)
	}
}

func TestTotalSeek_SCANNoEdgeTravel(t *testing.T) {
	// start=50: вверх 60,80 (50→80 = 30), вниз 40 (80→40 = 40), итого 70.
	if got := TotalSeek(50, []int{60, 40, 80}, "SCAN"); got != 70 {
		t.Fatalf("scan no-edge: got %d, want 70", got)
	}
}
