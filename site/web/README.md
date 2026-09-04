# GoConcurrency — web (учебник + тренажёр)

Next.js (App Router) приложение: веб-учебник и интерактивный тренажёр по
конкурентности Go. 32 задачи, теория к каждой, сквозные главы-учебника и
песочница, которая прогоняет решения через `go test -race` во внешнем грейдере.

## Стек

- **Next.js 15** (App Router, RSC) + **TypeScript** (strict)
- **Tailwind CSS** — тёмная тема в палитре GitHub-dark
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
  (site)/                 # маркетинговые/контентные страницы (общий хедер)
    page.tsx              # /            — лендинг
    book/                 # /book, /book/[slug]
    topics/               # /topics, /topics/[n]
  tasks/[slug]/page.tsx   # /tasks/[slug] — полноэкранный тренажёр
  api/run/route.ts        # POST /api/run — прокси к грейдеру
  sitemap.ts, robots.ts
components/
  task/                   # TaskWorkspace, TaskNav, EditorPanel, DescPanel
  Mdx.tsx, TaskCard.tsx, SiteHeader.tsx, ...
lib/
  content.ts              # загрузчик контента (fs, gray-matter)
  markdown.ts             # Markdown -> HTML (remark/rehype/shiki)
  progress.ts             # прогресс в localStorage (solved + last code)
  toc.ts                  # оглавление главы
```

## Маршруты

| Route             | Описание                                            |
| ----------------- | --------------------------------------------------- |
| `/`               | Лендинг: питч, что внутри, прогресс, CTA             |
| `/book`           | Оглавление глав учебника                             |
| `/book/[slug]`    | Глава (MDX, TOC, prev/next)                          |
| `/topics`         | 7 топиков с задачами и статусом решения              |
| `/topics/[n]`     | Вводная глава топика + карточки задач                |
| `/tasks/[slug]`   | Тренажёр: nav · Monaco + терминал · вкладки справа   |
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

Хранится в `localStorage`:

- `goconc.solved.v1` — множество id решённых задач
- `goconc.code.v1.<id>` — последний код по каждой задаче

Решённой задача становится автоматически при вердикте PASS. Вкладка «Решение»
до этого заблокирована (есть escape «Показать всё равно»).

## Деградация при неполном контенте

Контент генерируется параллельно. Загрузчики устойчивы к отсутствию файлов:
нет `theory.mdx` → вкладка «Теория» скрыта; нет `solution.mdx` → во вкладке
«Решение» показывается эталон из `reference.go` (или заглушка); нет глав
учебника/интро топика → разделы показывают мягкую заглушку. Контент рендерится
как Markdown (а не строгий MDX), поэтому Go-синтаксис в тексте (`<-chan`,
дженерики) не ломает сборку.
```
