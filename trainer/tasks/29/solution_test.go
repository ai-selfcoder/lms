package solution

import (
	"sync/atomic"
	"testing"
)

func TestRouterRoutesByTag(t *testing.T) {
	r := NewRouter()

	var metrics, logs, billing int64
	r.Subscribe("metrics", func(m Message) { atomic.AddInt64(&metrics, 1) })
	r.Subscribe("logs", func(m Message) { atomic.AddInt64(&logs, 1) })
	r.Subscribe("billing", func(m Message) { atomic.AddInt64(&billing, 1) })

	r.Start()

	const (
		nMetrics = 7
		nLogs    = 4
		nBilling = 5
		nUnknown = 3
	)
	for i := 0; i < nMetrics; i++ {
		r.Publish(Message{Tag: "metrics", Payload: i})
	}
	for i := 0; i < nLogs; i++ {
		r.Publish(Message{Tag: "logs", Payload: i})
	}
	for i := 0; i < nBilling; i++ {
		r.Publish(Message{Tag: "billing", Payload: i})
	}
	// Неизвестный тег — должен быть тихо отброшен без паники.
	for i := 0; i < nUnknown; i++ {
		r.Publish(Message{Tag: "unknown", Payload: i})
	}

	r.Stop()

	if got := atomic.LoadInt64(&metrics); got != nMetrics {
		t.Fatalf("Router: тег metrics получил %d сообщений, ожидалось %d", got, nMetrics)
	}
	if got := atomic.LoadInt64(&logs); got != nLogs {
		t.Fatalf("Router: тег logs получил %d сообщений, ожидалось %d", got, nLogs)
	}
	if got := atomic.LoadInt64(&billing); got != nBilling {
		t.Fatalf("Router: тег billing получил %d сообщений, ожидалось %d", got, nBilling)
	}
}

func TestRouterMultipleSubscribersPerTag(t *testing.T) {
	r := NewRouter()

	var a, b int64
	r.Subscribe("metrics", func(m Message) { atomic.AddInt64(&a, 1) })
	r.Subscribe("metrics", func(m Message) { atomic.AddInt64(&b, 1) })

	r.Start()

	const n = 6
	for i := 0; i < n; i++ {
		r.Publish(Message{Tag: "metrics", Payload: i})
	}

	r.Stop()

	if atomic.LoadInt64(&a) != n || atomic.LoadInt64(&b) != n {
		t.Fatalf("Router: оба подписчика тега metrics должны получить по %d сообщений, получено a=%d b=%d", n, a, b)
	}
}
