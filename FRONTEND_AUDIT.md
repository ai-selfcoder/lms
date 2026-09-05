# Аудит и план переписывания фронтенда GraphLMS

**Дата:** 5 сентября 2026
**Объём:** весь публичный frontend в `site/web`, кроме тренажёра задач (`/go/tasks/*`, `/os/tasks/*`) и его поведения. Тренажёр намеренно оставляется функционально неизменным; разрешены только внешние интеграционные/адаптивные улучшения после отдельной проверки.

## 1. Резюме

GraphLMS уже имеет хороший функциональный фундамент: Next.js 15 App Router, статический контент из единого дерева, локальный прогресс, OAuth/email-аутентификацию, Monaco, playground через Worker, асинхронный grader, SEO-метаданные и 58 unit-тестов. Главная проблема не в отсутствии возможностей, а в отсутствии цельной продуктовой оболочки:

- пользователь не получает ясного ответа «с чего начать» после входа на главную;
- навигация между каталогом, курсом, учебником, топиками и прогрессом разрознена;
- страницы контента выглядят как набор отдельных экранов, а не как один learning workspace;
- интерфейс в основном dark-first, но запрос предполагает более лёгкий, чистый и доступный продуктовый слой;
- почти весь UI стилизован большими inline-style объектами (в крупных файлах 29–112 объектов), из-за чего трудно поддерживать responsive-состояния и единообразие;
- в chrome-компонентах почти нет responsive CSS: header и тренажёрная shell-периферия требуют проверки на узких экранах;
- design system существует, но реальная runtime-реализация компонентов лежит в `.jsx`, а `.d.ts` только описывают API; это не проблема сборки, но повышает риск рассинхронизации типов и реализаций;
- дизайн-документы противоречат друг другу: `BASE_DESIGN.md` описывает светлую Base-тему, `BASEWEB_CONTRACT.md` и токены — тёмную. Нужен один утверждённый visual contract.

**Рекомендация:** не делать «перерисовку страниц» по одной. Сначала создать новую IA и shell, затем единый набор tokens/components, затем мигрировать public/course/account/auth screens. Тренажёр оставить отдельным IDE-продуктом.

## 2. Что реально есть сейчас

### Стек и ограничения

- Next.js `15.5.19`, React 19, TypeScript strict, App Router.
- CSS tokens/design system + inline styles; Tailwind-директивы не являются основным runtime-паттерном.
- Geist Sans/Mono self-hosted через `next/font`.
- Markdown/MDX-lite серверный рендер через unified/remark/rehype/Shiki.
- `output: standalone`; content находится рядом с `web` в `../content`.
- Данные курсов: `go-basics`, `go`, `os` в `content/courses.json`.
- Изменять тренажёр нужно крайне осторожно: `/api/run`, polling очереди, Monaco, localStorage кода, lock вкладки «Решение», grader-контракт — критические invariants.

### Маршруты

| Группа | Маршруты | Роль |
|---|---|---|
| Catalog | `/` | маркетинговая главная, список курсов, новости |
| Go course | `/go`, `/go/book`, `/go/book/[slug]`, `/go/topics`, `/go/topics/[n]` | курс конкурентности |
| Go basics | `/go-basics`, `/go-basics/book`, `/go-basics/book/[slug]` | последовательный учебник |
| OS | `/os`, `/os/book/[slug]`, `/os/sim/scheduler` | курс с симуляторами/квизами |
| Account/auth | `/account`, `/auth`, `/auth/callback` | профиль, heatmap, login/register |
| Trainer | `/go/tasks/[slug]`, `/os/tasks/[slug]` | IDE/trainer, вне scope переписывания |
| APIs | `/api/run`, `/api/mentor`, `/api/mentor/status` | runtime-интеграции |

### Основные UI-компоненты

- Global chrome: `SiteHeader`, `ChromeShell`.
- Catalog/landing: `app/(site)/page.tsx`, `components/landing/LandingView.tsx`.
- Content: `BookIndexView`, `BookChapterView`, `TopicsIndexView`, `TopicDetailView`, `TaskCard`, `Mdx`, `Runnable`.
- Account/auth: `AccountView` (717 строк), `AuthView` (971 строк).
- Trainer (не переписывать): `TaskWorkspace`, `TaskNav`, `EditorPanel`, `DescPanel`, `MentorPanel`.
- OS interactive: `Quiz`, simulator components — не тренажёр, но их UX следует унифицировать с новым course shell.
- DS: Button, Badge, Card, Callout, CodeBlock, Kbd, Logo, ProgressBar, SegmentedControl, TaskListItem, Terminal.

