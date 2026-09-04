# GoConcurrency — учебник-тренажёр по конкурентности Go (прод)

Веб-учебник + интерактивный тренажёр: 32 задачи с секции «Платформа», теория
к каждой (до и после решения), вводные главы — чтобы получился цельный учебник
по конкурентности Go. Решения прогоняются через `go test -race` в песочнице.

## Стек

- **web/** — Next.js (App Router, TypeScript, MDX). Контент-страницы (учебник,
  теория) статически рендерятся; страница задачи — клиентский Monaco-редактор.
  Деплой: Vercel (web) + отдельный сервис грейдера.
- **grader/** — Go HTTP-сервис. Принимает решение, собирает мультифайловую
  посылку и исполняет её в **self-hosted Judge0** (изолированная песочница:
  без сети, лимиты CPU/RAM/время). Абстракция `Runner` имеет две реализации:
  `LocalRunner` (`go test` локально, для dev) и `Judge0Runner` (прод).
- **infra/** — `docker-compose.yml`: Judge0 (server + workers), Postgres, Redis,
  grader, web. Поднимается одной командой.
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

## Как грейдер исполняет посылку (Judge0)

Используется язык Judge0 **«Multi-file program»**. В песочницу уходит zip:
```
go.mod              # module solution; go 1.25
solution.go         # код пользователя
solution_test.go    # скрытый грейдер (из content/tasks/NN)
support.go          # опционально (из content/tasks/NN)
compile             # скрипт сборки:  go test -race -c -o solution.test ./...
run                 # скрипт запуска: ./solution.test -test.v -test.timeout 30s
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

- Untrusted-код исполняется ТОЛЬКО в Judge0 (cgroups/seccomp, без сети).
- Грейдер валидирует размер кода, rate-limit на IP, таймауты.
- Эталоны и тесты не покидают сервер; в песочницу едет только то, что нужно.
