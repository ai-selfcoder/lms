package solution

import "testing"

func TestTranslate(t *testing.T) {
	cases := []struct {
		name     string
		va       int
		base     int
		bound    int
		wantAddr int
		wantOK   bool
	}{
		{"типичный адрес внутри границ", 100, 32768, 16384, 32868, true},
		{"первый байт va==0", 0, 32768, 16384, 32768, true},
		{"последний валидный индекс bound-1", 16383, 32768, 16384, 49151, true},
		{"va равен bound — уже вне", 16384, 32768, 16384, 0, false},
		{"va больше bound", 20000, 32768, 16384, 0, false},
		{"отрицательный va", -5, 32768, 16384, 0, false},
		{"нулевой bound — всё вне", 0, 1000, 0, 0, false},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			gotAddr, gotOK := Translate(c.va, c.base, c.bound)
			if gotAddr != c.wantAddr || gotOK != c.wantOK {
				t.Fatalf("Translate(%d, %d, %d) = (%d, %v); want (%d, %v)",
					c.va, c.base, c.bound, gotAddr, gotOK, c.wantAddr, c.wantOK)
			}
		})
	}
}