## 3. UX-аудит

### Сильные стороны

1. **Content-first модель.** Страницы строятся из данных, а не жёстко зашиты; новые главы/задачи можно добавлять контентом.
2. **Понятная учебная единица.** У Go есть цепочка «теория → задача → автопроверка → разбор».
3. **Progress survives without account.** Это сильный trust/conversion point; account добавляет sync, а не блокирует обучение.
4. **Грейдер и playground хорошо разделены.** Браузер не ходит к grader напрямую; worker не грузится до редактирования runnable-блока.
5. **SEO и деградация контента.** Есть metadata, JSON-LD, sitemap/robots, fallback для неполного контента.
6. **Trainer interaction model уже зрелый.** Sidebar groups, keyboard shortcut, queue status, structured tests, hints, gated solution — сохранить.

### Главные UX-проблемы

#### A. Информационная архитектура

- В header на курсе показываются разные наборы ссылок, но нет единого понятия «программа курса».
- `/go` — отдельная landing-страница, `/go/topics` — фактически task catalog, `/go/book` — отдельный каталог; пользователь должен сам соединить эти модели.
- Нет глобального «Продолжить обучение»: прогресс виден числом, но не используется как next best action.
- `/account` содержит полезный dashboard, но он не является центром learning journey и фактически доступен только из header.
- OS имеет другую структуру (book/sim/quiz), что усиливает ощущение отдельных приложений.

**Решение:** ввести единую IA: `Каталог → Курс → Обзор / Учебник / Практика / Симуляторы (если есть) / Прогресс`; topic/chapter pages остаются deep links.

#### B. Discovery и выбор первого действия

Главная уже содержит хороший hero, но одновременно пытается быть лендингом, каталогом, changelog и recent feed. Для нового пользователя недостаточно одного очевидного маршрута: «выбрать уровень → начать первый модуль → продолжить». У Go landing есть сильный product window, но он дублирует trainer и может конкурировать с CTA.

**Решение:** карточка курса должна сразу показывать уровень, формат, длительность/объём, прогресс и одну primary action, вычисляемую по прогрессу: `Начать`, `Продолжить`, `Повторить`.

#### C. Курс и учебник

`BookIndexView` и `BookChapterView` используют разные плотности, а OS book реализован ещё отдельным шаблоном. В chapters есть хороший left nav + TOC на desktop, но обе боковые панели исчезают целиком на <=1080px без замены: мобильный пользователь теряет навигацию и TOC.

**Решение:** единый `CourseReadingShell`: desktop left course outline, center prose, right in-page TOC; mobile — sticky `Разделы`/`На странице` disclosure bar; chapter footer — крупная next-step card.

#### D. Practice catalog (вне IDE)

`TopicsIndexView` красиво прост, но отображает задачи только группами; нет фильтров, сортировки, поиска, статуса attempted/solved, понятного distinction между functional/review, nor «продолжить с первой нерешённой». LeetCode-подобная модель должна быть здесь, а не в IDE sidebar: список задач — самостоятельный catalog.

**Решение:** `PracticeView` с toolbar: search, topic, difficulty, status, type; summary `N из M`; task rows/cards with status, difficulty, tags, estimated effort; default sort curriculum order; persistent filters in URL query.

#### E. Account/progress

Heatmap и recent solves — сильный базис. Но текущая страница перегружена одной длинной колонкой и не объясняет план действий. Нет streak/next recommendation/course-level progress и distinction «локально vs synced» визуально на первом экране.

**Решение:** dashboard above the fold: greeting/status, `Продолжить` CTA, overall progress, course cards, activity heatmap, recent activity. Ничего не прятать, что уже поддерживается backend/local state.

#### F. Auth

Auth functional and unusually complete (OAuth, email, onboarding, reset, guest continuation), but `AuthView.tsx` is 971 lines and all modes live in one component. Multi-step register includes `verify` mode, though current register flow transitions directly to onboarding; this creates dead/unclear UX state. Form controls need centralized validation/error semantics and mobile testing.

