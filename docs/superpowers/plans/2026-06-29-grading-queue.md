# Grading Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make grading asynchronous — submissions enter an in-memory FIFO queue in the Go grader; the browser polls for its position ("ты 3-й из 12") and the final verdict.

**Architecture:** The grader gains a bounded worker pool (workers = concurrency cap to Piston) fronted by a job registry. `POST /api/run` enqueues and returns a `jobId`; `GET /api/run?id=` returns `{status, position, queueLength, result?}`. The Next.js BFF proxies both; the task UI polls every ~1 s and shows queue position until the verdict lands.

**Tech Stack:** Go 1.25 (grader, stdlib only), Next.js/React/TypeScript (web), Docker Compose.

**Prerequisite:** Grader tests need Go 1.25+ available locally (`go version`). If absent, run `cd site/grader && go test ./...` inside the grader build image. Web verification uses `npx tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-06-29-grading-queue-design.md`

---

## File Structure

Grader (`site/grader/`, package `main`):
- **Create** `queue.go` — `Queue`: Submit/Status, worker pool, position math, GC. One responsibility: queue lifecycle. Depends on `Runner`.
- **Create** `queue_test.go` — unit tests with a fake Runner.
- **Modify** `config.go` — add `Concurrency`, `MaxQueue`, `JobTTL`.
- **Modify** `server.go` — async handlers over `Queue` (POST enqueue, GET status).
- **Modify** `main.go` — build `Queue`, wire into `Server`, shut down.

Web (`site/web/`):
- **Modify** `app/api/run/route.ts` — `POST` (enqueue) + `GET` (status) proxies.
- **Create** `components/task/useGradeJob.ts` — submit+poll hook.
- **Create** `components/task/QueueStatus.tsx` — presentational position chip.
- **Modify** `components/task/TaskWorkspace.tsx` — use the hook.
- **Modify** `components/task/EditorPanel.tsx` — render `QueueStatus`.

Deploy:
- **Modify** `site/deploy/docker-compose.yml` — new grader env vars.

---

## Task 1: Grader config — queue knobs

**Files:**
- Modify: `site/grader/config.go`
- Test: `site/grader/config_test.go` (create)

- [ ] **Step 1: Write the failing test**

Create `site/grader/config_test.go`:

```go
package main

import (
	"testing"
	"time"
)

func TestLoadConfigQueueDefaults(t *testing.T) {
	t.Setenv("CONTENT_DIR", ".") // LoadConfig requires an existing dir
	cfg, err := LoadConfig()
	if err != nil {
		t.Fatalf("LoadConfig: %v", err)
	}
	if cfg.Concurrency != 16 {
		t.Errorf("Concurrency = %d, want 16", cfg.Concurrency)
	}
	if cfg.MaxQueue != 200 {
		t.Errorf("MaxQueue = %d, want 200", cfg.MaxQueue)
	}
	if cfg.JobTTL != 120*time.Second {
		t.Errorf("JobTTL = %v, want 120s", cfg.JobTTL)
	}
}

func TestLoadConfigConcurrencyFloor(t *testing.T) {
	t.Setenv("CONTENT_DIR", ".")
	t.Setenv("CONCURRENCY", "0")
	cfg, err := LoadConfig()
	if err != nil {
		t.Fatalf("LoadConfig: %v", err)
	}
	if cfg.Concurrency < 1 {
		t.Errorf("Concurrency = %d, want >= 1", cfg.Concurrency)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site/grader && go test -run TestLoadConfig -v`
Expected: FAIL — `cfg.Concurrency undefined` (compile error).

- [ ] **Step 3: Add the fields and defaults**

In `site/grader/config.go`, add three fields to the `Config` struct (after `PistonVersion`):

```go
	// Queue tuning.
	Concurrency int           // worker pool size = max parallel grades to the sandbox
	MaxQueue    int           // max waiting jobs before 429
	JobTTL      time.Duration // how long a finished job's result is retained for polling
```

