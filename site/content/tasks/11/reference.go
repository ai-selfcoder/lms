package solution

import (
	"strings"
	"sync"
)

func validLevel(level string) bool {
	switch level {
	case "INFO", "WARN", "ERROR":
		return true
	default:
		return false
	}
}

// RunPipeline пропускает строки через стадии Reader → Parser → Validator,
// каждая стадия со своим пулом горутин, и возвращает валидные записи.
func RunPipeline(lines []string, readers, parsers, validators int) []LogRecord {
	if readers < 1 {
		readers = 1
	}
	if parsers < 1 {
		parsers = 1
	}
	if validators < 1 {
		validators = 1
	}

	// Стадия Reader.
	rawIn := make(chan string)
	go func() {
		for _, l := range lines {
			rawIn <- l
		}
		close(rawIn)
	}()

	rawOut := make(chan string)
	var rwg sync.WaitGroup
	rwg.Add(readers)
	for i := 0; i < readers; i++ {
		go func() {
			defer rwg.Done()
			for l := range rawIn {
				rawOut <- l
			}
		}()
	}
	go func() {
		rwg.Wait()
		close(rawOut)
	}()

	// Стадия Parser.
	parsed := make(chan LogRecord)
	var pwg sync.WaitGroup
	pwg.Add(parsers)
	for i := 0; i < parsers; i++ {
		go func() {
			defer pwg.Done()
			for l := range rawOut {
				level, msg, _ := strings.Cut(l, "|")
				parsed <- LogRecord{Level: level, Msg: msg}
			}
		}()
	}
	go func() {
		pwg.Wait()
		close(parsed)
	}()

	// Стадия Validator.
	valid := make(chan LogRecord)
	var vwg sync.WaitGroup
	vwg.Add(validators)
	for i := 0; i < validators; i++ {
		go func() {
			defer vwg.Done()
			for rec := range parsed {
				if rec.Level == "" || !validLevel(rec.Level) {
					continue
				}
				valid <- rec
			}
		}()
	}
	go func() {
		vwg.Wait()
		close(valid)
	}()

	var result []LogRecord
	for rec := range valid {
		result = append(result, rec)
	}
	return result
}
