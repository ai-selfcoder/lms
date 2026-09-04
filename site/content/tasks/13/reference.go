package solution

import (
	"context"
	"io"
	"net/http"
	"time"
)

// DoRequest выполняет GET url с context, ограниченным жёстким таймаутом 200ms.
// При таймауте корректно освобождает ресурсы (закрывает тело). Возвращает тело
// ответа или ошибку (включая context deadline).
func DoRequest(ctx context.Context, url string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, 200*time.Millisecond)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	return body, nil
}