In `LoadConfig`, inside the `c := Config{...}` literal, add (after `PistonVersion: ...`):

```go
		Concurrency: getenvInt("CONCURRENCY", 16),
		MaxQueue:    getenvInt("MAX_QUEUE", 200),
		JobTTL:      time.Duration(getenvInt("JOB_TTL_SECONDS", 120)) * time.Second,
```

After the `c := Config{...}` literal (before the `abs, err := ...` line), clamp the floor:

```go
	if c.Concurrency < 1 {
		c.Concurrency = 1
	}
	if c.MaxQueue < 1 {
		c.MaxQueue = 1
	}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site/grader && go test -run TestLoadConfig -v`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add site/grader/config.go site/grader/config_test.go
git commit -m "feat(grader): add queue config (CONCURRENCY, MAX_QUEUE, JOB_TTL_SECONDS)"
```

---

## Task 2: Queue core (`queue.go`)

**Files:**
- Create: `site/grader/queue.go`
- Test: `site/grader/queue_test.go`

- [ ] **Step 1: Write the failing tests**

Create `site/grader/queue_test.go`:

```go
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd site/grader && go test -run TestQueue -v`
Expected: FAIL — `undefined: NewQueue`, `PhaseQueued`, etc. (compile error).

- [ ] **Step 3: Implement `queue.go`**

Create `site/grader/queue.go`:

```go
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
	QueueLength int        `json:"queueLength"`
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

// Shutdown stops accepting work and waits for in-flight workers, bounded by ctx.
func (q *Queue) Shutdown(ctx context.Context) error {
	close(q.quit)
	done := make(chan struct{})
	go func() { q.wg.Wait(); close(done) }()
	select {
	case <-done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd site/grader && go test -run TestQueue -race -v`
Expected: PASS (all four tests), no race warnings.

- [ ] **Step 5: Commit**

```bash
git add site/grader/queue.go site/grader/queue_test.go
git commit -m "feat(grader): in-memory FIFO grading queue with bounded worker pool"
```

---

## Task 3: Grader HTTP — async submit + status

**Files:**
- Modify: `site/grader/server.go`
- Modify: `site/grader/main.go`

- [ ] **Step 1: Repoint `Server` at the queue**

In `site/grader/server.go`, change the `Server` struct field `runner Runner` to `queue *Queue`:

```go
type Server struct {
	cfg     Config
	queue   *Queue
	limiter *rateLimiter
	log     *slog.Logger
}
```

Change `NewServer` to accept a `*Queue`:

```go
func NewServer(cfg Config, queue *Queue, log *slog.Logger) *Server {
	return &Server{
		cfg:     cfg,
		queue:   queue,
		limiter: newRateLimiter(cfg.RateLimitPerMin, time.Minute),
		log:     log,
	}
}
```

- [ ] **Step 2: Register the GET route**

In `Handler()`, add the status route:

```go
	mux.HandleFunc("GET /healthz", s.handleHealth)
	mux.HandleFunc("POST /api/run", s.handleRun)
	mux.HandleFunc("GET /api/run", s.handleStatus)
```

- [ ] **Step 3: Replace the body of `handleRun` to enqueue**

Replace everything in `handleRun` from the `ctx, cancel := context.WithTimeout(...)` line through the final `writeJSON(w, http.StatusOK, res)` (i.e. the synchronous run + result logging block) with:

```go
	jobID, err := s.queue.Submit(taskDir, req.Code)
	if err != nil {
		if errors.Is(err, ErrQueueFull) {
			writeError(w, http.StatusTooManyRequests, "очередь переполнена, попробуй через минуту")
			return
		}
		s.log.Error("enqueue failed", "task", req.TaskID, "ip", ip, "err", err)
		writeError(w, http.StatusInternalServerError, "grader error")
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]string{"jobId": jobID})
```

(Keep all the validation above it unchanged: rate limit, body decode, taskId/course regex, code length, taskDir resolution, and the `solution_test.go` existence check.)

- [ ] **Step 4: Add `handleStatus`**

Add this method below `handleRun`:

```go
func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "missing id")
		return
	}
	st, ok := s.queue.Status(id)
	if !ok {
		writeError(w, http.StatusNotFound, "задача не найдена (истекла) — запусти заново")
		return
	}
	writeJSON(w, http.StatusOK, st)
}
```

- [ ] **Step 5: Fix imports in `server.go`**

`handleRun` no longer uses `context` or `time.Now()`. Remove the `"context"` import. Keep `"time"` (used by `newRateLimiter(... time.Minute)`). Add `"errors"` if not present (used by `errors.Is`). Final import block should include: `encoding/json`, `errors`, `log/slog`, `net`, `net/http`, `os`, `path/filepath`, `regexp`, `strings`, `time`.

- [ ] **Step 6: Wire the queue in `main.go`**

In `site/grader/main.go`, after `runner, err := buildRunner(cfg)` (and its error check), create the queue and pass it to the server:

```go
	queue := NewQueue(cfg, runner, log)

	srv := NewServer(cfg, queue, log)
