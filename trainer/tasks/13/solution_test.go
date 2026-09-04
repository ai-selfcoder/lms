package solution

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestDoRequestFast(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("hello"))
	}))
	defer srv.Close()

	body, err := DoRequest(context.Background(), srv.URL)
	if err != nil {
		t.Fatalf("DoRequest: быстрый сервер не должен давать ошибку, получено: %v", err)
	}
	if string(body) != "hello" {
		t.Fatalf("DoRequest: ожидалось тело %q, получено %q", "hello", string(body))
	}
}

func TestDoRequestHardTimeout(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-time.After(1 * time.Second):
			_, _ = w.Write([]byte("too late"))
		case <-r.Context().Done():
		}
	}))
	defer srv.Close()

	done := make(chan error, 1)
	start := time.Now()
	go func() {
		_, err := DoRequest(context.Background(), srv.URL)
		done <- err
	}()

	select {
	case err := <-done:
		if err == nil {
			t.Fatalf("DoRequest: на медленном сервере ожидалась ошибка дедлайна, получено nil")
		}
		if elapsed := time.Since(start); elapsed > 800*time.Millisecond {
			t.Fatalf("DoRequest: жёсткий таймаут 200ms не сработал, заняло %v", elapsed)
		}
	case <-time.After(5 * time.Second):
		t.Fatalf("DoRequest: зависла на медленном сервере — жёсткий таймаут не применён")
	}
}
