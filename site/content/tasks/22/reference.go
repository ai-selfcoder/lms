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
// Исправленная версия: воркеры пишут результат в предвыделённый слайс по
// своему индексу (никакого общего append → нет гонки), а кэш защищён мьютексом.
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

// job связывает позицию в исходном запросе с id.
type job struct {
	index int
	id    int
}

// FetchUsersData возвращает по одному профилю на каждый запрошенный id
// (повторы в запросе дают повторы в ответе), без гонок данных.
func (uf *UserFetcher) FetchUsersData(userIDs []int) []UserProfile {
	const workers = 5

	results := make([]UserProfile, len(userIDs))
	jobs := make(chan job)

	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				// Каждый воркер пишет в свой индекс — пересечений нет.
				results[j.index] = uf.getProfile(j.id)
			}
		}()
	}

	for i, id := range userIDs {
		jobs <- job{index: i, id: id}
	}
	close(jobs)

	wg.Wait()
	return results
}
