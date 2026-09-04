# Очередь проверок (grading queue) — дизайн

Дата: 2026-06-29
Статус: утверждён к реализации

## Задача

При наплыве пользователей проверки решений должны вставать в очередь, а не
держать долгие синхронные HTTP-соединения. Пользователю показывается его место
в очереди и общая длина очереди («ты 3-й из 12»). ETA не показываем.

## Решения (зафиксированы)

- **Что видит юзер:** своя позиция + длина очереди. Без чужих имён, без ETA.
- **Транспорт:** клиент поллит статус раз в ~1 с.
- **Где очередь:** в Go-грейдере, в памяти, один инстанс. Пул воркеров = и есть
  ограничитель параллелизма к Piston (заменяет идею отдельного семафора).
- **v1 без отмены** брошенных джоб — они досчитываются впустую, но их немного
  из-за per-IP rate limit.

## Архитектура

Текущий поток синхронный:
`browser → POST /api/run (BFF) → POST {GRADER_URL}/api/run (блокирует ≤60 с) → вердикт`.

Новый поток асинхронный:
```
browser  ──POST /api/run {taskId,course,code}──▶ BFF ──▶ grader: enqueue → {jobId}
browser  ──GET  /api/run?id=<jobId> (раз в ~1 с)──▶ BFF ──▶ grader: status
         ◀── {status, position, queueLength}  …пока queued/running
         ◀── {status:"done", ...вердикт}      когда готово
```
При лёгкой нагрузке (есть свободный воркер) джоба стартует сразу: `position 0`,
`status:"running"` — очередь в UI не показывается, ведёт себя как сейчас.

## Компонент 1 — грейдер: `queue.go` (новый файл)

Самодостаточный модуль. Публичный интерфейс:

```go
type Queue struct { /* приватные поля */ }

// NewQueue запускает воркеры и фоновый GC. runner — существующий Runner.
func NewQueue(cfg Config, runner Runner, log *slog.Logger) *Queue

// Submit ставит джобу в очередь. Возвращает jobID, либо ErrQueueFull.
func (q *Queue) Submit(taskDir, course, taskID, code string) (string, error)

// Status возвращает снимок статуса джобы; ok=false если id неизвестен.
func (q *Queue) Status(jobID string) (JobStatus, bool)

// Shutdown останавливает воркеры (graceful).
func (q *Queue) Shutdown(ctx context.Context) error
```

Типы:

```go
type JobPhase string // "queued" | "running" | "done" | "error"

type JobStatus struct {
    Phase       JobPhase  `json:"status"`
    Position    int       `json:"position"`     // мест впереди + 1; 0 если уже не в очереди
    QueueLength int       `json:"queueLength"`  // сколько всего сейчас ждёт
    Result      *RunResult `json:"result,omitempty"` // при done
    Error       string    `json:"error,omitempty"`   // при error
}
```

Внутреннее устройство:
- `jobs map[string]*job` под `sync.Mutex`. `job` хранит фазу, `ticket`, результат,
  время завершения (для GC).
- Канал `pending chan *job` (буфер = `MaxQueue`) — из него тянут воркеры.
- **Позиция за O(1)** двумя монотонными счётчиками под тем же мьютексом:
  - `enqueued` — всего поставлено; при сабмите `job.ticket = ++enqueued`.
  - `started` — всего взято в работу; воркер делает `++started` при старте.
  - `position = job.ticket - started` (для queued); `queueLength = enqueued - started`.
- **Воркеры:** `Concurrency` штук; каждый в цикле берёт `*job` из `pending`,
  помечает `running` (+`started`), вызывает `runner.Run(ctx, taskDir, code)` с
  дедлайном `RequestTimeout`, кладёт `Result`/`Error`, помечает `done`/`error`,
  ставит `finishedAt`.
- **GC:** тикер раз в ~30 с удаляет джобы с `finishedAt` старше `JobTTL`.
- **Переполнение:** если в `pending` нет места (или `queueLength >= MaxQueue`) —
  `Submit` возвращает `ErrQueueFull`.

ID джобы: криптослучайный hex (16 байт). taskDir резолвится в `server.go` до
`Submit` (как сейчас), чтобы вся валидация путей осталась в хендлере.

## Компонент 2 — грейдер: HTTP (`server.go`)

- `POST /api/run` — без изменений в валидации (rate-limit по IP, taskId/course
  regex, размер кода, резолв taskDir, проверка `solution_test.go`). Затем
  `q.Submit(...)`:
  - успех → `202` + `{"jobId":"..."}`.
  - `ErrQueueFull` → `429` + `{"error":"очередь переполнена, попробуй через минуту"}`.
- `GET /api/run?id=<jobId>` — `q.Status(id)`:
  - ok → `200` + `JobStatus` (при `done` внутри `result` — обычный `RunResult`).
  - неизвестен → `404` + `{"error":"задача не найдена (истекла) — запусти заново"}`.
- `GET /healthz` — без изменений.
- Graceful shutdown в `main.go` дополнительно зовёт `q.Shutdown`.

