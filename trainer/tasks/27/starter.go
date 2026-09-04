package solution

// RunRateLimited: стадия 1 даёт userIDs; стадия 2 опрашивает API в `workers`
// воркерах, но суммарный темп вызовов callAPI не превышает rps запросов/сек.
func RunRateLimited(userIDs []int, workers, rps int, callAPI func(id int) string) []string {
	// Ваша реализация
	return nil
}
