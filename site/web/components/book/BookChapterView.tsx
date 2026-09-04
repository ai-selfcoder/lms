"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import { RunnableMounter } from "@/components/play/RunnableMounter";

interface TocItem {
  slug: string;
  text: string;
  depth: number;
}

interface NavLink {
  slug: string;
  title: string;
}

interface ChapterRef {
  slug: string;
  title: string;
  index: number;
}

export function BookChapterView({
  slug,
  title,
  order,
  minutes,
  toc,
  chapters,
  prev,
  next,
  children,
  basePath = "/go/book",
  sectionLabel = "Основы",
}: {
  slug: string;
  title: string;
  order: number;
  minutes: number | null;
  toc: TocItem[];
  chapters: ChapterRef[];
  prev: NavLink | null;
  next: NavLink | null;
  children: ReactNode;
  /** Route prefix for chapter links, e.g. "/go/book" or "/go-basics/book". */
  basePath?: string;
  /** Label shown in the side-nav header and chapter meta line. */
  sectionLabel?: string;
}) {
  const order2 = String(order).padStart(2, "0");

  return (
    <div
      style={{
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "230px minmax(0,1fr) 200px",
        gap: 40,
        padding: "36px 28px 100px",
        alignItems: "start",
      }}
      className="book-chapter-grid"
    >
      {/* left chapter nav */}
      <aside style={{ position: "sticky", top: "calc(var(--header-h) + 16px)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--label-xs)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--text-tertiary)",
            padding: "0 10px",
            marginBottom: 8,
          }}
        >
          {sectionLabel}
        </div>
        {chapters.map((c) => (
          <SideLink
            key={c.slug}
            chapter={c}
            active={c.slug === slug}
            basePath={basePath}
          />
        ))}
      </aside>

      {/* content */}
      <main className="mdx-host" style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--label-sm)",
              color: "var(--text-tertiary)",
            }}
          >
            Глава {order2} · {sectionLabel}
          </span>
          {minutes ? (
            <>
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "var(--text-disabled)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--label-sm)",
                  color: "var(--text-tertiary)",
                }}
              >
                ~{minutes} мин чтения
              </span>
            </>
          ) : null}
        </div>
        <h1
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: "var(--fw-bold)",
            fontSize: "var(--heading-lg)",
            lineHeight: "var(--heading-lg-lh)",
            letterSpacing: "var(--heading-lg-ls)",
            color: "var(--text-primary)",
            margin: "0 0 28px",
          }}
        >
          {title}
        </h1>

        <div className="mdx">{children}</div>
        <RunnableMounter />

        {/* prev/next */}
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginTop: 48,
            paddingTop: 24,
            borderTop: "var(--border-width) solid var(--border-subtle)",
          }}
        >
          {prev ? (
            <PrevNext href={`${basePath}/${prev.slug}`} label="← Назад" title={prev.title} />
          ) : (
            <span style={{ flex: 1 }} />
          )}
          {next ? (
            <PrevNext
              href={`${basePath}/${next.slug}`}
              label="Дальше →"
              title={next.title}
              align="right"
            />
          ) : (
            <span style={{ flex: 1 }} />
          )}
        </nav>
      </main>

      {/* right TOC */}
      <aside style={{ position: "sticky", top: "calc(var(--header-h) + 16px)" }}>
        {toc.length > 0 && (
          <>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--label-xs)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--text-tertiary)",
                marginBottom: 10,
              }}
            >
              На этой странице
            </div>
            <nav>
              {toc.map((item, i) => (
                <TocLink key={`${item.slug}-${i}`} item={item} />
              ))}
            </nav>
          </>
        )}
      </aside>

      <style>{`
        @media (max-width: 1080px) {
          .book-chapter-grid { grid-template-columns: minmax(0,1fr) !important; }
          .book-chapter-grid > aside { display: none; }
        }
      `}</style>
    </div>
  );
}

function SideLink({
  chapter,
  active,
  basePath,
}: {
  chapter: ChapterRef;
  active: boolean;
  basePath: string;
}) {
  const [hover, setHover] = useState(false);
  const bg = active
    ? "var(--accent-subtle)"
    : hover
      ? "var(--bg-hover)"
      : "transparent";
  return (
    <Link
      href={`${basePath}/${chapter.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "6px 10px",
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-sans)",
        fontSize: 13.5,
        color: active || hover ? "var(--text-primary)" : "var(--text-secondary)",
        textDecoration: "none",
        background: bg,
        transition: "background var(--dur-fast) var(--ease-out)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-tertiary)",
          flexShrink: 0,
        }}
      >
        {String(chapter.index).padStart(2, "0")}
      </span>
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {chapter.title}
      </span>
    </Link>
  );
}

function TocLink({ item }: { item: TocItem }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={`#${item.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block",
        padding: `5px 0 5px ${item.depth === 3 ? 24 : 12}px`,
        fontFamily: "var(--font-sans)",
        fontSize: 13,
        color: hover ? "var(--text-secondary)" : "var(--text-tertiary)",
        textDecoration: "none",
        borderLeft: "2px solid var(--border-subtle)",
        transition: "color var(--dur-fast) var(--ease-out)",
      }}
    >
      {item.text}
    </a>
  );
}

function PrevNext({
  href,
  label,
  title,
  align = "left",
}: {
  href: string;
  label: string;
  title: string;
  align?: "left" | "right";
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        textDecoration: "none",
        textAlign: align,
        maxWidth: "48%",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--label-sm)",
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--body-md)",
          fontWeight: "var(--fw-semibold)",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </span>
    </Link>
  );
}
