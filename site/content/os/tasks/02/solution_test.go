package solution

import (
	"math"
	"testing"
)

func approx(a, b float64) bool { return math.Abs(a-b) < 1e-9 }

func TestAvgTurnaround_Basic(t *testing.T) {
	got := AvgTurnaround([]Job{{"A", 5}, {"B", 3}, {"C", 1}})
	want := float64(1+4+9) / 3.0
	if !approx(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestAvgTurnaround_OrderIndependent(t *testing.T) {
	// Тот же набор в другом порядке — SJF должен дать тот же результат.
	got := AvgTurnaround([]Job{{"C", 1}, {"A", 5}, {"B", 3}})
	want := float64(1+4+9) / 3.0
	if !approx(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestAvgTurnaround_Single(t *testing.T) {
	got := AvgTurnaround([]Job{{"A", 4}})
	if !approx(got, 4.0) {
		t.Fatalf("got %v, want 4.0", got)
	}
}

func TestAvgTurnaround_Empty(t *testing.T) {
	if got := AvgTurnaround(nil); !approx(got, 0) {
		t.Fatalf("got %v, want 0", got)
	}
}

func TestAvgTurnaround_BeatsFIFOWorstCase(t *testing.T) {
	// Длинная впереди коротких: SJF обязан быть не хуже наивного порядка.
	jobs := []Job{{"L", 10}, {"a", 1}, {"b", 1}, {"c", 1}}
	got := AvgTurnaround(jobs)
	want := float64(1+2+3+13) / 4.0 // порядок a,b,c,L → 1,2,3,13
	if !approx(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}
