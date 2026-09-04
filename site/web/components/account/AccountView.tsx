"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge, Button, Callout, ProgressBar } from "@/ds";
import { useProgress, useSolvedHistory } from "@/lib/progress";
import { useAuth } from "@/lib/auth";

interface TopicItem {
  num: number;
  label: string;
  taskIds: string[];
}

interface TaskItem {
  id: string;
  num: number;
  title: string;
  slug: string;
  difficulty?: string;
}

const WEEKS = 17;
const DAYS = 7;

// --- date helpers ----------------------------------------------------------

/** Local-midnight key for a date, used as the heatmap day bucket. */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function relativeDay(iso: string): string {
  const then = startOfDay(new Date(iso)).getTime();
  const today = startOfDay(new Date()).getTime();
  const diff = Math.round((today - then) / 86_400_000);
  if (diff <= 0) return "сегодня";
  if (diff === 1) return "вчера";
  if (diff < 7) return `${diff} дн. назад`;
  if (diff < 30) return `${Math.floor(diff / 7)} нед. назад`;
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

// --- heatmap tint ----------------------------------------------------------

function tint(count: number): { bg: string; border: string } {
  if (count <= 0)
    return {
      bg: "var(--bg-inset)",
      border: "var(--border-width) solid var(--border-subtle)",
    };
  if (count === 1) return { bg: "rgba(47,207,126,0.28)", border: "none" };
  if (count === 2) return { bg: "rgba(47,207,126,0.5)", border: "none" };
  if (count === 3) return { bg: "rgba(47,207,126,0.75)", border: "none" };
  return { bg: "var(--success)", border: "none" };
}

export function AccountView({
  topics,
  tasks,
  total,
}: {
  topics: TopicItem[];
  tasks: TaskItem[];
  total: number;
}) {
  const { isSolved, count, percent } = useProgress(total);
  const history = useSolvedHistory();
  const { user, logout } = useAuth();

  const byId = useMemo(() => {
    const m = new Map<string, TaskItem>();
    for (const t of tasks) m.set(t.id, t);
    return m;
  }, [tasks]);

  // Per-day solve counts derived from the local timestamp store.
  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const iso of Object.values(history)) {
      const key = dayKey(new Date(iso));
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [history]);

  // 17×7 grid ending on the current week. Columns are weeks (oldest → newest),
  // rows are weekdays (Mon → Sun).
  const grid = useMemo(() => {
    const today = startOfDay(new Date());
    const dow = (today.getDay() + 6) % 7; // 0 = Mon
    const lastMonday = addDays(today, -dow);
    const firstMonday = addDays(lastMonday, -(WEEKS - 1) * 7);
    const weeks: { key: string; count: number; future: boolean }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const col: { key: string; count: number; future: boolean }[] = [];
      for (let d = 0; d < DAYS; d++) {
        const date = addDays(firstMonday, w * 7 + d);
        const key = dayKey(date);
        col.push({
          key,
          count: dayCounts[key] ?? 0,
          future: date.getTime() > today.getTime(),
        });
      }
      weeks.push(col);
    }
    return weeks;
  }, [dayCounts]);

  const activeDays = useMemo(
    () => Object.keys(dayCounts).length,
    [dayCounts]
  );

  // Recent solves: newest first, capped to a short list.
  const recent = useMemo(() => {
    return Object.entries(history)
      .map(([id, iso]) => ({ task: byId.get(id), iso }))
      .filter((r): r is { task: TaskItem; iso: string } => Boolean(r.task))
      .sort((a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime())
      .slice(0, 8);
  }, [history, byId]);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 28px 80px" }}>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: 28 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--text-tertiary)",
          }}
        >
          Личный кабинет
        </span>
        <h1
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: "var(--fw-bold)",
            fontSize: 34,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            margin: "8px 0 6px",
          }}
        >
          Личный кабинет
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--text-tertiary)",
            margin: 0,
          }}
        >
          {user
            ? `// синхронизировано · ${user.email}`
            : "// прогресс хранится локально в этом браузере"}
        </p>
      </div>

      {/* SYNC / ACCOUNT NOTE */}
      <div style={{ marginBottom: 24 }}>
        {user ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              padding: "14px 16px",
              background: "var(--bg-elevated)",
              border: "var(--border-width) solid var(--border-default)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--success)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Прогресс синхронизируется с аккаунтом{" "}
                <b style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {user.email}
                </b>
              </span>
            </span>
            <Button hierarchy="secondary" size="sm" onClick={logout}>
              Выйти
            </Button>
          </div>
        ) : (
          <Callout tone="note" title="Локальный прогресс">
            Прогресс и код хранятся локально в этом браузере. Подключи{" "}
            <Link href="/auth" style={{ color: "var(--accent-text)" }}>
              аккаунт
            </Link>
            , чтобы синхронизировать между устройствами.
          </Callout>
        )}
      </div>

      {/* OVERALL PROGRESS */}
      <Panel title="Общий прогресс">
        <div style={{ padding: "18px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
            >
              {count}
              <span style={{ fontSize: 16, color: "var(--text-tertiary)" }}>
                /{total}
              </span>
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "var(--accent-text)",
              }}
            >
              {percent}%
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "var(--text-tertiary)",
                marginLeft: 2,
              }}
            >
              решено задач
            </span>
          </div>
          <ProgressBar value={count} max={total || 1} tone="accent" />
        </div>
      </Panel>

      {/* DASHBOARD GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 24,
          marginTop: 24,
        }}
      >
        {/* ACTIVITY HEATMAP */}
        <Panel
          title="Активность"
          aside={
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-tertiary)",
              }}
            >
              последние {WEEKS} недель
            </span>
          }
        >
          <div style={{ padding: "18px 18px 14px", overflowX: "auto" }}>
            {activeDays === 0 ? (
              <EmptyState text="Пока нет активности — реши первую задачу, и здесь появится тепловая карта." />
            ) : (
              <>
                <div style={{ display: "flex", gap: 3 }}>
                  {grid.map((col, w) => (
                    <div
                      key={w}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      {col.map((cell) => {
                        const t = tint(cell.future ? -1 : cell.count);
                        return (
                          <span
                            key={cell.key}
                            title={
                              cell.future
                                ? ""
                                : `${cell.key} · ${cell.count} решено`
                            }
                            style={{
                              width: 11,
                              height: 11,
                              borderRadius: 2,
                              background: t.bg,
                              border: t.border,
                              opacity: cell.future ? 0.4 : 1,
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 14,
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    <b style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                      {activeDays}
                    </b>{" "}
                    {activeDays === 1 ? "активный день" : "активных дней"}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    меньше
                    <LegendCell count={0} />
                    <LegendCell count={1} />
                    <LegendCell count={2} />
                    <LegendCell count={3} />
                    <LegendCell count={4} />
                    больше
                  </div>
                </div>
              </>
            )}
          </div>
        </Panel>

        {/* TOPIC PROGRESS */}
        <Panel
          title="Прогресс по топикам"
          aside={
            <Link
              href="/go/topics"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              все →
            </Link>
          }
        >
          <div style={{ padding: "6px 0" }}>
            {topics.map((t) => {
              const done = t.taskIds.filter((id) => isSolved(id)).length;
              const all = t.taskIds.length > 0 && done === t.taskIds.length;
              const color = all
                ? "var(--success-fg)"
                : done === 0
                  ? "var(--text-tertiary)"
                  : "var(--text-secondary)";
              return (
                <div
                  key={t.num}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "24px 1fr 180px 56px",
                    alignItems: "center",
                    gap: 14,
                    padding: "9px 18px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {String(t.num).padStart(2, "0")}
                  </span>
                  <Link
                    href={`/go/topics/${t.num}`}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 14,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textDecoration: "none",
                    }}
                  >
                    {t.label}
                  </Link>
                  <ProgressBar
                    value={done}
                    max={t.taskIds.length || 1}
                    tone={all ? "success" : "accent"}
                    size="sm"
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12.5,
                      color,
                      textAlign: "right",
                    }}
                  >
                    {done}/{t.taskIds.length}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* RECENT SOLVED */}
        <Panel
          title="Последние решённые"
          aside={
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-tertiary)",
              }}
            >
              go test -race
            </span>
          }
        >
          {recent.length === 0 ? (
            <div style={{ padding: "18px" }}>
              <EmptyState
                text="Пока ничего не решено — начни с тренажёра."
                cta={{ href: "/go/tasks/01", label: "Открыть тренажёр →" }}
              />
            </div>
          ) : (
            <div>
              {recent.map((r, i) => (
                <Link
                  key={r.task.id}
                  href={`/go/tasks/${r.task.slug}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 1fr auto 120px",
                    alignItems: "center",
                    gap: 14,
                    padding: "13px 18px",
                    textDecoration: "none",
                    borderTop:
                      i > 0
                        ? "var(--border-width) solid var(--border-subtle)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--success-fg)",
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--success)",
                      }}
                    />
                    PASS
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 14,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-tertiary)",
                        marginRight: 8,
                      }}
                    >
                      {String(r.task.num).padStart(2, "0")}
                    </span>
                    {r.task.title}
                  </span>
                  <span>
                    {r.task.difficulty && (
                      <Badge variant="difficulty" tone={diffTone(r.task.difficulty)} size="sm">
                        {diffTone(r.task.difficulty)}
                      </Badge>
                    )}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--text-tertiary)",
                      textAlign: "right",
                    }}
                  >
                    {relativeDay(r.iso)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

// --- small building blocks -------------------------------------------------

type DiffTone = "easy" | "medium" | "hard";
const DIFFICULTY: Record<string, DiffTone> = {
  easy: "easy",
  легко: "easy",
  medium: "medium",
  средне: "medium",
  hard: "hard",
  сложно: "hard",
};
function diffTone(d: string): DiffTone {
  return DIFFICULTY[d.toLowerCase().trim()] ?? "medium";
}

function Panel({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--bg-elevated)",
        border: "var(--border-width) solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 18px",
          borderBottom: "var(--border-width) solid var(--border-subtle)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: "var(--fw-semibold)",
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function LegendCell({ count }: { count: number }) {
  const t = tint(count);
  return (
    <span
      style={{
        width: 11,
        height: 11,
        borderRadius: 2,
        background: t.bg,
        border: t.border,
      }}
    />
  );
}

function EmptyState({
  text,
  cta,
}: {
  text: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "20px 16px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--text-tertiary)",
          margin: 0,
          maxWidth: 360,
        }}
      >
        {text}
      </p>
      {cta && (
        <Link
          href={cta.href}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: "var(--fw-medium)",
            color: "var(--accent-text)",
            textDecoration: "none",
          }}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
