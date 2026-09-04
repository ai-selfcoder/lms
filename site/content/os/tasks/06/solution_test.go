package solution

import (
	"reflect"
	"testing"
)

func TestAllocate_Empty(t *testing.T) {
	got := Allocate(100, nil)
	if len(got) != 0 {
		t.Fatalf("empty: got %v, want empty", got)
	}
}

func TestAllocate_Single(t *testing.T) {
	got := Allocate(10, []int{4})
	want := []int{0}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("single: got %v, want %v", got, want)
	}
}

func TestAllocate_Sequential(t *testing.T) {
	got := Allocate(10, []int{2, 3, 1})
	want := []int{0, 2, 5}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("sequential: got %v, want %v", got, want)
	}
}

func TestAllocate_OutOfMemory(t *testing.T) {
	got := Allocate(5, []int{3, 3})
	want := []int{0, -1}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("out of memory: got %v, want %v", got, want)
	}
}

func TestAllocate_ExactFit(t *testing.T) {
	got := Allocate(6, []int{2, 4})
	want := []int{0, 2}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("exact fit: got %v, want %v", got, want)
	}
}

func TestAllocate_SmallerFitsAfterReject(t *testing.T) {
	got := Allocate(10, []int{6, 5, 4})
	want := []int{0, -1, 6}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("smaller after reject: got %v, want %v", got, want)
	}
}
