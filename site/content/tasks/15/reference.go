package solution

import (
	"context"
	"errors"
)

type replicaResult struct {
	value string
	err   error
}

// QueryReplicas шлёт запрос параллельно во все реплики; как только ПЕРВАЯ
// вернула успех — отменяет остальные через ctx и возвращает её результат.
func QueryReplicas(ctx context.Context, replicas []func(ctx context.Context) (string, error)) (string, error) {
	if len(replicas) == 0 {
		return "", errors.New("нет реплик для запроса")
	}

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	results := make(chan replicaResult, len(replicas))
	for _, replica := range replicas {
		go func(r func(ctx context.Context) (string, error)) {
			value, err := r(ctx)
			results <- replicaResult{value: value, err: err}
		}(replica)
	}

	var lastErr error
	for i := 0; i < len(replicas); i++ {
		res := <-results
		if res.err == nil {
			cancel() // отменяем остальные реплики
			return res.value, nil
		}
		lastErr = res.err
	}
	return "", lastErr
}
