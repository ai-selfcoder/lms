package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"log/slog"
	"sync"
	"time"
)

// ErrQueueFull is returned by Submit when the waiting queue is at capacity.
var ErrQueueFull = errors.New("queue full")

// JobPhase is the lifecycle state of a queued grade.
type JobPhase string

const (
	PhaseQueued  JobPhase = "queued"
	PhaseRunning JobPhase = "running"
	PhaseDone    JobPhase = "done"
	PhaseError   JobPhase = "error"
)

// JobStatus is the snapshot returned to clients while polling. Position and
// QueueLength are only meaningful while queued; Position is 0 otherwise.
type JobStatus struct {
	Phase       JobPhase   `json:"status"`
	Position    int        `json:"position"`
	QueueLength int        `json:"queueLength"` // jobs still waiting (not yet picked up by a worker)
	Result      *RunResult `json:"result,omitempty"`
	Error       string     `json:"error,omitempty"`
}

// job is the internal queue entry.
type job struct {
	id      string
	taskDir string
	code    string
	ticket  uint64 // 1-based enqueue order; assigned on successful enqueue

	phase      JobPhase
	result     RunResult
	errMsg     string
	finishedAt time.Time
}

// Queue is an in-memory FIFO grading queue with a bounded worker pool. The pool
// size caps concurrency to the sandbox. All methods are safe for concurrent use.
type Queue struct {
	runner   Runner
	log      *slog.Logger
	timeout  time.Duration
	maxQueue int
	jobTTL   time.Duration

	pending chan *job

	mu       sync.Mutex
	jobs     map[string]*job
	enqueued uint64 // total ever enqueued
	started  uint64 // total ever picked up by a worker (FIFO ⇒ tickets 1..started)

	quit chan struct{}
	wg   sync.WaitGroup
}

// NewQueue starts the worker pool and a background GC, then returns the queue.
func NewQueue(cfg Config, runner Runner, log *slog.Logger) *Queue {
	q := &Queue{
		runner:   runner,
		log:      log,
		timeout:  cfg.RequestTimeout,
		maxQueue: cfg.MaxQueue,
		jobTTL:   cfg.JobTTL,
		pending:  make(chan *job, cfg.MaxQueue),
		jobs:     make(map[string]*job),
		quit:     make(chan struct{}),
	}
	for i := 0; i < cfg.Concurrency; i++ {
		q.wg.Add(1)
		go q.worker()
	}
	q.wg.Add(1)
	go q.gcLoop()
	return q
}

func newJobID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}

// Submit enqueues a grade and returns its job id, or ErrQueueFull. taskDir must
// already be validated/resolved by the caller.
func (q *Queue) Submit(taskDir, userCode string) (string, error) {
	q.mu.Lock()
	defer q.mu.Unlock()

	// started never exceeds enqueued (a job is only counted in started after it
	// was enqueued), so this uint64 subtraction cannot underflow.
	if int(q.enqueued-q.started) >= q.maxQueue {
		return "", ErrQueueFull
	}
	j := &job{
		id:      newJobID(),
		taskDir: taskDir,
		code:    userCode,
		phase:   PhaseQueued,
	}
	// Non-blocking send under the lock: the count guard guarantees room, and the
	// default arm keeps Submit from ever blocking if a race fills the buffer.
	select {
	case q.pending <- j:
		q.enqueued++
		j.ticket = q.enqueued
		q.jobs[j.id] = j
		return j.id, nil
	default:
		return "", ErrQueueFull
	}
}

// Status returns a snapshot for jobID; ok is false when the id is unknown.
func (q *Queue) Status(jobID string) (JobStatus, bool) {
	q.mu.Lock()
	defer q.mu.Unlock()

	j, ok := q.jobs[jobID]
	if !ok {
		return JobStatus{}, false
	}
	st := JobStatus{Phase: j.phase, QueueLength: int(q.enqueued - q.started)}
	switch j.phase {
	case PhaseQueued:
		st.Position = int(j.ticket - q.started)
	case PhaseDone:
		r := j.result
		st.Result = &r
	case PhaseError:
		st.Error = j.errMsg
	}
	return st, true
}

func (q *Queue) worker() {
	defer q.wg.Done()
	for {
		select {
		case <-q.quit:
			return
		case j := <-q.pending:
			q.mu.Lock()
			q.started++
			j.phase = PhaseRunning
			q.mu.Unlock()

			ctx, cancel := context.WithTimeout(context.Background(), q.timeout)
			res, err := q.runner.Run(ctx, j.taskDir, j.code)
			cancel()

			q.mu.Lock()
			if err != nil {
				j.phase = PhaseError
				j.errMsg = err.Error()
			} else {
				j.phase = PhaseDone
				j.result = res
			}
			j.finishedAt = time.Now()
			q.mu.Unlock()

			if err != nil {
				q.log.Error("grade failed", "job", j.id, "err", err)
			} else {
				q.log.Info("graded", "job", j.id, "pass", res.Pass,
					"compileError", res.CompileError, "timedOut", res.TimedOut,
					"durationMs", res.DurationMs)
			}
		}
	}
}

// gcOnce drops finished jobs whose result has outlived jobTTL.
func (q *Queue) gcOnce(now time.Time) {
	q.mu.Lock()
	defer q.mu.Unlock()
	for id, j := range q.jobs {
		if !j.finishedAt.IsZero() && now.Sub(j.finishedAt) > q.jobTTL {
			delete(q.jobs, id)
		}
	}
}

func (q *Queue) gcLoop() {
	defer q.wg.Done()
	t := time.NewTicker(30 * time.Second)
	defer t.Stop()
	for {
		select {
		case <-q.quit:
			return
		case now := <-t.C:
			q.gcOnce(now)
		}
	}
}

// Shutdown stops accepting work and waits for in-flight workers (bounded by
// ctx), then fails any jobs still queued so clients get a clean error instead
// of polling until their own timeout.
func (q *Queue) Shutdown(ctx context.Context) error {
	close(q.quit)
	done := make(chan struct{})
	go func() { q.wg.Wait(); close(done) }()
	var err error
	select {
	case <-done:
	case <-ctx.Done():
		err = ctx.Err()
	}
	q.mu.Lock()
	for _, j := range q.jobs {
		if j.phase == PhaseQueued {
			j.phase = PhaseError
			j.errMsg = "сервис перезапускается, повтори через минуту"
			j.finishedAt = time.Now()
		}
	}
	q.mu.Unlock()
	return err
}
