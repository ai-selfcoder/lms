package solution

// Task — задача с приоритетом. Priority в диапазоне 1..3, где 3 — наивысший.
type Task struct {
	Priority int
	Run      func()
}
