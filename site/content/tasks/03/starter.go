package solution

// NewGenerator бесконечно пишет случайные числа в канал. Если из канала никто
// не читает дольше 500ms, генератор завершает горутину и закрывает канал.
func NewGenerator() <-chan int {
	// Ваша реализация
	ch := make(chan int)
	close(ch)
	return ch
}
