package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"sync"
)

// Task is one interview problem loaded from tasks/<id>/.
type Task struct {
	ID          string `json:"id"`
	Num         int    `json:"num"`
	Topic       string `json:"topic"`
	Title       string `json:"title"`
	Type        string `json:"type"` // "functional" | "review"
	Description string `json:"description"`
	Starter     string `json:"starter"`
	dir         string
}

type server struct {
	tasksDir    string
	progressDir string
	mu          sync.Mutex
	tasks       []Task
	byID        map[string]Task
}

type meta struct {
	ID    string `json:"id"`
	Num   int    `json:"num"`
	Topic string `json:"topic"`
	Title string `json:"title"`
	Type  string `json:"type"`
}

func newServer(root string) (*server, error) {
	s := &server{
		tasksDir:    filepath.Join(root, "tasks"),
		progressDir: filepath.Join(root, "progress"),
		byID:        map[string]Task{},
	}
	if err := s.loadTasks(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *server) loadTasks() error {
	entries, err := os.ReadDir(s.tasksDir)
	if err != nil {
		return err
	}
	var tasks []Task
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		dir := filepath.Join(s.tasksDir, e.Name())
		metaBytes, err := os.ReadFile(filepath.Join(dir, "meta.json"))
		if err != nil {
			continue // skip incomplete task dirs
		}
		var m meta
		if err := json.Unmarshal(metaBytes, &m); err != nil {
			return fmt.Errorf("%s/meta.json: %w", e.Name(), err)
		}
		desc, _ := os.ReadFile(filepath.Join(dir, "description.md"))
		starter, _ := os.ReadFile(filepath.Join(dir, "starter.go"))
		t := Task{
			ID: m.ID, Num: m.Num, Topic: m.Topic, Title: m.Title, Type: m.Type,
			Description: string(desc), Starter: string(starter), dir: dir,
		}
		tasks = append(tasks, t)
		s.byID[t.ID] = t
	}
	sort.Slice(tasks, func(i, j int) bool { return tasks[i].Num < tasks[j].Num })
	s.tasks = tasks
	return nil
}

// ---- progress persistence ----

func (s *server) savedCodePath(id string) string {
	return filepath.Join(s.progressDir, id+".txt")
}

func (s *server) loadSolved() map[string]bool {
	m := map[string]bool{}
	data, err := os.ReadFile(filepath.Join(s.progressDir, "solved.json"))
	if err == nil {
		_ = json.Unmarshal(data, &m)
	}
	return m
}

func (s *server) setSolved(id string, ok bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	m := s.loadSolved()
	m[id] = ok
	data, _ := json.MarshalIndent(m, "", "  ")
	_ = os.WriteFile(filepath.Join(s.progressDir, "solved.json"), data, 0o644)
}

func (s *server) saveCode(id, code string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	_ = os.WriteFile(s.savedCodePath(id), []byte(code), 0o644)
}

func (s *server) loadCode(id string) (string, bool) {
	data, err := os.ReadFile(s.savedCodePath(id))
	if err != nil {
		return "", false
	}
	return string(data), true
}

// ---- HTTP handlers ----

type taskDTO struct {
	Task
	Saved  string `json:"saved"`
	Solved bool   `json:"solved"`
}

func (s *server) handleTasks(w http.ResponseWriter, r *http.Request) {
	solved := s.loadSolved()
	out := make([]taskDTO, 0, len(s.tasks))
	for _, t := range s.tasks {
		code := t.Starter
		if saved, ok := s.loadCode(t.ID); ok {
			code = saved
		}
		out = append(out, taskDTO{Task: t, Saved: code, Solved: solved[t.ID]})
	}
	writeJSON(w, out)
}

type runReq struct {
	ID   string `json:"id"`
	Code string `json:"code"`
}

func (s *server) handleRun(w http.ResponseWriter, r *http.Request) {
	var req runReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	t, ok := s.byID[req.ID]
	if !ok {
		http.Error(w, "unknown task", http.StatusNotFound)
		return
	}
	s.saveCode(req.ID, req.Code)
	res, err := runTask(t.dir, req.Code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if res.Pass {
		s.setSolved(req.ID, true)
	}
	writeJSON(w, res)
}

func (s *server) handleSave(w http.ResponseWriter, r *http.Request) {
	var req runReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	s.saveCode(req.ID, req.Code)
	writeJSON(w, map[string]bool{"ok": true})
}

func (s *server) handleReset(w http.ResponseWriter, r *http.Request) {
	var req runReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	_ = os.Remove(s.savedCodePath(req.ID))
	t := s.byID[req.ID]
	writeJSON(w, map[string]string{"starter": t.Starter})
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(v)
}

func main() {
	root, _ := os.Getwd()

	if len(os.Args) > 1 && os.Args[1] == "validate" {
		runValidate(root)
		return
	}

	s, err := newServer(root)
	if err != nil {
		fmt.Fprintln(os.Stderr, "load error:", err)
		os.Exit(1)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/tasks", s.handleTasks)
	mux.HandleFunc("/api/run", s.handleRun)
	mux.HandleFunc("/api/save", s.handleSave)
	mux.HandleFunc("/api/reset", s.handleReset)
	mux.Handle("/", http.FileServer(http.Dir(filepath.Join(root, "web"))))

	addr := "localhost:8080"
	if v := os.Getenv("PORT"); v != "" {
		addr = "localhost:" + v
	}
	fmt.Printf("\n  🟢 Go-тренажёр запущен:  http://%s\n", addr)
	fmt.Printf("  Загружено задач: %d\n\n", len(s.tasks))
	if err := http.ListenAndServe(addr, mux); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
