package solution

import (
	"math/rand"
	"time"
)

// NewGenerator бесконечно пишет случайные числа в канал. Если из канала никто
// не читает дольше 500ms, генератор завершает горутину и закрывает канал.
func NewGenerator() <-chan int {
	ch := make(chan int)
	go func() {
		defer close(ch)
		timer := time.NewTimer(500 * time.Millisecond)
		defer timer.Stop()
		for {
			select {
			case ch <- rand.Int():
				// Успешная отправка — сбрасываем таймер бездействия.
				if !timer.Stop() {
					select {
					case <-timer.C:
					default:
					}
				}
				timer.Reset(500 * time.Millisecond)
			case <-timer.C:
				// Слишком долго никто не читал — завершаемся.
				return
			}
		}
	}()
	return ch
}
