package solution

// Group подавляет дублирующиеся вызовы по ключу.
type Group struct {
	// Ваши поля
}

// Do выполняет fn для key. Параллельные вызовы с тем же key
// дожидаются результата единственного выполнения fn.
func (g *Group) Do(key string, fn func() (interface{}, error)) (interface{}, error) {
	// Ваша реализация
	return nil, nil
}
