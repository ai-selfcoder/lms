package runner

import "testing"

func TestRun(t *testing.T) {
	cases := []struct {
		name   string
		code   string
		expect string // substring expected in stdout
	}{
		{
			name: "hello",
			code: `package main
import "fmt"
func main() { fmt.Println("привет, Go") }`,
			expect: "привет, Go",
		},
		{
			name: "strings_strconv",
			code: `package main
import ("fmt"; "strings"; "strconv")
func main() {
	fmt.Println(strings.ToUpper("go"), strconv.Itoa(2*21))
}`,
			expect: "GO 42",
		},
		{
			name: "slices_loop",
			code: `package main
import "fmt"
func main() {
	sum := 0
	for _, v := range []int{1,2,3,4} { sum += v }
	fmt.Println("sum=", sum)
}`,
			expect: "sum= 10",
		},
		{
			name: "goroutine_channel",
			code: `package main
import ("fmt"; "sync")
func main() {
	ch := make(chan int)
	var wg sync.WaitGroup
	wg.Add(1)
	go func(){ defer wg.Done(); ch <- 7 }()
	fmt.Println("got", <-ch)
	wg.Wait()
}`,
			expect: "got 7",
		},
		{
			name: "compile_error",
			code: `package main
func main() { undefinedThing() }`,
			expect: "", // stdout empty, Err non-empty
		},
		{
			name: "runtime_panic",
			code: `package main
func main() { panic("boom") }`,
			expect: "", // must surface a non-empty Err and NOT crash the process
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			r := Run(c.code)
			if c.expect == "" {
				// Error cases (compile error, runtime panic): expect a non-empty
				// Err and a Run that returned normally (recover kept us alive).
				if r.Err == "" {
					t.Fatalf("expected error, got none; stdout=%q", r.Stdout)
				}
				return
			}
			if r.Err != "" {
				t.Fatalf("unexpected error: %s", r.Err)
			}
			if !contains(r.Stdout, c.expect) {
				t.Fatalf("stdout=%q does not contain %q", r.Stdout, c.expect)
			}
		})
	}
}

func contains(s, sub string) bool {
	if len(sub) == 0 {
		return true
	}
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
