# GraphLMS — web

Next.js (App Router) приложение GraphLMS: единый маршрут через основы Go,
конкурентность Go и операционные системы. Здесь связаны главы, задачи,
симуляторы, проектные треки, skill report и режим интервью. Решения проходят
через `go test -race` во внешнем грейдере.

## Стек

- **Next.js 15** (App Router, RSC) + **TypeScript** (strict)
- **локальный design system + CSS** — плотный адаптивный инженерный UI
- **@monaco-editor/react** — редактор кода
- **unified / remark / rehype** + **rehype-pretty-code (shiki)** — рендер
  Markdown-контента с подсветкой синтаксиса
- **gray-matter** — фронтматтер

Контент берётся из соседней директории `../content` через `fs` на сервере
(см. `lib/content.ts`). На страницу задачи отдаётся клиентский Monaco-редактор;
весь текст (условие/теория/разбор/учебник) рендерится на сервере.

## Структура

```
app/
  (site)/                 # общий shell и продуктовые страницы
    page.tsx              # / — onboarding и next-best-action
    account/              # кабинет и shareable skill report
    projects/, teams/     # проектные треки и командные пространства
  go/, go-basics/, os/    # три course-scoped маршрута
  api/run/route.ts        # POST /api/run — прокси к грейдеру
  sitemap.ts, robots.ts
components/
  task/                   # workspace, mentor, discussions, solution notes
  projects/, teams/, ...  # продуктовые поверхности
lib/
  content.ts              # загрузчик course-scoped контента
  learning.ts             # канонический LearningItem graph
  markdown.ts             # Markdown -> HTML (remark/rehype/shiki)
  progress.ts             # local progress, attempts, events и merge
  projectTracks.ts        # декларативные вертикальные треки
  toc.ts                  # оглавление главы
```

## Маршруты

| Route             | Описание                                            |
| ----------------- | --------------------------------------------------- |
| `/`               | Onboarding, диагностика и следующий лучший шаг      |
| `/go-basics/...`, `/go/...`, `/os/...` | Course-scoped книги, задачи и OS-лаборатории |
| `/go/practice`    | Поиск, фильтры и статусы практики                    |
| `/go/skills`, `/go/interview` | Skill graph и режим интервью               |
| `/projects`, `/teams` | Проектные треки и командные пространства          |
| `/account/report` | Shareable отчёт без исходного кода                  |
| `/api/run`        | POST → прокси к грейдеру (server-only)               |
| `/sitemap.xml`, `/robots.txt` | SEO                                     |

`slug` берётся из `meta.json` (поле `slug`), с фоллбэком на `id`/`num`.

## Запуск (dev)

```bash
cp .env.example .env.local      # GRADER_URL=http://localhost:8090
npm install
npm run dev                     # http://localhost:3000
```

Запусти рядом грейдер (Go-сервис, см. `../grader`). Без него тренажёр откроется,
но прогон вернёт понятную ошибку «грейдер недоступен» вместо падения.

## Сборка

```bash
npm run build
npm start
```

`npm run build` статически пререндерит все страницы задач, топиков и глав
(контент читается из `../content` на этапе сборки).

## Деплой (Vercel)

Контент лежит в `../content` (вне `web/`), поэтому в Vercel нужно подключать
**корень репозитория**, а не папку `web/`:

- **Root Directory:** корень монорепо (где есть и `web/`, и `content/`)
- **Build Command:** `cd web && npm install && npm run build`
- **Output Directory:** `web/.next`
- либо задать в Project Settings: Root = `web/`, но тогда добавить `content/`
  в `includeFiles` / держать контент внутри `web/`.

`next.config.mjs` уже выставляет `outputFileTracingRoot`, чтобы трассировка
захватывала файлы за пределами `web/`.

### Переменные окружения

| Переменная   | Назначение                                | Дефолт                  |
| ------------ | ----------------------------------------- | ----------------------- |
| `GRADER_URL` | URL Go-грейдера (server-only)             | `http://localhost:8090` |
| `API_URL` | Внутренний URL NestJS API для server routes | `http://localhost:4000` |
| `GRADER_SYNC_SECRET` | Общий с API секрет для short-lived PASS proof | — |
| `SITE_URL`   | Базовый URL для sitemap/robots (опц.)     | `https://goconcurrency.local` |

Секреты не коммитятся: только `.env.example`. Браузер никогда не обращается к
грейдеру напрямую — всё идёт через `/api/run`.

## Контракт грейдера

```
POST {GRADER_URL}/api/run
  body: { "taskId": "01", "code": "package solution\n..." }
  resp: { "pass": true, "output": "...", "durationMs": 1520,
          "timedOut": false, "compileError": false }
```

`/api/run` валидирует размер кода и таймаут, при недоступности грейдера
возвращает `{ pass:false, error:true, output: "<сообщение>" }`.

## Прогресс

Локально в браузере хранятся:

- `goconc.solved.v1` — course-scoped множество решённых задач
- `goconc.code.v1.<course>:<id>` — последний код и черновик
- `goconc.attempts.v1` — история попыток для сравнения первой и успешной
- `goconc.events.v1` — обезличенные learning events с opt-out

После входа прогресс объединяется с сервером idempotent sync. Во время активной
сессии черновики и pass отправляются с debounce; при конфликте локальный код
сохраняется, а solved-статусы объединяются. При недоступном API приложение
остаётся полностью работоспособным локально.

## Деградация при неполном контенте

Контент генерируется параллельно. Загрузчики устойчивы к отсутствию файлов:
нет `theory.mdx` → вкладка «Теория» скрыта; нет `solution.mdx` → во вкладке
«Решение» показывается эталон из `reference.go` (или заглушка); нет глав
учебника/интро топика → разделы показывают мягкую заглушку. Контент рендерится
как Markdown (а не строгий MDX), поэтому Go-синтаксис в тексте (`<-chan`,
дженерики) не ломает сборку.
```
