package solution

import "context"

// DoRequest выполняет GET url с context, ограниченным жёстким таймаутом 200ms.
// При таймауте корректно освобождает ресурсы (закрывает тело). Возвращает тело
// ответа или ошибку (включая context deadline).
func DoRequest(ctx context.Context, url string) ([]byte, error) {
	// Ваша реализация
	return nil, nil
}
