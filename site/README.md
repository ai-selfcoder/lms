# GoConcurrency — учебник + тренажёр по конкурентности Go

Прод-версия тренажёра: веб-учебник по конкурентности Go (10 глав-основ + 7 вводных
по топикам) и интерактивный тренажёр из 32 задач с секции «Платформа». К каждой
задаче — теория **до** решения (что нужно знать, паттерны, грабли) и разбор
**после** (эталон по шагам, альтернативы, фоллоу-апы интервьюера). Решения
прогоняются через `go test -race` в изолированной песочнице.

Архитектура и контракты — в [`ARCHITECTURE.md`](./ARCHITECTURE.md).

```
site/
  web/       Next.js 15 (App Router, TS, Tailwind) — сайт/учебник/тренажёр
  grader/    Go-сервис: POST /api/run → go test -race (local | piston | judge0)
  deploy/    production docker-compose: web + api + grader + external Piston
  infra/     legacy docker-compose: Judge0 (песочница) + postgres + redis
  content/   единый источник: задачи (32), главы (10), топики (7)
```

## Быстрый старт (dev, локальный прогон)

Два терминала. Песочница не нужна — код гоняется локальным `go test` (RUNNER=local).

**1) Грейдер** (порт 8090):
```bash
cd site/grader
RUNNER=local PORT=8090 CONTENT_DIR=../content/tasks go run .
```

**2) Сайт** (порт 3000):
```bash
cd site/web
npm install            # один раз
npm run dev            # http://localhost:3000   (.env.local уже указывает на :8090)
```

Открой **http://localhost:3000**. Прогресс хранится в localStorage браузера.

> ⚠️ `RUNNER=local` исполняет код **без изоляции** — только для локальной разработки.
> Для публичного прода используй изолированный Piston (ниже).

## Прод (изолированная песочница Piston)

```bash
cd site
cp deploy/.env.example deploy/.env  # заполнить секреты и PISTON_URL
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
curl -s localhost:3000/
```
Грейдер в этом режиме идёт с `RUNNER=piston` и шлёт посылки во внешний Piston
(без сети, лимиты CPU/RAM/время). Эталоны (`reference.go`) в песочницу не
попадают. Детали и переменные окружения — в [`deploy/README.md`](./deploy/README.md).

Для legacy-стека с self-hosted Judge0 остаётся `infra/docker-compose.yml`;
его описание — в [`grader/README.md`](./grader/README.md).

Production deployment — Coolify/Docker Compose (см. [`deploy/README.md`](./deploy/README.md)).
Для отдельного Vercel-деплоя web-корнем проекта остаётся `site/`, поскольку
`content/` лежит выше `web/`.

## Контент

- `content/tasks/NN/` — `meta.json`, `problem.md`, `theory.mdx`, `solution.mdx`,
  `starter.go`, `solution_test.go`, `reference.go`, опц. `support.go`.
- `content/book/<slug>.mdx` — главы-основы (см. `content/book/OUTLINE.md`).
- `content/topics/NN.mdx` — вводные по 7 топикам.

Код задач — единый с локальным тренажёром `../trainer` (там же быстрый CLI-прогон
`go run . validate`, который проверяет, что все 32 эталона проходят грейдер).
