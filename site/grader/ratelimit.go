package main

import (
	"sync"
	"time"
)

// rateLimiter is a simple per-key fixed-window counter. It is good enough for
// abuse protection on a single grader instance; for multi-instance deployments
// move this to Redis.
type rateLimiter struct {
	mu      sync.Mutex
	limit   int
	window  time.Duration
	buckets map[string]*bucket
}

type bucket struct {
	count int
	reset time.Time
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	rl := &rateLimiter{
		limit:   limit,
		window:  window,
		buckets: make(map[string]*bucket),
	}
	go rl.gc()
	return rl
}

// allow reports whether the key may proceed and consumes one token if so.
func (rl *rateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	b, ok := rl.buckets[key]
	if !ok || now.After(b.reset) {
		rl.buckets[key] = &bucket{count: 1, reset: now.Add(rl.window)}
		return true
	}
	if b.count >= rl.limit {
		return false
	}
	b.count++
	return true
}

// gc periodically evicts expired buckets to bound memory.
func (rl *rateLimiter) gc() {
	t := time.NewTicker(rl.window)
	defer t.Stop()
	for range t.C {
		now := time.Now()
		rl.mu.Lock()
		for k, b := range rl.buckets {
			if now.After(b.reset) {
				delete(rl.buckets, k)
			}
		}
		rl.mu.Unlock()
	}
}
