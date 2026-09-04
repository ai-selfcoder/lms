package main

import (
	"context"
	"io"
	"log/slog"
	"sync"
	"testing"
	"time"
)

func testLog() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

// fakeRunner records concurrency and blocks each Run until released.
type fakeRunner struct {
	mu        sync.Mutex
	active    int
	maxActive int
	calls     int
	started   chan struct{} // one signal per Run entry
	release   chan struct{} // each Run waits for one receive (or close)
}

func (f *fakeRunner) Run(_ context.Context, _, code string) (RunResult, error) {
	f.mu.Lock()
	f.active++
	f.calls++
	if f.active > f.maxActive {
		f.maxActive = f.active
	}
	f.mu.Unlock()

	if f.started != nil {
		f.started <- struct{}{}
	}
	if f.release != nil {
		<-f.release
	}

	f.mu.Lock()
	f.active--
	f.mu.Unlock()
	return RunResult{Pass: true, Output: code}, nil
}

func testCfg() Config {
	return Config{
		RequestTimeout: 5 * time.Second,
		Concurrency:    1,
		MaxQueue:       10,
		JobTTL:         time.Minute,
	}
}

func TestQueuePositionFIFO(t *testing.T) {
	fr := &fakeRunner{started: make(chan struct{}, 10), release: make(chan struct{})}
	q := NewQueue(testCfg(), fr, testLog())
	defer q.Shutdown(context.Background())

	id1, err := q.Submit("d", "a")
	if err != nil {
		t.Fatal(err)
	}
	id2, _ := q.Submit("d", "b")
	id3, _ := q.Submit("d", "c")

	<-fr.started // job1 is now running

	st2, ok := q.Status(id2)
	if !ok || st2.Phase != PhaseQueued || st2.Position != 1 || st2.QueueLength != 2 {
		t.Fatalf("job2 = %+v ok=%v, want queued pos1 len2", st2, ok)
	}
	st3, _ := q.Status(id3)
	if st3.Position != 2 || st3.QueueLength != 2 {
		t.Fatalf("job3 = %+v, want pos2 len2", st3)
	}

	fr.release <- struct{}{} // job1 finishes
	<-fr.started             // job2 starts

	st3, _ = q.Status(id3)
	if st3.Position != 1 || st3.QueueLength != 1 {
		t.Fatalf("job3 after job1 done = %+v, want pos1 len1", st3)
	}

	st1, _ := q.Status(id1)
	if st1.Phase != PhaseDone || st1.Result == nil || !st1.Result.Pass {
		t.Fatalf("job1 = %+v, want done+pass", st1)
	}

	close(fr.release) // drain the rest
}

func TestQueueConcurrencyCap(t *testing.T) {
	cfg := testCfg()
	cfg.Concurrency = 3
	fr := &fakeRunner{started: make(chan struct{}, 100), release: make(chan struct{})}
	q := NewQueue(cfg, fr, testLog())
	defer q.Shutdown(context.Background())

	for i := 0; i < 10; i++ {
		if _, err := q.Submit("d", "x"); err != nil {
			t.Fatal(err)
		}
	}
	for i := 0; i < 3; i++ {
		<-fr.started
	}
	select {
	case <-fr.started:
		t.Fatal("a 4th Run started — concurrency cap breached")
	case <-time.After(100 * time.Millisecond):
	}
	close(fr.release) // let all finish

	deadline := time.Now().Add(2 * time.Second)
	for {
		fr.mu.Lock()
		done := fr.calls == 10
		fr.mu.Unlock()
		if done || time.Now().After(deadline) {
			break
		}
		time.Sleep(5 * time.Millisecond)
	}
	fr.mu.Lock()
	defer fr.mu.Unlock()
	if fr.maxActive != 3 {
		t.Fatalf("maxActive = %d, want 3", fr.maxActive)
	}
}

func TestQueueFull(t *testing.T) {
	cfg := testCfg()
	cfg.Concurrency = 1
	cfg.MaxQueue = 2
	fr := &fakeRunner{started: make(chan struct{}, 10), release: make(chan struct{})}
	q := NewQueue(cfg, fr, testLog())
	defer q.Shutdown(context.Background())

	if _, err := q.Submit("d", "1"); err != nil {
		t.Fatal(err)
	}
	<-fr.started // job1 running, waiting queue empty

	if _, err := q.Submit("d", "2"); err != nil {
		t.Fatalf("submit 2: %v", err)
	}
	if _, err := q.Submit("d", "3"); err != nil {
		t.Fatalf("submit 3: %v", err)
	}
	if _, err := q.Submit("d", "4"); err != ErrQueueFull {
		t.Fatalf("submit 4 err = %v, want ErrQueueFull", err)
	}
	close(fr.release)
}

func TestQueueGC(t *testing.T) {
	fr := &fakeRunner{} // returns immediately
	q := NewQueue(testCfg(), fr, testLog())
	defer q.Shutdown(context.Background())

	id, _ := q.Submit("d", "x")
	deadline := time.Now().Add(2 * time.Second)
	for {
		st, _ := q.Status(id)
		if st.Phase == PhaseDone || time.Now().After(deadline) {
			break
		}
		time.Sleep(5 * time.Millisecond)
	}
	q.gcOnce(time.Now().Add(10 * time.Minute)) // far past JobTTL
	if _, ok := q.Status(id); ok {
		t.Fatal("job still present after GC")
	}
}