```

In the shutdown block, after `httpSrv.Shutdown(ctx)`, also drain the queue (reuse the same ctx):

```go
	if err := httpSrv.Shutdown(ctx); err != nil {
		log.Error("graceful shutdown", "err", err)
	}
	if err := queue.Shutdown(ctx); err != nil {
		log.Error("queue shutdown", "err", err)
	}
```

- [ ] **Step 7: Build and run the full grader test suite**

Run: `cd site/grader && go vet ./... && go test -race ./...`
Expected: PASS — package compiles, all tests (config, queue, existing judge0/testjson tests) green.

- [ ] **Step 8: Commit**

```bash
git add site/grader/server.go site/grader/main.go
git commit -m "feat(grader): async /api/run (enqueue) + GET status endpoint"
```

---

## Task 4: BFF route — enqueue + status proxy

**Files:**
- Modify: `site/web/app/api/run/route.ts`

- [ ] **Step 1: Replace the route with POST (enqueue) + GET (status)**

Replace the entire contents of `site/web/app/api/run/route.ts` with:

```ts
import { NextResponse } from "next/server";

/**
 * Proxy to the Go grader. The browser never talks to the grader directly.
 * POST /api/run         → enqueue a grade, returns { jobId }.
 * GET  /api/run?id=...  → poll job status { status, position, queueLength, result? }.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRADER_URL = process.env.GRADER_URL ?? "http://localhost:8090";
const MAX_CODE_BYTES = 256 * 1024; // 256 KB guard
const FETCH_TIMEOUT_MS = 10_000;

interface RunRequest {
  taskId?: string;
  course?: string;
  code?: string;
}

function graderBase() {
  return GRADER_URL.replace(/\/$/, "");
}

function errorResponse(message: string, status = 502) {
  return NextResponse.json({ error: true, message }, { status });
}

export async function POST(req: Request) {
  let body: RunRequest;
  try {
    body = (await req.json()) as RunRequest;
  } catch {
    return errorResponse("Некорректный JSON в запросе.", 400);
  }

  const { taskId, course, code } = body;
  if (!taskId || typeof taskId !== "string") {
    return errorResponse("Отсутствует taskId.", 400);
  }
  const courseId = typeof course === "string" && course.length > 0 ? course : "go";
  if (typeof code !== "string" || code.trim().length === 0) {
    return errorResponse("Пустой код решения.", 400);
  }
  if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
    return errorResponse("Код слишком большой.", 413);
  }

  const xff = req.headers.get("x-forwarded-for") ?? "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${graderBase()}/api/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(xff ? { "X-Forwarded-For": xff } : {}),
      },
      body: JSON.stringify({ taskId, course: courseId, code }),
      signal: controller.signal,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      jobId?: string;
      error?: string;
    };
    if (!res.ok) {
      return NextResponse.json(
        { error: true, message: data?.error ?? `Грейдер вернул ошибку ${res.status}.` },
        { status: res.status }
      );
    }
    return NextResponse.json({ jobId: data.jobId });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return errorResponse(
      aborted
        ? "Грейдер не ответил вовремя. Попробуйте ещё раз."
        : `Не удалось связаться с грейдером по адресу ${GRADER_URL}.`,
      aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return errorResponse("Отсутствует id.", 400);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${graderBase()}/api/run?id=${encodeURIComponent(id)}`,
      { cache: "no-store", signal: controller.signal }
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 404) {
      // Treat an expired/unknown job as a soft error the client can render.
      return NextResponse.json({
        status: "error",
        message: "Задача истекла — запусти заново.",
      });
    }
    if (!res.ok) {
      return errorResponse(
        (data?.error as string) ?? `Грейдер вернул ошибку ${res.status}.`,
        502
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return errorResponse(
      aborted ? "Грейдер не ответил вовремя." : "Не удалось связаться с грейдером.",
      aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd site/web && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add site/web/app/api/run/route.ts
git commit -m "feat(web): BFF proxies enqueue (POST) and job status (GET)"
```

---

## Task 5: `useGradeJob` hook

**Files:**
- Create: `site/web/components/task/useGradeJob.ts`

- [ ] **Step 1: Create the hook**

Create `site/web/components/task/useGradeJob.ts`:

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunResult } from "./types";

export type GradePhase = "idle" | "queued" | "running" | "done" | "error";

export interface GradeState {
  phase: GradePhase;
  position: number;
  queueLength: number;
  result: RunResult | null;
}

interface StatusResponse {
  status?: GradePhase;
  position?: number;
  queueLength?: number;
  result?: RunResult;
  message?: string;
}

const POLL_MS = 1000;
const MAX_POLL_MS = 4 * 60 * 1000; // give up after ~4 minutes

const IDLE: GradeState = { phase: "idle", position: 0, queueLength: 0, result: null };

/** Submit a grade and poll its queue position + verdict. */
export function useGradeJob() {
  const [state, setState] = useState<GradeState>(IDLE);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
  const alive = useRef(true);

  const stop = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      alive.current = false;
      stop();
    },
    [stop]
  );

  const finishError = useCallback((message: string) => {
    setState({
      phase: "error",
      position: 0,
      queueLength: 0,
      result: {
        pass: false,
        output: message,
        durationMs: 0,
        timedOut: false,
        compileError: false,
        error: true,
      },
    });
  }, []);

  const poll = useCallback(
    async (jobId: string) => {
      if (!alive.current) return;
      if (Date.now() - startedAt.current > MAX_POLL_MS) {
        finishError("Проверка идёт слишком долго. Попробуй запустить ещё раз.");
        return;
      }
      let data: StatusResponse;
      try {
        const res = await fetch(`/api/run?id=${encodeURIComponent(jobId)}`, {
          cache: "no-store",
        });
        data = (await res.json()) as StatusResponse;
      } catch {
        // Transient network blip — retry on the next tick.
        timer.current = setTimeout(() => poll(jobId), POLL_MS);
        return;
      }
      if (!alive.current) return;

      const phase = data.status ?? "error";
      if (phase === "done" && data.result) {
        setState({ phase: "done", position: 0, queueLength: 0, result: data.result });
        return;
      }
      if (phase === "error") {
        finishError(data.message ?? "Ошибка проверки.");
        return;
      }
      setState({
        phase,
        position: data.position ?? 0,
        queueLength: data.queueLength ?? 0,
        result: null,
      });
      timer.current = setTimeout(() => poll(jobId), POLL_MS);
    },
    [finishError]
  );

  const start = useCallback(
    async (taskId: string, course: string, code: string) => {
      stop();
      startedAt.current = Date.now();
      setState({ phase: "queued", position: 0, queueLength: 0, result: null });
      let data: { jobId?: string; message?: string };
      try {
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, course, code }),
        });
        data = (await res.json()) as { jobId?: string; message?: string };
        if (!res.ok || !data.jobId) {
          finishError(data?.message ?? "Не удалось поставить задачу в очередь.");
          return;
        }
      } catch {
        finishError("Не удалось отправить запрос. Проверь соединение и попробуй снова.");
        return;
      }
      poll(data.jobId);
    },
    [stop, poll, finishError]
  );

  const reset = useCallback(() => {
    stop();
    setState(IDLE);
  }, [stop]);

  return { ...state, start, reset };
}
```

- [ ] **Step 2: Typecheck**

Run: `cd site/web && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add site/web/components/task/useGradeJob.ts
git commit -m "feat(web): useGradeJob hook (submit + poll position/verdict)"
```

---

## Task 6: QueueStatus chip + wire into UI

**Files:**
- Create: `site/web/components/task/QueueStatus.tsx`
- Modify: `site/web/components/task/EditorPanel.tsx`
- Modify: `site/web/components/task/TaskWorkspace.tsx`

- [ ] **Step 1: Create the QueueStatus chip**

Create `site/web/components/task/QueueStatus.tsx`:

```tsx
"use client";

