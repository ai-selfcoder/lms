// Command grader is the HTTP grading service for the courses. It exposes
// POST /api/run (enqueue a submission → {jobId}), GET /api/run?id= (poll job
// status/verdict), and GET /healthz. Submissions run through an in-memory queue
// with a bounded worker pool; the Runner is selected by the RUNNER env var
// (local | judge0 | piston).
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	cfg, err := LoadConfig()
	if err != nil {
		log.Error("config", "err", err)
		os.Exit(1)
	}

	runner, err := buildRunner(cfg)
	if err != nil {
		log.Error("build runner", "err", err)
		os.Exit(1)
	}

	queue := NewQueue(cfg, runner, log)

	srv := NewServer(cfg, queue, log)
	httpSrv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           srv.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		// No WriteTimeout: a race-build grade can legitimately take ~40s.
	}

	go func() {
		log.Info("grader listening",
			"port", cfg.Port, "runner", cfg.Runner, "contentDir", cfg.ContentDir)
		if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("http server", "err", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	log.Info("shutting down")
	shutCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := httpSrv.Shutdown(shutCtx); err != nil {
		log.Error("graceful shutdown", "err", err)
	}
	// Drain in-flight grades on their own deadline (a grade can take ~60s).
	drainCtx, drainCancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer drainCancel()
	if err := queue.Shutdown(drainCtx); err != nil {
		log.Error("queue shutdown", "err", err)
	}
}

// buildRunner constructs the Runner selected by config.
func buildRunner(cfg Config) (Runner, error) {
	switch cfg.Runner {
	case "judge0":
		return NewJudge0Runner(cfg), nil
	case "piston":
		return NewPistonRunner(cfg), nil
	case "local":
		return NewLocalRunner(), nil
	default:
		return nil, errors.New("unknown runner: " + cfg.Runner)
	}
}
