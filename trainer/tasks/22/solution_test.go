package solution

import (
	"fmt"
	"testing"
)

func TestFetchUsersData_CorrectAndRaceFree(t *testing.T) {
	// 0..49 плюс повторы, чтобы проверить мультимножество и кэш.
	var userIDs []int
	for i := 0; i < 50; i++ {
		userIDs = append(userIDs, i)
	}
	for i := 0; i < 50; i += 2 {
		userIDs = append(userIDs, i) // повторы чётных id
	}

	want := make(map[int]int) // id -> сколько раз запрошен
	for _, id := range userIDs {
		want[id]++
	}

	uf := NewUserFetcher()
	got := uf.FetchUsersData(userIDs)

	if len(got) != len(userIDs) {
		t.Fatalf("ожидалось %d профилей (по одному на каждый запрошенный id), получено %d", len(userIDs), len(got))
	}

	gotCount := make(map[int]int)
	for _, p := range got {
		wantName := fmt.Sprintf("User%d", p.ID)
		if p.Name != wantName {
			t.Fatalf("у профиля id=%d неверное имя: ожидалось %q, получено %q", p.ID, wantName, p.Name)
		}
		gotCount[p.ID]++
	}

	for id, n := range want {
		if gotCount[id] != n {
			t.Fatalf("id=%d должен встречаться %d раз(а), встретился %d (потеря/дублирование результатов)", id, n, gotCount[id])
		}
	}
	for id, n := range gotCount {
		if want[id] != n {
			t.Fatalf("в ответе лишний id=%d (встретился %d раз, ожидалось %d)", id, n, want[id])
		}
	}
}
