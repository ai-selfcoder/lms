// В песочницу не отправляется.
package solution

import (
	"sync"
	"sync/atomic"
)

// Эталонная реализация: общий счётчик под спинлоком на CAS.
func SpinSumReference(goroutines, perGoroutine int) int {
	var lock int32
	counter := 0
	var wg sync.WaitGroup

	for g := 0; g < goroutines; g++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := 0; i < perGoroutine; i++ {
				// Захват спинлока: крутимся, пока не переведём 0 → 1.
				for !atomic.CompareAndSwapInt32(&lock, 0, 1) {
				}
				counter++
				// Отпускание спинлока.
				atomic.StoreInt32(&lock, 0)
			}
		}()
	}

	wg.Wait()
	return counter
}
