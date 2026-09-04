package solution

import "context"

// QueryReplicas шлёт запрос параллельно во все реплики; как только ПЕРВАЯ
// вернула успех — отменяет остальные через ctx и возвращает её результат.
func QueryReplicas(ctx context.Context, replicas []func(ctx context.Context) (string, error)) (string, error) {
	// Ваша реализация
	return "", nil
}
