"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSolvedOnly, setShowSolvedOnly] = useState(false);

  const go = (slug: string) => {
    router.push(`/${course}/tasks/${slug}`);
    onNavigate?.();
  };

  const filteredNav = useMemo(() => {
    if (!searchQuery && !showSolvedOnly) return nav;

    return nav
      .map((topic) => {
        const filteredTasks = topic.tasks.filter((t) => {
          const isActive = t.id === activeId;
          if (isActive) return true;

          const matchesSearch = !searchQuery ||
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.num.toString().includes(searchQuery);

          const matchesSolved = !showSolvedOnly || isSolved(t.id);

          return matchesSearch && matchesSolved;
        });

        return filteredTasks.length > 0
          ? { ...topic, tasks: filteredTasks }
          : null;
      })
      .filter((t): t is NavTopic => t !== null);
  }, [nav, searchQuery, showSolvedOnly, activeId, isSolved]);

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

      {/* search / filter */}
      {!collapsed && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 8px",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-elevated, var(--bg-surface))",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-tertiary)"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск задачи…"
              aria-label="Поиск задач по названию или номеру"
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "var(--label-sm)",
                fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Очистить поиск"
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--text-tertiary)",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowSolvedOnly((v) => !v)}
            aria-label={showSolvedOnly ? "Показать все задачи" : "Показать только решённые задачи"}
            aria-pressed={showSolvedOnly}
            title={showSolvedOnly ? "Показать все задачи" : "Только решённые"}
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 24,
              padding: "0 8px",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              background: showSolvedOnly ? "var(--accent-subtle)" : "transparent",
              color: showSolvedOnly ? "var(--accent-text)" : "var(--text-tertiary)",
              cursor: "pointer",
              fontSize: "var(--label-xs)",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
        </div>
      )}

      {/* grouped task list */}
      <nav
        aria-label="Навигация по задачам"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
        }}
      >
        {filteredNav.length === 0 ? (
          <div
            style={{
              padding: "16px 8px",
              textAlign: "center",
              fontSize: "var(--label-sm)",
              color: "var(--text-tertiary)",
            }}
          >
            Ничего не найдено
          </div>
        ) : (
          filteredNav.map((topic) => {
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
          })
        )}
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