/** Small chip shown while a grade waits in the queue: "В очереди: 3-й из 12". */
export function QueueStatus({
  position,
  queueLength,
}: {
  position: number;
  queueLength: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--label-sm)",
        color: "var(--text-secondary)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--warning)",
        }}
      />
      В очереди: {position}-й из {queueLength}
    </span>
  );
}
```

- [ ] **Step 2: Render the chip in EditorPanel**

In `site/web/components/task/EditorPanel.tsx`:

(a) Add the import after the existing `MentorPanel` import:

```tsx
import { QueueStatus } from "./QueueStatus";
```

(b) Add an optional `queue` prop. In the props type object (the `}: { ... }` block of `EditorPanel`), add after `taskType?: string;`:

```tsx
  queue?: { position: number; queueLength: number } | null;
```

And add `queue,` to the destructured parameter list (after `taskType,`).

(c) In the toolbar, replace the `go test -race` indicator span (the `<span style={{ marginLeft: "auto", ... }}>` block containing the green dot and `go test -race`) with a conditional that shows the queue chip while queued:

```tsx
        {queue ? (
          <span style={{ marginLeft: "auto" }}>
            <QueueStatus position={queue.position} queueLength={queue.queueLength} />
          </span>
        ) : (
          <span
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "var(--label-sm)",
              color: "var(--text-tertiary)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--success)",
              }}
            />
            <span style={{ fontFamily: "var(--font-mono)" }}>go test -race</span>
          </span>
        )}
