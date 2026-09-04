# Goroutine — Design System

A dark-first, developer-tool design system for **goroutine.** — a web trainer for Go-concurrency interview prep. The product has three surfaces: a marketing **landing page**, an IDE-style **trainer** (Monaco editor + live `go test -race` runner), and a documentation-style **textbook**.

> Audience: backend / platform engineers (middle–senior) prepping for interviews. Technically literate, value density and speed, long keyboard-driven sessions in dark mode. UI language is **Russian**.

---

## Art direction (one paragraph)

Near-black flat surfaces, hairline borders carrying most of the hierarchy, and a single expressive accent — **Base blue `#276EF1`** — reserved for primary actions, links, and active states. Three loud semantic colors belong to the test runner and nothing else: **green PASS, red FAIL, amber TIMEOUT**. Type pairs **Geist** (a precise neutral grotesk, the Vercel/Linear register) for the interface with **Geist Mono** for code, verdicts, counts, and metadata. The vibe is a quiet, expensive developer tool — Linear / Vercel / GitHub / Uber Base — with zero "edutainment" decoration. The terminal and its verdicts are first-class elements, not afterthoughts.

**Why blue:** the brief endorsed a Base-style blue, and the source Figma (`❖ Base Gallery`) centres on `#276EF1`. It reads confidently on dark, stays distinct from all three status colors, and signals "engineering tool" rather than "course platform."

---

## Sources

- **Figma** — `❖ Base Gallery (Community).fig` (mounted virtual file). Used as the *aesthetic + token reference* (the Uber Base component gallery): the blue accent, neutral grey ramp, and semantic hues were read from its primitive scale and `METADATA.md`. We did **not** import its 157 generic component families — the product is a focused Go trainer, so the components here are purpose-built for it.
- **Product brief** — the Russian PRD describing the three surfaces, content inventory (32 tasks across 7 topics, 17 chapters), and constraints (dark-first, Monaco, `go test -race`, local progress, AA accessibility).

---

## CONTENT FUNDAMENTALS

How copy is written in this product.

- **Language:** Russian. Technical terms and Go API names stay in English/mono (`go test -race`, `sync.WaitGroup`, `context.Context`, `chan`).
- **Address:** informal **«ты»** ("Запусти тесты", "Сначала попробуй сам"). Direct, like a senior colleague — never a teacher talking down.
- **Tone:** engineering-strict, dense, no filler. "Конкурентность Go без воды." Sentences are short and load-bearing.
- **Casing:** sentence case for prose and buttons ("Запустить тесты", not "Запустить Тесты"). UPPERCASE only for verdicts (`PASS` / `FAIL` / `TIMEOUT`) and small mono eyebrows.
- **Accents in lowercase:** the wordmark is `goroutine.` (lowercase, accent period). Mono eyebrows use lowercase with letter-spacing.
- **No emoji.** Status is shown with colored dots, check glyphs, and the semantic palette — never 🎉/✅. (A check *icon* yes; an emoji no.)
- **Verbs over nouns** in CTAs: "Начать тренажёр", "Читать учебник", "К задачам", "Показать всё равно".
- **The product mantra** appears verbatim: **читай → решай → прогоняй → разбирай**.
- **Difficulty** is always lowercase English: `easy` / `medium` / `hard`. Task counts are mono: "10 задач", "6/10".
- **No spoilers in theory:** the "Теория" voice gives idioms, grabли (gotchas), and hints — never the answer. The answer lives behind the gated "Решение" tab.
- Example microcopy: empty terminal → *"Запусти тесты, чтобы увидеть вывод · ⌘↵"*; locked solution → *"Эталонный разбор откроется, когда тесты пройдут. Сначала попробуй сам."*

---

## VISUAL FOUNDATIONS

