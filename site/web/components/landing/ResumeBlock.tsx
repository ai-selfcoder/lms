"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress";

/**
 * "Recommended next step / resume" block for the home page.
 *
 * Reads local solve progress (localStorage via useProgress) and turns the
 * static "Открыть тренажёр" CTA into a context-aware one:
 *   - first visit (no solves)  → "Начать с задачи 01"
 *   - in progress              → "Продолжить" pointing at the first unsolved task
 *   - everything solved        → congratulation + pointer back into the book
 *
 * Server-safe: useProgress starts with an empty set and syncs in an effect,
 * so SSR markup and the first client render agree (same pattern as SiteHeader).
 */

export interface ResumeTask {
  id: string;
  num: number;
  slug: string;
  title: string;
}

const ArrowIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const CheckIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export function ResumeBlock({ tasks, bookHref = "/go/book" }: { tasks: ResumeTask[]; bookHref?: string }) {
  const { isSolved, count } = useProgress(tasks.length);

  const next = tasks.find((t) => !isSolved(t.id)) ?? null;
  const done = tasks.length > 0 && count >= tasks.length;
  const started = count > 0;
  const percent = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;

  // First render / no tasks → neutral "start" state (matches SSR markup).
  const href = done ? bookHref : next ? `/go/tasks/${next.slug}` : `/go/tasks/${tasks[0]?.slug ?? "01"}`;
  const cta = done ? "К учебнику" : started ? "Продолжить" : "Начать тренажёр";
  const heading = done ? "Курс пройден" : started ? "Продолжить с задачи" : "Начните здесь";
  const title = done ? "Все задачи тренажёра решены — самое время перечитать теорию или заглянуть в топики." : next ? next.title : "";

  return (
    <section
      aria-label="Рекомендованный следующий шаг"
      className="resume-card"
      style={{
        marginTop: 28,
        border: "var(--border-width) solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-elevated)",
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      {/* left: status + next target */}
      <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}>
          <span
            aria-hidden="true"
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: done ? "var(--success)" : started ? "var(--accent)" : "var(--border-strong)",
              color: done || started ? "var(--accent-fg)" : "var(--text-tertiary)",
            }}
          >
            {done ? <CheckIcon size={11} /> : <ArrowIcon size={11} />}
          </span>
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)" }}
          >
            {heading}
            {next && !done ? ` ${String(next.num).padStart(2, "0")}` : ""}
          </span>
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-.01em",
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={title}
        >
          {title || "Первая задача тренажёра по конкурентности Go"}
        </div>

        {/* progress — only meaningful once the user has solved something */}
        {tasks.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={tasks.length}
              aria-valuenow={count}
              aria-label={`Решено задач: ${count} из ${tasks.length}`}
              style={{ flex: 1, maxWidth: 180, height: 4, borderRadius: 2, background: "var(--border-subtle)", overflow: "hidden" }}
            >
              <div style={{ width: `${percent}%`, height: "100%", background: "var(--accent)", transition: "width var(--dur-base) var(--ease-out)" }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-tertiary)", flexShrink: 0 }}>
              {count}/{tasks.length}
            </span>
          </div>
        )}
      </div>

      {/* right: the single primary action */}
      <Link
        href={href}
        aria-label={`${cta}${next && !done ? ` — задача ${String(next.num).padStart(2, "0")}: ${next.title}` : ""}`}
        style={{
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 40,
          padding: "0 16px",
          borderRadius: "var(--radius-md)",
          fontSize: 14,
          fontWeight: 500,
          flexShrink: 0,
          background: "var(--accent)",
          color: "var(--accent-fg)",
        }}
      >
        {cta}
        <ArrowIcon />
      </Link>
    </section>
  );
}
