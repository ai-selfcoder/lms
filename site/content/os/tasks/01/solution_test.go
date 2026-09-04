package solution

import (
	"reflect"
	"testing"
)

func TestSchedule_AlternatesQuantumOne(t *testing.T) {
	got := Schedule([]Job{{"A", 3}, {"B", 3}}, 1)
	want := []string{"A", "B", "A", "B", "A", "B"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("quantum=1: got %v, want %v", got, want)
	}
}

func TestSchedule_QuantumTwo(t *testing.T) {
	got := Schedule([]Job{{"A", 5}, {"B", 3}}, 2)
	want := []string{"A", "A", "B", "B", "A", "A", "B", "A"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("quantum=2: got %v, want %v", got, want)
	}
}

func TestSchedule_SingleJob(t *testing.T) {
	got := Schedule([]Job{{"A", 4}}, 2)
	want := []string{"A", "A", "A", "A"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("single job: got %v, want %v", got, want)
	}
}

func TestSchedule_Empty(t *testing.T) {
	got := Schedule(nil, 2)
	if len(got) != 0 {
		t.Fatalf("empty: got %v, want empty", got)
	}
}

func TestSchedule_TotalTicksEqualTotalBurst(t *testing.T) {
	jobs := []Job{{"A", 7}, {"B", 2}, {"C", 4}}
	got := Schedule(jobs, 3)
	total := 0
	for _, j := range jobs {
		total += j.Burst
	}
	if len(got) != total {
		t.Fatalf("expected %d ticks, got %d (%v)", total, len(got), got)
	}
}
