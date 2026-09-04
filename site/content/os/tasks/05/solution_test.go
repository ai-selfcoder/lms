package solution

import "testing"

func TestLRUMisses_BeladyClassic(t *testing.T) {
	got := LRUMisses([]int{1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5}, 3)
	want := 10
	if got != want {
		t.Fatalf("classic: got %d, want %d", got, want)
	}
}

func TestLRUMisses_RepeatedSamePage(t *testing.T) {
	got := LRUMisses([]int{1, 1, 1, 1}, 2)
	want := 1
	if got != want {
		t.Fatalf("repeated: got %d, want %d", got, want)
	}
}

func TestLRUMisses_CapacityBiggerThanUnique(t *testing.T) {
	got := LRUMisses([]int{1, 2, 3, 1, 2, 3}, 5)
	want := 3
	if got != want {
		t.Fatalf("big capacity: got %d, want %d", got, want)
	}
}

func TestLRUMisses_Empty(t *testing.T) {
	got := LRUMisses(nil, 3)
	if got != 0 {
		t.Fatalf("empty: got %d, want 0", got)
	}
}

func TestLRUMisses_SingleRef(t *testing.T) {
	got := LRUMisses([]int{42}, 1)
	if got != 1 {
		t.Fatalf("single: got %d, want 1", got)
	}
}

func TestLRUMisses_ZeroCapacityAllMiss(t *testing.T) {
	refs := []int{1, 2, 1, 3}
	got := LRUMisses(refs, 0)
	if got != len(refs) {
		t.Fatalf("zero capacity: got %d, want %d", got, len(refs))
	}
}

func TestLRUMisses_TraceExample(t *testing.T) {
	got := LRUMisses([]int{7, 0, 1, 2, 0, 3, 0, 4}, 3)
	want := 6
	if got != want {
		t.Fatalf("trace: got %d, want %d", got, want)
	}
}
