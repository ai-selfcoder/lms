package solution

// Job — задача с идентификатором и телом Run.
type Job struct {
	ID  int
	Run func()
}