```

(d) Update the run button label so a queued job reads "В очереди" while a running one reads "Выполняется". Change the button's child text expression `{running ? "Выполняется" : "Запустить тесты"}` to:

```tsx
          {running ? (queue ? "В очереди" : "Выполняется") : "Запустить тесты"}
```

- [ ] **Step 3: Wire the hook into TaskWorkspace**

In `site/web/components/task/TaskWorkspace.tsx`:

(a) Add the import after the `DescPanel` import:

```tsx
import { useGradeJob } from "./useGradeJob";
```

(b) Remove the local `running`/`result` state. Delete these two lines:

```tsx
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
```

Replace them with the hook plus derived values:

```tsx
  const job = useGradeJob();
  const running = job.phase === "queued" || job.phase === "running";
  const result = job.result;
```

(c) In the task-change `useEffect`, replace `setResult(null);` with `job.reset();`:

```tsx
  useEffect(() => {
    const saved = loadCode(task.id);
    setCode(saved ?? task.starter);
    job.reset();
  }, [task.id, task.starter]);
```

(d) In `handleReset`, replace `setResult(null);` with `job.reset();`.

(e) Replace the whole `handleRun` callback body with a call to the hook:

```tsx
  const handleRun = useCallback(() => {
    if (running) return;
    job.start(task.id, course, code);
  }, [running, job, task.id, course, code]);