Rate-limit остаётся только на `POST` (статус-поллинг не лимитируем).

## Компонент 3 — конфиг (`config.go`)

Новые env (стиль как у существующих, без префикса):

| env | дефолт | смысл |
|-----|--------|-------|
| `CONCURRENCY`      | `16`  | число воркеров (параллелизм к Piston) |
| `MAX_QUEUE`        | `200` | максимум ожидающих; сверх — 429 |
| `JOB_TTL_SECONDS`  | `120` | сколько держать готовый результат для поллинга |

`REQUEST_TIMEOUT_SECONDS` теперь ограничивает `runner.Run` внутри воркера
(не HTTP-запрос).

## Компонент 4 — BFF (`web/app/api/run/route.ts`)

- `POST` — как сейчас валидирует размер, форвардит тело в `POST {GRADER_URL}/api/run`,
  прокидывает `X-Forwarded-For`, возвращает `{ jobId }` (или ошибку/429).
- `GET` (новый) — `?id=<jobId>` → `GET {GRADER_URL}/api/run?id=...`, возвращает
  `JobStatus` как есть. Короткие запросы вместо 60-секундных коннектов.
- Старый 60-секундный таймаут на синхронный грейдер убираем; на сабмит/статус —
  обычные короткие таймауты (~10 с).

## Компонент 5 — UI (`web/components/task/`)

- **Хук `useGradeJob`** (новый файл `useGradeJob.ts`): инкапсулирует
  submit + polling. Возвращает `{ phase, position, queueLength, result, start() }`.
  - `start(taskId, course, code)`: `POST /api/run` → `jobId`; запускает
    `setInterval`/рекурсивный `setTimeout` ~1 с на `GET /api/run?id`.
  - Останавливает поллинг на `done`/`error`/`404`. Чистит таймер на unmount и
    при смене задачи.
  - Клиентский предохранитель: если поллим дольше ~4 мин — стоп + ошибка
    «слишком долго, попробуй ещё раз».
- **`QueueStatus`** (новый презентационный компонент): по `phase`:
  - `queued` → спиннер + «В очереди: {position}-й из {queueLength}».
  - `running` → «Проверяется…».
  - `done`/`error` → ничего (показывается обычный результат).
- `TaskWorkspace`/`EditorPanel`: `handleRun` использует `useGradeJob`; `running`
  истинно, пока `phase ∈ {queued,running}` (кнопка заблокирована); при `done` и
  `result.pass && !result.error` → `markSolved`. Рендер результата не меняется.

## Обработка ошибок

| ситуация | поведение |
|----------|-----------|
| грейдер недоступен на сабмите | как сейчас — JSON-ошибка, без падения |
| очередь переполнена | `429` → «очередь переполнена, попробуй через минуту» |
| id неизвестен (GC/рестарт) | `404` → «задача истекла — запусти заново» |
| сбой поллинга (сеть) | ретраи; после нескольких подряд — ошибка |
| ошибка раннера (Piston лёг) | `status:"error"` + сообщение (рендер ошибки уже есть) |
| таймаут проверки | обычный вердикт `timedOut` внутри `result` (это `done`) |

## Тестирование

- **`queue_test.go`** (юнит, с фейковым `Runner`):
  - математика позиции: сабмит K джоб при `Concurrency=1`, проверить
    `position`/`queueLength` по мере обработки.
  - ограничение параллелизма: фейк-раннер считает одновременные вызовы,
    проверить ≤ `Concurrency`.
  - переполнение: при заполненной очереди `Submit` → `ErrQueueFull`.
  - TTL/GC: готовая джоба исчезает после `JobTTL`.
  - порядок FIFO.
- **`server` тест** при наличии хелперов: `POST` отдаёт `jobId`, `GET ?id`
  проходит фазы queued→running→done.
- BFF/UI — без обязательных тестов (тонкие прокси/презентация); существующие
  тесты не ломать.

## Файлы

Новые:
- `site/grader/queue.go`
- `site/grader/queue_test.go`
- `site/web/components/task/useGradeJob.ts`
- `site/web/components/task/QueueStatus.tsx`

Изменяемые:
- `site/grader/server.go` — async-хендлеры над `Queue`.
- `site/grader/config.go` — `CONCURRENCY`, `MAX_QUEUE`, `JOB_TTL_SECONDS`.
- `site/grader/main.go` — создать `Queue`, прокинуть в `Server`, `Shutdown`.
- `site/web/app/api/run/route.ts` — `POST` (enqueue) + `GET` (status).
- `site/web/components/task/TaskWorkspace.tsx` — через `useGradeJob`.
- `site/web/components/task/EditorPanel.tsx` — встроить `QueueStatus`.
- `site/deploy/docker-compose.yml` — новые env у сервиса `grader` (с дефолтами).

## Вне scope v1

- Отмена джобы при уходе со страницы (DELETE/heartbeat).
- ETA/оценка времени.
- Общая очередь на несколько инстансов грейдера (Redis) — нужна только при
  горизонтальном масштабировании грейдера.
- WebSocket/SSE — поллинга достаточно.
