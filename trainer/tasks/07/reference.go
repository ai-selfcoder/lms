package solution

import "sync"

// Initializer обеспечивает однократную потокобезопасную инициализацию.
type Initializer struct {
	once sync.Once
	init func() error
	err  error
}

// NewInitializer принимает функцию тяжёлой инициализации.
func NewInitializer(init func() error) *Initializer {
	return &Initializer{init: init}
}

// Do запускает инициализацию ровно один раз и возвращает её результат всем
// вызывающим.
func (i *Initializer) Do() error {
	i.once.Do(func() {
		i.err = i.init()
	})
	return i.err
}
