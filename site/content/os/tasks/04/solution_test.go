package solution

import "testing"

func TestTranslate(t *testing.T) {
	table := []int{2, -1, 5}
	tests := []struct {
		name     string
		va       int
		table    []int
		pageSize int
		wantPA   int
		wantOK   bool
	}{
		{"типичный адрес", 3, table, 16, 35, true},
		{"разбор адреса 35", 35, table, 16, 83, true},
		{"offset на границе страницы", 15, table, 16, 47, true},
		{"начало второй валидной страницы", 32, table, 16, 80, true},
		{"невалидная запись (page fault)", 20, table, 16, 0, false},
		{"vpn за пределами таблицы", 48, table, 16, 0, false},
		{"пустая таблица", 0, []int{}, 16, 0, false},
		{"один элемент, нулевой кадр валиден", 5, []int{0}, 8, 5, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pa, ok := Translate(tt.va, tt.table, tt.pageSize)
			if ok != tt.wantOK || pa != tt.wantPA {
				t.Fatalf("Translate(%d, %v, %d) = (%d, %v), хотим (%d, %v)",
					tt.va, tt.table, tt.pageSize, pa, ok, tt.wantPA, tt.wantOK)
			}
		})
	}
}
