package solution

// Initializer обеспечивает однократную потокобезопасную инициализацию.
type Initializer struct {
	// Ваши поля
}

// NewInitializer принимает функцию тяжёлой инициализации.
func NewInitializer(init func() error) *Initializer {
	// Ваша реализация
	return &Initializer{}
}

// Do запускает инициализацию ровно один раз и возвращает её результат всем
// вызывающим.
func (i *Initializer) Do() error {
	// Ваша реализация
	return nil
}
