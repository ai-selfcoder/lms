# Оглавление учебника (сквозные главы-основы)

Линейно читаемый учебник по конкурентности Go. Каждая глава — `content/book/<slug>.mdx`
с frontmatter `{ title, slug, order, minutes }`. На главы ссылается теория задач
как `/book/<slug>`. Тон — как у задачи 01: глубоко, с кодом, с прод-контекстом.

| order | slug | Глава | Ключевое |
|------|------|-------|----------|
| 1 | `goroutines` | Горутины и планировщик | go-стек, G-M-P, дёшево ли создавать, когда блокируются |
| 2 | `memory-model` | Модель памяти и happens-before | видимость записей, зачем нужна синхронизация, data race ≠ race condition |
| 3 | `channels` | Каналы | буфер/без буфера, close как broadcast, nil-канал, направления |
| 4 | `select` | select | мультиплексирование, default, nil-каналы для «выключения» веток, таймауты |
| 5 | `sync-primitives` | sync: Mutex, RWMutex, Once, Cond, WaitGroup, Pool | когда мьютекс, когда канал; RWMutex и read-heavy; Cond |
| 6 | `atomic` | sync/atomic | атомики против мьютекса, contention, lock-free счётчики |
| 7 | `context` | context | дерево отмены, Done(), таймауты, передача через границы |
| 8 | `patterns` | Паттерны конкурентности | pipeline, fan-in/fan-out, worker pool, semaphore, batching |
| 9 | `leaks-and-races` | Утечки горутин и гонки | как находить, race detector, goroutine leak, pprof |
| 10 | `scheduler-deep` | Планировщик глубже | preemption, GOMAXPROCS, work-stealing, спинлоки в рантайме |

Привязка задач к главам (для «связанных материалов» на странице задачи):
- Топик 1 (1–4): channels, select
- Топик 2 (5–8): sync-primitives, atomic, memory-model
- Топик 3 (9–12): patterns, channels
- Топик 4 (13–15): context, leaks-and-races
- Топик 5 (16–20): atomic, sync-primitives, patterns
- Топик 6 (21–22): leaks-and-races, memory-model
- Топик 7 (23–32): patterns, sync-primitives, context
