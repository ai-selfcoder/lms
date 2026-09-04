"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, ProgressBar } from "@/ds";
import { readReadingState } from "@/components/book/readingProgress";

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

function DoneMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="var(--success-fg)" strokeWidth="1.5" />
      <path
        d="m8.5 12.5 2.5 2.5 4.5-5"
        stroke="var(--success-fg)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  const visited = useVisitedChapters(basePath);
  const visitedSet = new Set(visited);
  const visitedCount = chapters.filter((c) => visitedSet.has(c.slug)).length;
  const lastSlug = useLastChapter(basePath);
  const lastChapter =
    lastSlug && chapters.some((c) => c.slug === lastSlug)
      ? chapters.find((c) => c.slug === lastSlug)!
      : null;
  const resumeTarget = lastChapter ?? (chapters.length ? chapters[0] : null);

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
          {/* resume / progress card */}
          {visitedCount > 0 && resumeTarget ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                flexWrap: "wrap",
                padding: "16px 18px",
                background: "var(--bg-elevated)",
                border: "var(--border-width) solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
                marginBottom: 28,
              }}
            >
              <div style={{ flex: 1, minWidth: 220 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--label-xs)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "var(--text-tertiary)",
                    margin: "0 0 8px",
                  }}
                >
                  Прогресс чтения · {visitedCount}/{chapters.length}
                </div>
                <ProgressBar
                  value={visitedCount}
                  max={chapters.length}
                  tone={visitedCount === chapters.length ? "success" : "accent"}
                  size="sm"
                />
              </div>
              {visitedCount < chapters.length ? (
                <Link href={`${basePath}/${resumeTarget.slug}`}>
                  <Button hierarchy="accent" size="md" iconRight={<ArrowRight />}>
                    Продолжить
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : null}

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
              <ChapterRow
                key={c.slug}
                chapter={c}
                index={i + 1}
                basePath={basePath}
                visited={visitedSet.has(c.slug)}
              />
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
  visited,
}: {
  chapter: BookChapterItem;
  index: number;
  basePath: string;
  visited: boolean;
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
          {visited ? <DoneMark /> : <TodoMark />}
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

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Reactive set of visited chapter slugs for a course basePath. */
function useVisitedChapters(basePath: string): string[] {
  const [visited, setVisited] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setVisited(readReadingState(basePath).visited);
    sync();
    const onStorage = () => sync();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [basePath]);
  return visited;
}

/** Slug of the last opened chapter (null on server / before first visit). */
function useLastChapter(basePath: string): string | null {
  const [last, setLast] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => setLast(readReadingState(basePath).last);
    sync();
    const onStorage = () => sync();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [basePath]);
  return last;
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
