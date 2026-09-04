package main

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// taskIDPattern guards against path traversal in taskId. Tasks are NN dirs.
var taskIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{1,16}$`)

// coursePattern guards the optional course segment (slug). Empty → Go default.
var coursePattern = regexp.MustCompile(`^[a-z0-9-]{1,16}$`)

// Server wires the HTTP handlers to a Queue and enforces guards.
type Server struct {
	cfg     Config
	queue   *Queue
	limiter *rateLimiter
	log     *slog.Logger
}

func NewServer(cfg Config, queue *Queue, log *slog.Logger) *Server {
	return &Server{
		cfg:     cfg,
		queue:   queue,
		limiter: newRateLimiter(cfg.RateLimitPerMin, time.Minute),
		log:     log,
	}
}

// Handler returns the fully-wired http.Handler (routes + CORS).
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", s.handleHealth)
	mux.HandleFunc("POST /api/run", s.handleRun)
	mux.HandleFunc("GET /api/run", s.handleStatus)
	return s.withCORS(mux)
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "runner": s.cfg.Runner})
}

func (s *Server) handleRun(w http.ResponseWriter, r *http.Request) {
	ip := clientIP(r)
	if !s.limiter.allow(ip) {
		writeError(w, http.StatusTooManyRequests, "rate limit exceeded, slow down")
		return
	}

	// Cap the body to MaxCodeBytes plus a small JSON envelope allowance.
	r.Body = http.MaxBytesReader(w, r.Body, int64(s.cfg.MaxCodeBytes)+4096)
	var req RunRequest
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(&req); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			writeError(w, http.StatusRequestEntityTooLarge, "code too large")
			return
		}
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if !taskIDPattern.MatchString(req.TaskID) {
		writeError(w, http.StatusBadRequest, "invalid taskId")
		return
	}
	if req.Course != "" && !coursePattern.MatchString(req.Course) {
		writeError(w, http.StatusBadRequest, "invalid course")
		return
	}
	if len(req.Code) == 0 {
		writeError(w, http.StatusBadRequest, "empty code")
		return
	}
	if len(req.Code) > s.cfg.MaxCodeBytes {
		writeError(w, http.StatusRequestEntityTooLarge, "code too large")
		return
	}

	// Resolve the task directory for the (course, taskId) pair.
	//
	// Legacy Go course: tasks live directly under ContentDir (e.g.
	// content/tasks/NN). Other courses live alongside it under the content root:
	// <root>/<course>/tasks/NN, where root is ContentDir's parent. Both must
	// stay inside the content root (traversal defense).
	contentRoot := filepath.Dir(s.cfg.ContentDir)
	var taskDir string
	if req.Course == "" || req.Course == "go" {
		taskDir = filepath.Join(s.cfg.ContentDir, req.TaskID)
	} else {
		taskDir = filepath.Join(contentRoot, req.Course, "tasks", req.TaskID)
	}
	if !strings.HasPrefix(taskDir+string(os.PathSeparator), contentRoot+string(os.PathSeparator)) {
		writeError(w, http.StatusBadRequest, "invalid taskId")
		return
	}
	if info, err := os.Stat(filepath.Join(taskDir, "solution_test.go")); err != nil || info.IsDir() {
		writeError(w, http.StatusNotFound, "unknown taskId")
		return
	}

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
}

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

// withCORS adds CORS headers and answers preflight requests.
func (s *Server) withCORS(next http.Handler) http.Handler {
	allowAll := len(s.cfg.AllowedOrigins) == 1 && s.cfg.AllowedOrigins[0] == "*"
	allowed := make(map[string]bool, len(s.cfg.AllowedOrigins))
	for _, o := range s.cfg.AllowedOrigins {
		allowed[o] = true
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		switch {
		case allowAll:
			w.Header().Set("Access-Control-Allow-Origin", "*")
		case origin != "" && allowed[origin]:
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
		}
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func clientIP(r *http.Request) string {
	// Honor a single proxy hop; in prod terminate TLS at a trusted proxy.
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if i := strings.IndexByte(xff, ','); i >= 0 {
			return strings.TrimSpace(xff[:i])
		}
		return strings.TrimSpace(xff)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