```

(f) Mark solved when a passing verdict arrives — add this effect after `handleRun`:

```tsx
  useEffect(() => {
    if (job.phase === "done" && job.result?.pass && !job.result.error) {
      markSolved(task.id);
    }
  }, [job.phase, job.result, markSolved, task.id]);
```

(g) Pass the queue prop to `EditorPanel`. In the `<EditorPanel ... />` JSX, add:

```tsx
            queue={job.phase === "queued" ? { position: job.position, queueLength: job.queueLength } : null}
```

(h) Remove the now-unused `RunResult` type import if TypeScript flags it. The import line is `import type { NavTopic, TaskCore, TaskNeighbour, RunResult } from "./types";` — drop `RunResult` from it if unused after the edits (keep the others).

- [ ] **Step 4: Typecheck**

Run: `cd site/web && npx tsc --noEmit`
Expected: no errors. (If `RunResult` is reported unused in TaskWorkspace, apply step 3h.)

- [ ] **Step 5: Commit**

```bash
git add site/web/components/task/QueueStatus.tsx site/web/components/task/EditorPanel.tsx site/web/components/task/TaskWorkspace.tsx
git commit -m "feat(web): show queue position in task workspace"
```

---

## Task 7: Deploy env + manual verification

**Files:**
- Modify: `site/deploy/docker-compose.yml`

- [ ] **Step 1: Add queue env vars to the grader service**

In `site/deploy/docker-compose.yml`, under the `grader:` service `environment:` block, after `REQUEST_TIMEOUT_SECONDS: "60"`, add:

```yaml
      # Grading queue: worker pool = max parallel grades to Piston.
      CONCURRENCY: "16"
      MAX_QUEUE: "200"
      JOB_TTL_SECONDS: "120"
```

- [ ] **Step 2: Commit**

```bash
git add site/deploy/docker-compose.yml
git commit -m "chore(deploy): grading queue env (CONCURRENCY, MAX_QUEUE, JOB_TTL_SECONDS)"
```

- [ ] **Step 3: End-to-end smoke (local, optional but recommended)**

Bring up the stack (or just grader + a reachable Piston) and confirm the async flow:

```bash
# enqueue
curl -s -XPOST localhost:8080/api/run -H 'content-type: application/json' \
  -d '{"taskId":"01","course":"go","code":"package solution\n"}'
# -> {"jobId":"<hex>"}  (HTTP 202)

# poll
curl -s "localhost:8080/api/run?id=<hex>"
# -> {"status":"queued","position":1,"queueLength":1}  then later
# -> {"status":"done","position":0,"queueLength":0,"result":{...}}
```

Expected: POST returns a `jobId`; GET transitions queued/running → done with the verdict inside `result`.

---

## Self-Review

- **Spec coverage:** queue+worker pool (Task 2), position/queueLength math (Task 2), HTTP submit+status (Task 3), config knobs CONCURRENCY/MAX_QUEUE/JOB_TTL (Task 1), 429 on full + 404 on expired (Tasks 3/4), BFF POST+GET (Task 4), polling ~1 s + 4-min safety cap (Task 5), position-only UI without ETA/names (Task 6), compose env (Task 7), tests for position/cap/full/GC (Task 2). v1 has no cancellation — matches spec "вне scope".
- **Placeholders:** none — every code step is complete.
- **Type consistency:** grader `JobStatus` JSON `status`/`position`/`queueLength`/`result` ⇄ TS `StatusResponse`/`GradeState`; `GradePhase` values match Go `JobPhase` constants ("queued"/"running"/"done"/"error"); `NewQueue(cfg, runner, log)` and `NewServer(cfg, queue, log)` signatures consistent across Tasks 2/3; `useGradeJob` returns `{phase,position,queueLength,result,start,reset}` consumed verbatim by Task 6.