**Решение:** preserve auth behavior but split visual/form primitives and modes; make stepper truthful (registration currently has 2 effective steps unless email verification is implemented); keep guest CTA prominent and explain local progress.

#### G. OS interactive learning

Simulators and quizzes are valuable differentiators. They need a common frame: what concept, controls, reset, explain result, next chapter/quiz. Existing pages expose raw widgets with per-page prose, creating inconsistent control density.

**Решение:** `InteractiveLabCard` wrapper and common status/toolbar pattern; do not change algorithms or simulation behavior.

### Accessibility and responsive findings

- Global focus ring exists in DS base — keep it.
- Many interactive links/buttons are adequate size, but some plain text buttons/links in header and prev/next are below the preferred 40px hit area.
- Header has no mobile menu/disclosure in source; navigation will overflow or become cramped.
- Reading sidebars disappear on mobile with no replacement.
- Inline styles make `@media`, `:hover`, `:focus-visible`, print and reduced motion hard to apply consistently.
- Need landmarks and labels: one page-level `h1`, nav `aria-label`, active link `aria-current`, progress bars with accessible value, status live region for simulator/run outputs.
- Use `prefers-reduced-motion`; landing currently animates elements by default.
- Color tokens include success/error but status must never be color-only; existing badges mostly include text/dots, preserve.

## 4. Visual direction (recommended)

### Product concept

**GraphLMS = an engineering learning workspace.**

Reference the information clarity of LeetCode (curriculum, filters, progress, problem status) and the confidence of CodeCrafters (build/test loop, real tools, terse copy), without cloning either visual identity. The emotional promise: `read → understand → run → prove`.

### Theme recommendation

Use a **light content shell + dark code islands**, not all-dark everywhere:

- Canvas `#F7F8FA`, surfaces `#FFFFFF`, borders `#E2E6EC`, primary text `#111827`, secondary `#667085`.
- Accent remains Base blue `#276EF1`; green PASS, red FAIL, amber TIMEOUT.
- Monaco, terminal, code blocks remain dark; this keeps trainer IDE intact and makes code visually intentional.
- Optional dark theme can be added later, but do not maintain two themes during initial rewrite.

Reason: long-form reading, catalog scanning, forms, tables and progress dashboards are easier to scan in light mode; dark islands preserve developer-tool affordance. If product owner insists on dark-first, invert the shell tokens only after usability testing—not per-page ad hoc.

### Layout rules

- Content max width: 1200px.
- Reading max width: 720px; outline 240px; TOC 200px.
- App header 64px desktop, 56px mobile.
- 8px spacing base; 4/8/12/16/24/32/48/64.
- Radius 8px controls, 12px cards, 16px hero panels.
- Borders before shadows; one accent; no decorative gradient/glow except controlled hero illustration.
- Body 16px / 26px for prose; code 13–14px monospace.

### Copy and language

Keep Russian informal `ты`, terse engineering tone, no filler. Standardize:

- `Начать курс`, `Продолжить`, `Открыть программу`, `К задачам`, `Запустить пример`, `Пройдено`, `Осталось`.
- Keep code labels in monospace: `go test -race`, `go run .`, `sync.WaitGroup`.
- Replace ambiguous `Топики` as primary nav label with `Практика`; retain `Топик` in curriculum context.

## 5. Proposed information architecture

### Global

- `/` — catalog/home: continue card + course cards + how it works + recent updates.
- `/account` — progress dashboard (authenticated or local).
- `/auth` — auth overlay/page.
- Header: logo, `Курсы`, optional current course nav, `Прогресс`, auth/avatar, mobile menu.

### Per course

- `/go` — course overview: hero, outcomes, curriculum, progress, continue.
- `/go/book` — learning path / chapters.
- `/go/book/[slug]` — chapter reader.
- `/go/practice` (new canonical UI route; `/go/topics` redirect/compat alias) — practice catalog.
- `/go/topics/[n]` — topic overview/deep link, optionally link from practice filter.
- `/go/labs` (OS) — simulations/quizzes catalog; existing sim URLs stay compatible.
- `/os/book/[slug]` — same reader shell.
- `/go/tasks/[slug]`, `/os/tasks/[slug]` — **unchanged trainer routes and behavior**.

Do not break old URLs. Add canonical routes and permanent redirects only after testing all internal links; initially aliases can render same view.

