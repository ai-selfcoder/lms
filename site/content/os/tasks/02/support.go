package solution

// Job — задача для планировщика: имя и длительность счёта (burst). Все задачи
// готовы с момента 0.
type Job struct {
	Name  string
	Burst int
}
