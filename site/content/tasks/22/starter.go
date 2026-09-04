package solution

import (
	"fmt"
	"sync"
	"time"
)

// UserProfile — профиль пользователя.
type UserProfile struct {
	ID   int
	Name string
}

// UserFetcher параллельно загружает профили пользователей с кэшированием.
//
// ВНИМАНИЕ: код содержит ошибку конкурентности — воркеры дописывают результаты
// в общий слайс без синхронизации (data race). Найдите и исправьте все ошибки.
type UserFetcher struct {
	cache map[int]UserProfile
	mu    sync.Mutex
}

// NewUserFetcher создаёт загрузчик с пустым кэшем.
func NewUserFetcher() *UserFetcher {
	return &UserFetcher{cache: make(map[int]UserProfile)}
}

// fetchFromRemoteAPI имитирует медленный HTTP-запрос и возвращает профиль.
func (uf *UserFetcher) fetchFromRemoteAPI(id int) UserProfile {
	time.Sleep(2 * time.Millisecond)
	return UserProfile{ID: id, Name: fmt.Sprintf("User%d", id)}
}

func (uf *UserFetcher) getProfile(id int) UserProfile {
	uf.mu.Lock()
	if p, ok := uf.cache[id]; ok {
		uf.mu.Unlock()
		return p
	}
	uf.mu.Unlock()

	p := uf.fetchFromRemoteAPI(id)

	uf.mu.Lock()
	uf.cache[id] = p
	uf.mu.Unlock()
	return p
}

// FetchUsersData возвращает по одному профилю на каждый запрошенный id.
func (uf *UserFetcher) FetchUsersData(userIDs []int) []UserProfile {
	const workers = 5

	ids := make(chan int)
	var results []UserProfile

	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for id := range ids {
				p := uf.getProfile(id)
				// БАГ: конкурентный append в общий слайс без синхронизации.
				results = append(results, p)
			}
		}()
	}

	for _, id := range userIDs {
		ids <- id
	}
	close(ids)

	wg.Wait()
	return results
}
