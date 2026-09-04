"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProgress } from "@/lib/progress";
import { TaskListItem, ProgressBar, Logo, Kbd } from "@/ds";
import type { NavTopic, Difficulty } from "./types";

export function TaskNav({
  nav,
  activeId,
  total,
  collapsed,
  onNavigate,
  course = "go",
}: {
  nav: NavTopic[];
  activeId: string;
  total: number;
  collapsed: boolean;
  onNavigate?: () => void;
  course?: string;
}) {
  const router = useRouter();
  const { isSolved, count, percent } = useProgress(total);

  const go = (slug: string) => {
    router.push(`/${course}/tasks/${slug}`);
    onNavigate?.();
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        flexDirection: "column",
        background: "var(--bg-surface)",
      }}
    >
      {/* header / brand */}
      <div
        style={{
          flexShrink: 0,
          height: 48,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: collapsed ? "0 10px" : "0 14px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {collapsed ? (
          <Link href="/" aria-label="GraphLMS" style={{ display: "inline-flex" }}>
            <Logo size={22} showWordmark={false} />
          </Link>
        ) : (
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex" }}>
            <Logo size={20} />
          </Link>
        )}
      </div>

      {/* progress */}
      {!collapsed && (
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: "var(--label-md)", color: "var(--text-secondary)" }}>
              Прогресс
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--label-md)",
                color: "var(--accent-text)",
                fontWeight: "var(--fw-semibold)",
              }}
            >
              {count}/{total}
            </span>
          </div>
          <ProgressBar value={percent} max={100} tone="accent" size="md" />
        </div>
      )}

      {/* grouped task list */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
        }}
      >
        {nav.map((topic) => {
          const review = topic.tasks.some((t) => t.type === "review");
          return (
            <div key={topic.num} style={{ marginBottom: collapsed ? 6 : 10 }}>
              {collapsed ? (
                <div
                  style={{
                    height: 1,
                    background: "var(--border-subtle)",
                    margin: "4px 6px",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 8px 4px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--label-xs)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {String(topic.num).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--label-sm)",
                      fontWeight: "var(--fw-semibold)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {topic.label}
                  </span>
                  {review && (
                    <span style={{ marginLeft: "auto", display: "inline-flex" }}>
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--violet-400)"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </span>
                  )}
                </div>
              )}

              {topic.tasks.map((t) => {
                const solved = isSolved(t.id);
                const active = t.id === activeId;
                const status: "solved" | "active" | "todo" = solved
                  ? "solved"
                  : "todo";
                return (
                  <TaskListItem
                    key={t.id}
                    index={t.num}
                    title={t.title}
                    difficulty={(t.difficulty ?? "medium") as Difficulty}
                    status={status}
                    type={t.type === "review" ? "review" : "functional"}
                    active={active}
                    collapsed={collapsed}
                    onClick={() => go(t.slug)}
                  />
                );
              })}
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 42,
            padding: "0 14px",
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "var(--label-sm)",
            color: "var(--text-tertiary)",
          }}
        >
          <span>Тренажёр</span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--label-xs)",
            }}
          >
            {total} задач
          </span>
          <Kbd>⌘</Kbd>
          <Kbd>↵</Kbd>
        </div>
      )}
    </div>
  );
}
