package solution

import "context"

// CtxTask — задача пула, привязанная к собственному контексту.
type CtxTask struct {
	Ctx context.Context
	Run func(ctx context.Context)
}
