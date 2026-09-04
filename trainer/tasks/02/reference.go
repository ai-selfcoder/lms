package solution

// produce запускает горутину, которая шлёт значения 1..n в возвращаемый канал.
// При закрытии done горутина завершается, а не виснет на отправке.
func produce(n int, done <-chan struct{}) <-chan int {
	ch := make(chan int)
	go func() {
		defer close(ch)
		for i := 1; i <= n; i++ {
			select {
			case ch <- i:
			case <-done:
				return
			}
		}
	}()
	return ch
}
