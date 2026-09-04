---
name: goroutine-design
description: Use this skill to generate well-branded interfaces and assets for goroutine. — a dark-first, developer-tool web trainer for Go-concurrency interview prep — either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **Brand:** `goroutine.` — Go-concurrency interview trainer. Three surfaces: landing, IDE-style trainer, technical textbook. UI language is **Russian**, audience is middle–senior backend engineers.
- **Theme:** dark-first. Near-black flat surfaces, hairline borders, one accent (**Base blue `#276EF1`**), three status colors (green PASS / red FAIL / amber TIMEOUT).
- **Type:** Geist (UI grotesk) + Geist Mono (code, verdicts, counts). Loaded via `tokens/fonts.css` (Google Fonts).
- **Tone:** engineering-strict, dense, no filler, no emoji, informal «ты». Mantra: *читай → решай → прогоняй → разбирай*.

## Files

- `styles.css` — link this one file; it `@import`s all tokens + base. Everything keys off CSS custom properties (`--accent`, `--bg-canvas`, `--text-primary`, `--success`, `--code-*`, `--space-*`, `--radius-*`, …).
- `tokens/` — colors, typography, spacing/radius/shadow/motion, fonts, base reset.
- `components/core/` — React primitives (`Button`, `Badge`, `Card`, `SegmentedControl`, `ProgressBar`, `CodeBlock`, `Terminal`, `Callout`, `TaskListItem`, `Kbd`, `Logo`). Compiled to a bundle exposed on `window.GoroutineGoConcurrencyTrainerDesignSystem_634a70`. The card HTML in that folder shows usage.
- `ui_kits/` — full-screen recreations: `landing/`, `trainer/` (IDE with all run states), `textbook/`. Copy these as starting points for new screens.
- `guidelines/` — foundation specimen cards.

## How to build with it

1. Link `styles.css`. Default to dark (no attribute needed); add `data-theme="light"` on a scope only if asked.
2. Reuse tokens — never invent colors. Accent for primary action/links/active only; status colors for the runner only.
3. Code and terminal output are the hero imagery — style them with `--code-*` and the `Terminal`/`CodeBlock` patterns. Use `highlightGo()` from `CodeBlock.jsx` for Go syntax.
4. Mono for all numbers, counts, file names, shortcuts (`<Kbd>`), and verdicts.
5. No emoji, no illustration. Decoration budget = one faint grid + one blue glow on the landing hero.
6. Keep AA contrast, visible focus rings, ≥40px hit targets.
