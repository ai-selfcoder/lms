package solution

// ProcessOrdered обрабатывает вход in параллельно в workers горутинах, но
// пишет результаты в out СТРОГО в порядке поступления (0,1,2,...), независимо
// от того, какой воркер закончил раньше. Канал out закрывается по завершении.
func ProcessOrdered(in <-chan int, workers int, work func(int) int) <-chan int {
	// Ваша реализация
	out := make(chan int)
	close(out)
	return out
}
