# Задача 32: Idle Timeout Pool (засыпающие воркеры)

Реализуйте эластичный воркер-пул `ElasticPool`. Он всегда держит как минимум
`minWorkers` постоянных воркеров, под нагрузкой временно поднимает дополнительных
воркеров (но не больше `maxWorkers`), а лишние воркеры, простаивавшие дольше
`idleTimeout`, завершаются сами.

```go
type ElasticPool struct {
    // ...
}

// NewElasticPool создаёт пул: minWorkers постоянных, до maxWorkers под нагрузкой,
// лишние засыпают и выходят после idleTimeout простоя. Задачи читаются из tasks.
func NewElasticPool(minWorkers, maxWorkers int, idleTimeout time.Duration, tasks <-chan func()) *ElasticPool

// Start запускает пул.
func (p *ElasticPool) Start()

// Stop останавливает пул, завершая всех воркеров.
func (p *ElasticPool) Stop()

// Peak — максимальное число одновременно живых воркеров за всё время.
func (p *ElasticPool) Peak() int

// Active — текущее число живых воркеров.
func (p *ElasticPool) Active() int
```

Под всплеском задач пул должен подняться выше `minWorkers` (до `maxWorkers`), а
после простоя дольше `idleTimeout` — опуститься обратно к `minWorkers`. Число
живых воркеров никогда не должно падать ниже `minWorkers` или превышать
`maxWorkers`.

**На что смотрит интервьюер:**

- **Эластичность**: под нагрузкой поднимаются дополнительные воркеры (Peak >
  minWorkers), при простое лишние выходят (Active возвращается к minWorkers).
- **Границы**: число воркеров всегда в диапазоне [minWorkers, maxWorkers];
  счётчики защищены мьютексом/атомиками.
- **Idle timeout**: эластичный воркер ждёт задачу через `select` с
  `time.After(idleTimeout)` и завершается по таймауту простоя.
- **Отсутствие гонок**: счётчики Active/Peak и логика запуска воркеров корректны
  под `-race`.
- **Чистый Stop**: все воркеры завершаются без утечек и паник; все поданные
  задачи выполнены.
