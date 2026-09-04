// В песочницу не отправляется.
package solution

func ReplayReference(log []Record) map[string]int {
	state := make(map[string]int)
	pending := make(map[string]int)
	for _, rec := range log {
		switch rec.Op {
		case "set":
			pending[rec.Key] = rec.Val
		case "commit":
			for k, v := range pending {
				state[k] = v
			}
			pending = make(map[string]int)
		}
	}
	return state
}
