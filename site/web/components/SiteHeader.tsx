"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/ds";
import { useProgress } from "@/lib/progress";
import { useAuth } from "@/lib/auth";

/** Per-course top navigation. Keyed by the first path segment. */
const COURSE_NAV: Record<string, { href: string; label: string; match: string }[]> = {
  "go-basics": [
    { href: "/go-basics/book", label: "Учебник", match: "/go-basics/book" },
  ],
  go: [
    { href: "/go/tasks/01", label: "Тренажёр", match: "/go/tasks" },
    { href: "/go/book", label: "Учебник", match: "/go/book" },
    { href: "/go/topics", label: "Топики", match: "/go/topics" },
  ],
  os: [
    { href: "/os", label: "Обзор", match: "/os" },
    { href: "/os/sim/scheduler", label: "Симуляторы", match: "/os/sim" },
  ],
};

const TOTAL_TASKS = 32; // Go course

type CourseKey = "go-basics" | "go" | "os";

function currentCourse(pathname: string): CourseKey | null {
  // Order matters: "/go-basics" also starts with "/go", so match it first.
  if (pathname.startsWith("/go-basics")) return "go-basics";
  if (pathname.startsWith("/go")) return "go";
  if (pathname.startsWith("/os")) return "os";
  return null;
}

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useProgress(TOTAL_TASKS);
  const { user, logout } = useAuth();

  const course = currentCourse(pathname);
  const nav = course ? COURSE_NAV[course] : [];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "color-mix(in srgb, var(--bg-canvas) 82%, transparent)",
        borderBottom: "var(--border-width) solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "0 28px",
          height: "var(--header-h)",
          display: "flex",
          alignItems: "center",
          gap: 22,
        }}
      >
        <h1 style={{ margin: 0, padding: 0, fontSize: "inherit", fontWeight: "inherit", lineHeight: 0, display: "inline-flex" }}>
          <Link
            href="/"
            style={{ textDecoration: "none", display: "inline-flex" }}
            title="GraphLMS — интерактивные учебники и тренажёры по Go и операционным системам"
            aria-label="GraphLMS — на главную"
          >
            <Logo size={22} />
          </Link>
        </h1>

        {/* course breadcrumb chip → back to catalog */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-tertiary)",
            border: "var(--border-width) solid var(--border-default)",
            borderRadius: 5,
            padding: "2px 8px",
          }}
        >
          {course === "go" ? "Go" : course === "os" ? "ОС" : course === "go-basics" ? "Основы" : "Курсы"}
        </Link>

        <nav style={{ display: "flex", gap: 24, marginLeft: 2 }}>
          {nav.map((item) => {
            const active = pathname.startsWith(item.match);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  transition: "color var(--dur-fast)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}>
          {course === "go" && (
            <Link
              href="/account"
              style={{
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-tertiary)",
              }}
            >
              {count}/{TOTAL_TASKS} решено
            </Link>
          )}

          {user ? (
            <>
              <Link
                href="/account"
                title={user.email}
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  height: 34,
                  padding: "0 11px",
                  borderRadius: "var(--radius-md)",
                  border: "var(--border-width) solid var(--border-default)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12.5,
                  color: "var(--text-secondary)",
                  maxWidth: 200,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--success)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--text-tertiary)",
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <Link
              href="/go/tasks/01"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 34,
                padding: "0 13px",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-sans)",
                fontSize: 13.5,
                fontWeight: 500,
                color: "var(--accent-fg)",
                background: "var(--accent)",
              }}
            >
              Начать
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
