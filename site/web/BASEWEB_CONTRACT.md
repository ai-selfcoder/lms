# Base Web (baseui 18 + Styletron) — паттерн для рескина

Цель: весь UI на настоящем **Uber Base Web** (baseui 18.1.0), тёмная тема,
Styletron (CSS-in-JS). Tailwind будет удалён в самом конце (НЕ трогай конфиг
Tailwind, globals @tailwind-директивы и не удаляй tailwind — это сделает оркестратор).

## Что уже готово (эталоны — копируй паттерн)
- `app/providers.tsx` — Styletron SSR-провайдер + `BaseProvider` с темой. НЕ менять.
- `app/theme.ts` — тёмная тема Base на шрифте Geist. Используй её токены через `useStyletron`.
- `components/landing/LandingView.tsx` — ЭТАЛОН: серверная страница грузит данные и
  отдаёт их в client-view; вёрстка через `useStyletron()` + baseui-компоненты.
- `components/SiteHeader.tsx` — эталон навигации.
- Эталон того, как Uber верстает компоненты: `/Users/yurasargsyan/Interview/baseweb/documentation-site` и `/Users/yurasargsyan/Interview/baseweb/src` (исходники).

## Правила

1. **Client boundary.** baseui-компоненты клиентские. Паттерн: серверная `page.tsx`
   грузит контент из `lib/content` и рендерит клиентский `*View`/`*Panel`
   (`"use client"`), передавая СЕРИАЛИЗУЕМЫЕ пропсы (строки/числа/массивы; не функции).
2. **Стилизация.** Внутри клиентских компонентов: `const [css, theme] = useStyletron();`
   и `className={css({ ... })}`. Цвета/отступы/радиусы — ТОЛЬКО из темы:
   `theme.colors.{backgroundPrimary,backgroundSecondary,contentPrimary,contentSecondary,contentTertiary,borderOpaque,accent,positive,negative,warning}`,
   `theme.sizing.scaleN`, `theme.borders.radius{200,300,400}`. Никаких Tailwind-классов
   и сырых hex в новом коде.
3. **Компоненты baseui:** `Button` (`baseui/button`), `Tag` (`baseui/tag`),
   `Tabs`/`Tab` (`baseui/tabs-motion`), типографика (`baseui/typography`:
   `DisplayMedium, HeadingLarge/Medium/Small/XSmall, LabelLarge/Medium/Small/XSmall,
   ParagraphLarge/Medium/Small`), `Block` (`baseui/block`), `Notification` для статусов.
   Ссылка-кнопка: `<Button $as={Link} href="...">`. Обычная ссылка: `next/link` + `css()`.
4. **baseui 18 нюансы:** `createDarkTheme(overrides?)` — один аргумент; у `Tag` НЕТ
   пропа `variant` (только `kind`/`closeable`); проверяй пропсы по `.d.ts` в node_modules.
5. **Тёмные островки кода НЕ трогать по сути:** Monaco-редактор и панель терминала
   остаются тёмными (vs-dark, фон ~#141414). Их «обрамление» (рамка/радиус/кнопки
   вокруг) — на Base Web. Кнопка «Запустить» — baseui `Button` (акцент). Вердикты:
   PASS → `theme.colors.positive`, FAIL → `theme.colors.negative`, RUN → `theme.colors.warning`.
6. **Не ломать логику:** прогон `/api/run`, `useProgress` (прогресс), заблокированная
   вкладка «Решение», загрузчики `lib/content`, роутинг — без изменений по поведению.
7. **MDX-проза** (главы/теория) рендерится как HTML с классом `.mdx` (см. `components/Mdx.tsx`).
   Перекрась прозу под тёмный Base прямо в `app/globals.css` (блок `.mdx ...`): тёмный
   фон страницы, светлый текст (`#fff`/серый), синие ссылки (accent), код в тёмной рамке.
   Это единственный разрешённый правкой файл с CSS; Tailwind-директивы вверху не трогать.
8. **Сборка:** в конце своей работы прогони `npm run build` и убедись, что проходит
   (57 страниц). НЕ удаляй Tailwind и `components/ui/*` — это сделает оркестратор.

## Качество
Чистый, дорогой Uber-Base вид: строгая сетка, типографическая иерархия Base,
плоские поверхности с границами `borderOpaque`, единственный синий акцент,
аккуратные радиусы. Внутренние страницы — строгие; лендинг (уже готов) — яркий.