- **Color & theme.** Dark is the source of truth (`[data-theme="light"]` exists but the product ships dark). Background ladder: `--bg-canvas` (#0b0d10) → `--bg-surface` → `--bg-elevated` → `--bg-inset` (code) → `--bg-terminal` (#08090b, the darkest). The terminal stays dark even in light theme. One accent (`--accent` #276EF1), three semantics, a secondary violet for review/atomic/race accents.
- **Type.** Geist for UI, Geist Mono for code/numbers/verdicts. Compact, dense scale (body 15/24). Display sizes (40–64px) appear **only** on the landing page. Tight negative tracking on headings (-0.015 to -0.022em). Mono carries every number, count, file name, and verdict — this is a deliberate "dev" tell.
- **Spacing.** 4px base grid (`--space-*`). Generous section rhythm on the landing (80px); tight, information-dense rhythm inside the trainer (8–16px).
- **Backgrounds.** No photography, no illustration. The landing hero uses a faint dot/line **grid** masked by a radial fade plus a soft blue radial **glow** — the only decorative flourish. Everywhere else: flat solid surfaces.
- **Borders.** Hairline `1px` borders do the heavy lifting (`--border-subtle` for dividers, `--border-default` for cards, `--border-strong` for inputs/hover). This is a border-led system, not a shadow-led one.
- **Shadows / elevation.** Restrained. Cards are flat (border only); shadows appear on hover-lift and popovers/toasts. A reserved **glow** (`--glow-success` / `--glow-error`) rings the terminal on PASS/FAIL only — the one place we let color bloom.
- **Corner radii.** `--radius-sm` 6 (controls, segments), `--radius-md` 8 (buttons, inputs, code blocks), `--radius-lg` 12 (cards), pill for badges/progress.
- **Cards.** `--bg-elevated`, `1px --border-default`, 12px radius, no shadow at rest. Interactive cards lift `translateY(-2px)`, gain `--border-strong` + `--shadow-md` on hover.
- **Animation.** Quick and unfussy. `--dur-fast` 120ms for hovers/presses, `--dur-base` 180ms for panels, `--dur-slow` 280ms for progress fills. Easing `--ease-out` (cubic-bezier .22,1,.36,1). The only loop is the run spinner. Respects `prefers-reduced-motion`.
- **Hover states.** Subtle white overlay (`--bg-hover` rgba 255 .04) on neutral controls; accent buttons lighten to `--accent-hover`. Links underline on hover (2px offset).
- **Press states.** Buttons scale to `0.98` and darken to the pressed token. No bounce.
- **Focus.** Visible 2px accent ring with a canvas-colored gap (`--focus-ring`) for keyboard users — AA-visible, never removed.
- **Transparency / blur.** Sticky headers use `backdrop-filter: blur(12px)` over a `color-mix` translucent canvas. Overlays use `--bg-overlay`. Otherwise surfaces are opaque.
- **Imagery vibe.** None by design — the "imagery" of this product is **syntax-highlighted Go code** and **terminal output**. Those are styled with care (see `--code-*` tokens) and function as the hero visual.
- **Layout rules.** Trainer is a fixed full-viewport 3-pane app (collapsible left navigator, center editor+terminal, resizable right panel). Landing and textbook are centered max-width columns (1120–1200px). Min hit target 40px.

---

## ICONOGRAPHY

- **Style:** line icons in the **Lucide visual language** — 24×24 viewBox, ~2px stroke, round caps/joins, no fill (except small status seals). This matches the GitHub/Linear/Vercel register and reads crisply on dark.
- **Delivery:** icons are authored as **inline SVG** inside the components and kits (e.g. `Ic.play`, `Ic.lock`, file/book/search glyphs). They inherit `currentColor`, so they recolor with text.
- **Status markers** are custom: a filled-tint circle + check for *solved*, a dashed amber ring for *attempted*, a hairline ring for *todo*, a violet magnifier for *code-review* tasks. Difficulty is a 7px colored dot.
- **Emoji / unicode:** never used as icons. The only unicode "glyphs" are keyboard symbols in `<Kbd>` (⌘ ↵ K) and the accent period in the wordmark.
- **Substitution flag:** these inline SVGs are drawn in the Lucide style rather than imported from the Base Figma's own icon set (Base's icons are tuned for a light product and don't fit this dark dev-tool register). If you'd prefer the real Lucide set, add `<script src="https://unpkg.com/lucide@latest">` and swap — the stroke weights already match. **Tell me and I'll wire it.**

---

## INDEX / MANIFEST

Root:
- `styles.css` — global entry point (import this one file). `@import`s only.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill manifest for use in Claude Code.

Components (`components/core/`, namespace `window.GoroutineGoConcurrencyTrainerDesignSystem_634a70`):
- `Button` — accent / primary / secondary / ghost / danger; sizes; icon, loading, icon-only.
- `Badge` — status / difficulty / count pills with optional status dot.
- `Card` — flat elevated surface, optional hover-lift.
- `SegmentedControl` — tab switch with lockable segments (the Условие/Теория/Решение panel).
- `ProgressBar` — determinate track, accent/success/warning tones.
- `CodeBlock` — Go source with filename header, line numbers, line highlight; exports `highlightGo()`.
- `Terminal` — the `go test -race` console with PASS/FAIL/TIMEOUT/compile verdict header.
- `Callout` — note / tip / warning / danger врезка for the textbook.
- `TaskListItem` — navigator row (index, title, difficulty, solved state, review glyph).
- `Kbd` — keyboard shortcut chip.
- `Logo` — the `goroutine.` wordmark + channel-arrow mark.

Foundation cards (`guidelines/*.card.html`) — Colors (accent, surfaces, status, syntax), Type (headings, body/mono), Spacing (scale, radius/elevation), Brand (logo/voice). These populate the Design System tab.

UI kits (`ui_kits/`):
- `landing/index.html` — full marketing landing (hero with editor preview, metrics, 7 topics, how-it-works, textbook CTA).
- `trainer/index.html` + `trainer.jsx` — the IDE workspace; demo-scenario switcher cycles every run state (idle / running / PASS / FAIL / race / compile / timeout) and the gated solution.
- `textbook/index.html` — chapter index, chapter page (sticky TOC + prose + code + callouts + table), topic page.

All three kits cross-link to each other.
