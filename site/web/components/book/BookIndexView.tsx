"use client";

import Link from "next/link";
import { useState } from "react";

export interface BookChapterItem {
  slug: string;
  title: string;
  minutes: number | null;
}

function TodoMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="var(--border-strong)" strokeWidth="1.5" />
    </svg>
  );
}

export function BookIndexView({
  chapters,
  basePath = "/go/book",
  title = "Конкурентность Go",
  description = "Сквозные главы-основы по конкурентности Go. Читаются линейно — от горутин и модели памяти до планировщика и боевых паттернов. Каждая связана с задачами тренажёра.",
  sectionLabel = "Основы",
  emptyHref = "/go/topics",
  emptyLabel = "топики и тренажёр",
}: {
  chapters: BookChapterItem[];
  /** Route prefix for chapter links, e.g. "/go/book" or "/go-basics/book". */
  basePath?: string;
  title?: string;
  description?: string;
  /** Label above the chapter list. */
  sectionLabel?: string;
  /** Empty-state fallback link target + label. */
  emptyHref?: string;
  emptyLabel?: string;
}) {
  return (
    <div
      style={{
        maxWidth: 880,
        margin: "0 auto",
        padding: "56px 28px 80px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--label-sm)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--accent-text)",
        }}
      >
        Учебник · {chapters.length} глав
      </span>
      <h1
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: "var(--fw-bold)",
          fontSize: "var(--heading-xl)",
          lineHeight: "var(--heading-xl-lh)",
          letterSpacing: "var(--heading-xl-ls)",
          color: "var(--text-primary)",
          margin: "14px 0 12px",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--body-lg)",
          lineHeight: "var(--body-lg-lh)",
          color: "var(--text-secondary)",
          maxWidth: 620,
          margin: "0 0 36px",
        }}
      >
        {description}
      </p>

      {chapters.length === 0 ? (
        <EmptyState href={emptyHref} label={emptyLabel} />
      ) : (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--label-xs)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "var(--text-tertiary)",
              margin: "0 0 6px",
            }}
          >
            {sectionLabel}
          </div>
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {chapters.map((c, i) => (
              <ChapterRow key={c.slug} chapter={c} index={i + 1} basePath={basePath} />
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function ChapterRow({
  chapter,
  index,
  basePath,
}: {
  chapter: BookChapterItem;
  index: number;
  basePath: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <li>
      <Link
        href={`${basePath}/${chapter.slug}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "11px 14px",
          borderRadius: "var(--radius-md)",
          textDecoration: "none",
          background: hover ? "var(--bg-hover)" : "transparent",
          transition: "background var(--dur-fast) var(--ease-out)",
        }}
      >
        <span style={{ flexShrink: 0, display: "inline-flex" }}>
          <TodoMark />
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--text-tertiary)",
            width: 22,
            flexShrink: 0,
          }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: "var(--font-sans)",
            fontSize: "var(--body-md)",
            fontWeight: "var(--fw-medium)",
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {chapter.title}
        </span>
        {chapter.minutes ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--label-sm)",
              color: "var(--text-tertiary)",
              flexShrink: 0,
            }}
          >
            {chapter.minutes} мин
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function EmptyState({ href, label }: { href: string; label: string }) {
  return (
    <div
      style={{
        marginTop: 40,
        padding: 32,
        textAlign: "center",
        background: "var(--bg-elevated)",
        border: "var(--border-width) solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-sans)",
          fontSize: "var(--body-md)",
          color: "var(--text-secondary)",
        }}
      >
        Главы учебника ещё готовятся. Загляни позже — а пока есть{" "}
        <Link
          href={href}
          style={{ color: "var(--text-link)", textDecoration: "none" }}
        >
          {label}
        </Link>
        .
      </p>
    </div>
  );
}