## 6. Component architecture

### New shared primitives

`components/ui/` or `ds/core/`:

- `AppHeader` with mobile disclosure and current-course context.
- `CourseShell`, `CourseSubnav`, `Breadcrumbs`.
- `ContinueCard`, `CourseCard`, `StatCard`, `ProgressMeter`.
- `FilterBar`, `SearchInput`, `Select`, `Chip`, `EmptyState`.
- `CurriculumList`, `ChapterRow`, `TaskRow`, `StatusIcon`, `DifficultyBadge`.
- `ReadingShell`, `MobileOutline`, `Toc`.
- `InteractiveLabCard`, `QuizCard`.
- `DashboardSection`, `ActivityHeatmap`.
- `FormField`, `AuthStepHeader`.

### Data utilities

Extend server-safe `lib` with view models, not UI-specific duplication:

- `getCourseOverview(courseId)` → course metadata, counts, first/next chapter/task, topic summary.
- `getLearningPath(courseId)` → normalized chapter/topic/task sequence.
- `getTaskCatalog(courseId, filters)` → metadata only; filter client-side from serializable props or server query.
- `getNextAction(courseId, solvedIds)` → deterministic CTA target/label.

Do not put localStorage hooks in server view-models. Keep `useProgress` unchanged and wrap it in client dashboard/cards.

### Styling strategy

Migrate from large inline style objects to one of:

1. CSS Modules for page/layout responsive behavior + CSS variables for tokens (**recommended**).
2. Keep small dynamic values inline only (accent color, progress width, data-driven grid).

Do not introduce a second styling system. Keep `ds/styles.css` as token/reset entry point. Ensure tokens have one source of truth; remove or alias duplicate `site/tokens` vs `web/ds/tokens` only after diff review.

## 7. Phased implementation plan

### Phase 0 — contract and baselines

- Decide final theme (recommended: light shell/dark islands) and canonical labels.
- Add screenshot/route inventory and viewport acceptance matrix.
- Preserve current baseline tests/build; remove generated `.next*` artifacts from working tree.
- Add a `FRONTEND_REWRITE.md` contract with invariants and route compatibility.

### Phase 1 — foundation and shell

- Normalize tokens, breakpoints, z-index, focus, containers, responsive helpers.
- Build new global header/footer and mobile nav.
- Add `CourseShell`, breadcrumbs and active navigation.
- No behavior changes to progress/auth/trainer.

### Phase 2 — catalog and course overviews

- Rebuild `/` with one continuation CTA, course cards, clear comparison, recent updates lower on page.
- Rebuild `/go`, `/go-basics`, `/os` using shared course overview components with course-specific accent and feature flags.
- Preserve metadata/JSON-LD.

### Phase 3 — reading experience

- Replace Go and OS book indexes/chapter pages with shared `ReadingShell`.
- Add mobile outline/TOC; chapter completion/next action where state can be inferred without changing content.
- Preserve MDX HTML contract and Runnable behavior.

### Phase 4 — practice catalog (not trainer)

- Add `/go/practice` view; retain `/go/topics` alias.
- Search/filter/sort/status, curriculum groups, accessible rows, continue CTA.
- Reuse `TaskMeta`; no changes to task workspace/grader.

### Phase 5 — account/auth

- Recompose dashboard from existing heatmap/history/progress hooks.
- Split auth visual modes and form primitives; correct stepper copy without changing API calls.
- Test guest, OAuth callback, login errors, logout, local/synced states.

### Phase 6 — OS labs and polish

- Wrap simulator/quiz widgets in common lab cards; preserve algorithms and state.
- Add skeleton/error/empty states, responsive QA, keyboard QA, reduced-motion QA.
- Keep trainer outside scope except verify it still renders after shell/token changes.

### Phase 7 — verification and rollout

- `npm test`, `npm run lint`, `npm run qa`, `npm run build`, `npm run smoke`.
- Route smoke at 375×812, 768×1024, 1280×800, 1440×900.
- Verify no route broken, no API contract changed, no content missing, no trainer behavior regression.
- Roll out behind route-level feature flag if possible; otherwise commit phase-by-phase.

## 8. Acceptance criteria

### UX

