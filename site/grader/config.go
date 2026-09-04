package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// Config holds all runtime configuration, sourced from env vars.
type Config struct {
	Runner           string        // "local" | "judge0" | "piston"
	Port             string        // HTTP listen port
	ContentDir       string        // absolute path to content/tasks
	MaxCodeBytes     int           // reject submissions larger than this
	RequestTimeout   time.Duration // per-request deadline
	RateLimitPerMin  int           // submissions per IP per minute
	AllowedOrigins   []string      // CORS allowlist ("*" allowed)
	Judge0URL        string
	Judge0LanguageID int
	Judge0AuthToken  string
	PistonURL        string
	PistonLanguage   string
	PistonVersion    string
	// Queue tuning.
	Concurrency int           // worker pool size = max parallel grades to the sandbox
	MaxQueue    int           // max waiting jobs before 429
	JobTTL      time.Duration // how long a finished job's result is retained for polling
}

// LoadConfig reads configuration from the environment, applying defaults.
func LoadConfig() (Config, error) {
	c := Config{
		Runner:           strings.ToLower(getenv("RUNNER", "local")),
		Port:             getenv("PORT", "8080"),
		ContentDir:       getenv("CONTENT_DIR", "../content/tasks"),
		MaxCodeBytes:     getenvInt("MAX_CODE_BYTES", 64*1024),
		RequestTimeout:   time.Duration(getenvInt("REQUEST_TIMEOUT_SECONDS", 60)) * time.Second,
		RateLimitPerMin:  getenvInt("RATE_LIMIT_PER_MIN", 30),
		AllowedOrigins:   splitCSV(getenv("ALLOWED_ORIGINS", "*")),
		Judge0URL:        getenv("JUDGE0_URL", ""),
		Judge0LanguageID: getenvInt("JUDGE0_LANGUAGE_ID", 0),
		Judge0AuthToken:  getenv("JUDGE0_AUTH_TOKEN", ""),
		PistonURL:        getenv("PISTON_URL", ""),
		PistonLanguage:   getenv("PISTON_LANGUAGE", "gotest"),
		PistonVersion:    getenv("PISTON_VERSION", "1.26.4"),
		Concurrency:      getenvInt("CONCURRENCY", 16),
		MaxQueue:         getenvInt("MAX_QUEUE", 200),
		JobTTL:           time.Duration(getenvInt("JOB_TTL_SECONDS", 120)) * time.Second,
	}

	if c.Concurrency < 1 {
		c.Concurrency = 1
	}
	if c.MaxQueue < 1 {
		c.MaxQueue = 1
	}

	abs, err := filepath.Abs(c.ContentDir)
	if err != nil {
		return Config{}, fmt.Errorf("resolve CONTENT_DIR: %w", err)
	}
	c.ContentDir = abs

	switch c.Runner {
	case "local":
	case "judge0":
		if c.Judge0URL == "" {
			return Config{}, fmt.Errorf("RUNNER=judge0 requires JUDGE0_URL")
		}
	case "piston":
		if c.PistonURL == "" {
			return Config{}, fmt.Errorf("RUNNER=piston requires PISTON_URL")
		}
	default:
		return Config{}, fmt.Errorf("invalid RUNNER %q (want local|judge0|piston)", c.Runner)
	}

	if info, err := os.Stat(c.ContentDir); err != nil || !info.IsDir() {
		return Config{}, fmt.Errorf("CONTENT_DIR %q is not a directory", c.ContentDir)
	}
	return c, nil
}

func getenv(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}

func getenvInt(key string, def int) int {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
