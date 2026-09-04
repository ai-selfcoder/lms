package solution

import (
	"reflect"
	"testing"
)

func TestReplay_Empty(t *testing.T) {
	got := Replay(nil)
	if len(got) != 0 {
		t.Fatalf("empty log: got %v, want empty map", got)
	}
}

func TestReplay_SingleCommittedTxn(t *testing.T) {
	log := []Record{
		{Op: "set", Key: "x", Val: 1},
		{Op: "set", Key: "y", Val: 2},
		{Op: "commit"},
	}
	got := Replay(log)
	want := map[string]int{"x": 1, "y": 2}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestReplay_TornTailDropped(t *testing.T) {
	log := []Record{
		{Op: "set", Key: "x", Val: 1},
		{Op: "commit"},
		{Op: "set", Key: "x", Val: 99},
		{Op: "set", Key: "z", Val: 5},
	}
	got := Replay(log)
	want := map[string]int{"x": 1}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("torn tail: got %v, want %v", got, want)
	}
}

func TestReplay_MultipleTxnsOverwrite(t *testing.T) {
	log := []Record{
		{Op: "set", Key: "a", Val: 1},
		{Op: "commit"},
		{Op: "set", Key: "a", Val: 2},
		{Op: "set", Key: "b", Val: 7},
		{Op: "commit"},
	}
	got := Replay(log)
	want := map[string]int{"a": 2, "b": 7}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestReplay_LastWriteWinsWithinTxn(t *testing.T) {
	log := []Record{
		{Op: "set", Key: "k", Val: 1},
		{Op: "set", Key: "k", Val: 2},
		{Op: "set", Key: "k", Val: 3},
		{Op: "commit"},
	}
	got := Replay(log)
	want := map[string]int{"k": 3}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestReplay_AllCommitted(t *testing.T) {
	log := []Record{
		{Op: "set", Key: "p", Val: 10},
		{Op: "commit"},
		{Op: "set", Key: "q", Val: 20},
		{Op: "commit"},
		{Op: "set", Key: "r", Val: 30},
		{Op: "commit"},
	}
	got := Replay(log)
	want := map[string]int{"p": 10, "q": 20, "r": 30}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}