- A first-time visitor can select a course and reach the first meaningful lesson in ≤2 clicks.
- Returning visitor sees exact next action based on local progress.
- Any course page exposes current course, section, progress and next/previous path.
- Practice catalog can find a task by title/topic/difficulty/status.
- Mobile reader retains access to chapter outline and page TOC.
- Guest mode is clear; account value is sync, not a surprise gate.

### Visual

- One coherent shell across catalog, course, reading, account and auth.
- Desktop and mobile layouts are intentional, not merely hidden sidebars.
- Dark editor/terminal islands remain visually and functionally intact.
- No raw hex in new component styling; data-driven course accent is the only allowed dynamic exception.
- Interactive states: hover, focus, disabled, loading, success/error, empty.

### Technical

- Existing route aliases and metadata remain valid.
- `Mdx` output class contract stays `.mdx`.
- Existing localStorage keys remain unchanged: `goconc.solved.v1`, `goconc.solvedAt.v1`, `goconc.code.v1.*`.
- `/api/run`, `/api/mentor`, `/api/mentor/status` contracts remain unchanged.
- `npm test` all current tests pass; build generates all current pages.
- Trainer routes are not functionally modified.

## 9. Competitive pattern notes

### LeetCode patterns worth adopting

- Problemset-like catalog: search, topic/difficulty/status filters, compact rows, clear solved state.
- Study-plan/course progression: explicit ordered sequence and completion percentage.
- Problem detail separation: discovery/catalog is distinct from focused solving IDE.
- Public/private progress vocabulary that works for both guest and account.

Official references: [LeetCode Study Plan](https://leetcode.com/studyplan/), [LeetCode coding practice help](https://support.leetcode.com/hc/en-us/articles/360012016874-Start-your-Coding-Practice), [LeetCode Explore](https://support.leetcode.com/hc/en-us/articles/360013578114-How-to-use-Explore).

### CodeCrafters patterns worth adopting

- Strong promise: rebuild real systems from scratch, not generic «learn programming».
- Short, concrete loop: choose challenge → open your editor → run tests → receive results/hints.
- Tool-respecting UX: IDE/editor/terminal feel first-class, not toy widgets.
- Curriculum cards communicate system/topic and staged progress.

The public CodeCrafters homepage currently positions itself as “The hardest programming challenges on the internet”, “Rebuild the software you use every day”, and emphasizes “Pick a challenge, open your editor, git push to test. That’s it.” Use the loop and specificity, not the copy or branding.

## 10. Current baseline verification

- `cd site/web && npm test`: **passed**, 9 files / 58 tests.
- `cd site/web && npm run build`: **passed** after moving a stale root-owned `.next` directory aside; generated current routes successfully. The generated `.next` directory is ignored; do not commit it.
- Route smoke with local production server: `/`, `/go/book`, `/go/tasks/01`, `/go/topics`, `/account`, `/auth`, `/os` all returned HTTP 200.
- `go` binary is unavailable in this environment, so Go checks are not executable here.
- No deployed URL was configured for public smoke testing.

## 11. Risks and open decisions

1. **Theme:** light shell recommendation conflicts with current dark-first contract. Confirm before implementation; do not silently mix themes.
2. **Canonical `/practice`:** adding route is low risk; redirect timing must be coordinated with SEO metadata and old links.
3. **Auth verification:** either implement actual verify API flow or remove the unused third step; visual rewrite should not pretend a code is verified.
4. **Progress granularity:** current local storage tracks solved tasks, not read chapters. Chapter completion must not be fabricated; use read/next recommendations only unless storage model is extended deliberately.
5. **Task counts:** course cards should derive counts from `lib/content`, never hardcode 32/12/36 in UI except fallback labels.
6. **OS task trainer:** it shares `TaskWorkspace`; preserve behavior while allowing course-specific labels and links.
7. **Generated artifacts:** `.next.old-root` was created during baseline build cleanup and must remain untracked/removed.

## 12. Suggested first implementation slice

Build and validate only the new shell + one representative course reading page before migrating everything:

1. tokens/breakpoints and `AppHeader` mobile disclosure;
2. `CourseShell`/breadcrumbs;
3. shared `ReadingShell` with desktop and mobile outline;
4. migrate `/go/book` and `/go/book/goroutines`;
5. run unit/build/smoke and compare at four viewports;
6. then proceed to catalog and dashboard.

This isolates the highest-risk cross-cutting change while leaving the trainer untouched.
