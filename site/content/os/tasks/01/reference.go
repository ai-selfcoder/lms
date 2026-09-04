package solution

// Эталонная реализация Round Robin. В песочницу не отправляется.
func ScheduleReference(jobs []Job, quantum int) []string {
	if quantum < 1 {
		quantum = 1
	}
	remaining := make([]int, len(jobs))
	queue := make([]int, 0, len(jobs))
	for i := range jobs {
		remaining[i] = jobs[i].Burst
		queue = append(queue, i)
	}

	timeline := make([]string, 0)
	for len(queue) > 0 {
		i := queue[0]
		queue = queue[1:]
		run := quantum
		if remaining[i] < run {
			run = remaining[i]
		}
		for k := 0; k < run; k++ {
			timeline = append(timeline, jobs[i].Name)
		}
		remaining[i] -= run
		if remaining[i] > 0 {
			queue = append(queue, i)
		}
	}
	return timeline
}
