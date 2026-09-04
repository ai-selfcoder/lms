package solution

import "testing"

func TestHasDeadlock(t *testing.T) {
	tests := []struct {
		name     string
		waitsFor map[int][]int
		want     bool
	}{
		{
			name:     "empty graph",
			waitsFor: map[int][]int{},
			want:     false,
		},
		{
			name:     "nil graph",
			waitsFor: nil,
			want:     false,
		},
		{
			name:     "single node no edges",
			waitsFor: map[int][]int{1: {}},
			want:     false,
		},
		{
			name:     "self loop",
			waitsFor: map[int][]int{1: {1}},
			want:     true,
		},
		{
			name:     "two node cycle",
			waitsFor: map[int][]int{1: {2}, 2: {1}},
			want:     true,
		},
		{
			name:     "chain no cycle",
			waitsFor: map[int][]int{1: {2}, 2: {3}, 3: {}},
			want:     false,
		},
		{
			name:     "longer cycle",
			waitsFor: map[int][]int{1: {2}, 2: {3}, 3: {4}, 4: {1}},
			want:     true,
		},
		{
			name:     "diamond no cycle",
			waitsFor: map[int][]int{1: {2, 3}, 2: {4}, 3: {4}, 4: {}},
			want:     false,
		},
		{
			name:     "cycle in second component",
			waitsFor: map[int][]int{1: {2}, 2: {}, 3: {4}, 4: {3}},
			want:     true,
		},
		{
			name:     "node only in values",
			waitsFor: map[int][]int{1: {2}},
			want:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := HasDeadlock(tt.waitsFor)
			if got != tt.want {
				t.Fatalf("HasDeadlock(%v) = %v, want %v", tt.waitsFor, got, tt.want)
			}
		})
	}
}
