package solution

import (
	"context"
	"time"
)

// RunService запускает фоновые задачи; каждая слушает ctx.Done(). Когда внешний
// код отменяет ctx, всем задачам даётся grace на завершение. Возвращает, когда
// все завершились, либо по истечении grace.
func RunService(ctx context.Context, grace time.Duration, tasks ...func(ctx context.Context)) error {
	// Ваша реализация
	return nil
}
