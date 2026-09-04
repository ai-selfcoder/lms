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
