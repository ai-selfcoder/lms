# GoConcurrency — учебник-тренажёр по конкурентности Go (прод)

Веб-учебник + интерактивный тренажёр: 32 задачи с секции «Платформа», теория
к каждой (до и после решения), вводные главы — чтобы получился цельный учебник
по конкурентности Go. Решения прогоняются через `go test -race` в песочнице.

## Стек

- **web/** — Next.js (App Router, TypeScript, MDX). Контент-страницы (учебник,
  теория) статически рендерятся; страница задачи — клиентский Monaco-редактор.
  Деплой: Vercel (web) + отдельный сервис грейдера.
- **grader/** — Go HTTP-сервис. Принимает решение, собирает мультифайловую
  посылку и исполняет её в sandbox backend (Piston в текущем deploy, Judge0 в
  legacy `infra`; без сети, лимиты CPU/RAM/время). Абстракция `Runner` включает
  `LocalRunner` (dev), `PistonRunner` (текущий prod) и `Judge0Runner` (legacy).
- **infra/** — legacy `docker-compose.yml` с self-hosted Judge0 (server + workers),
  Postgres, Redis, grader, web. Текущий production compose находится в
  **deploy/** и использует внешний Piston без privileged-контейнеров.
- **content/** — единый источник правды по задачам и тексту учебника (MDX/Go).

## Контракт API грейдера

`POST /api/run`
```json
// запрос
{ "taskId": "09", "code": "package solution\n..." }
// ответ
{ "pass": true, "output": "=== RUN ...\nPASS\nok ...", "durationMs": 1520,
  "timedOut": false, "compileError": false }
```
Next.js вызывает грейдер из server route (`/app/api/run`), не напрямую из
браузера (ключи/URL грейдера — серверные).

## Как грейдер исполняет посылку (Piston / Judge0)

В текущем production используется Piston package **`gotest`**. В legacy Judge0
стеке используется язык **«Multi-file program»**. В обоих случаях в sandbox
уходят только эти файлы:
```
go.mod              # module solution; go 1.25
solution.go         # код пользователя
solution_test.go    # скрытый грейдер (из content/tasks/NN)
support.go          # опционально (из content/tasks/NN)
compile / run       # backend запускает go test -json -race ./...
```
Лимиты: wall ~40s, память ↑ (race-сборка прожорлива), сеть отключена. Вердикт:
exit code 0 → PASS. `compile`-фейл → `compileError:true`. Превышение wall →
`timedOut:true`. Эталоны (`reference.go`) НЕ уходят в песочницу.

## Модель данных задачи (`content/tasks/NN/`)

```
meta.json          # { id, num, topic, slug, title, type, difficulty, tags[] }
problem.md(x)      # условие
theory.mdx         # ТЕОРИЯ ДО решения (что нужно знать, паттерны, грабли, подсказки)
solution.mdx       # РАЗБОР ПОСЛЕ решения (эталон по шагам, альтернативы, фоллоу-апы)
starter.go         # стартовый код редактора
solution_test.go   # скрытый тест-грейдер
reference.go        # эталон (для разбора и QA; не отдаётся в песочницу)
support.go         # опц. фикстуры
```

## Контент учебника

- `content/topics/NN.mdx` — вводная глава к каждому из 7 топиков.
- `content/book/*.mdx` — сквозные главы-основы (см. `content/book/OUTLINE.md`):
  модель памяти, горутины, каналы, select, sync-примитивы, context, планировщик,
  race detector, паттерны. Учебник читается линейно, задачи привязаны к главам.

## Безопасность (прод)

- Untrusted-код исполняется ТОЛЬКО в Piston (production) или Judge0 (legacy),
  в изолированной песочнице без сети.
- Грейдер валидирует размер кода, rate-limit на IP, таймауты.
- Эталоны и тесты не покидают сервер; в песочницу едет только то, что нужно.
