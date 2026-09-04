package solution

import "testing"

func TestSpinSum_Empty(t *testing.T) {
	if got := SpinSum(0, 100); got != 0 {
		t.Fatalf("0 горутин: got %d, want 0", got)
	}
}

func TestSpinSum_ZeroWork(t *testing.T) {
	if got := SpinSum(1, 0); got != 0 {
		t.Fatalf("perGoroutine=0: got %d, want 0", got)
	}
}

func TestSpinSum_Single(t *testing.T) {
	if got := SpinSum(1, 1); got != 1 {
		t.Fatalf("1x1: got %d, want 1", got)
	}
}

func TestSpinSum_Typical(t *testing.T) {
	got := SpinSum(4, 250)
	want := 4 * 250
	if got != want {
		t.Fatalf("4x250: got %d, want %d", got, want)
	}
}

func TestSpinSum_HighContention(t *testing.T) {
	got := SpinSum(50, 1000)
	want := 50 * 1000
	if got != want {
		t.Fatalf("50x1000: got %d, want %d", got, want)
	}
}

func TestSpinSum_Table(t *testing.T) {
	cases := []struct {
		goroutines, perGoroutine int
	}{
		{2, 500},
		{8, 125},
		{16, 64},
		{100, 100},
	}
	for _, c := range cases {
		got := SpinSum(c.goroutines, c.perGoroutine)
		want := c.goroutines * c.perGoroutine
		if got != want {
			t.Fatalf("SpinSum(%d,%d): got %d, want %d",
				c.goroutines, c.perGoroutine, got, want)
		}
	}
}
