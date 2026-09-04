package solution

// Job — задача для планировщика: имя и длительность счёта (burst) в единицах
// времени. Считаем, что все задачи готовы с момента 0.
type Job struct {
	Name  string
	Burst int
}
