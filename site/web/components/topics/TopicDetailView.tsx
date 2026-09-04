"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ProgressBar, Button } from "@/ds";
import type { TaskMeta } from "@/lib/content";
import { TaskCard } from "@/components/TaskCard";
import { useProgress } from "@/lib/progress";

interface NavTopic {
  num: number;
  label: string;
}

export function TopicDetailView({
  num,
  label,
  tasks,
  hasIntro,
  prev,
  next,
  children,
}: {
  num: number;
  label: string;
  tasks: TaskMeta[];
  hasIntro: boolean;
  prev: NavTopic | null;
  next: NavTopic | null;
  children: ReactNode;
}) {
  const num2 = String(num).padStart(2, "0");
  const firstTask = tasks[0];

  return (
    <div
      className="topic-detail-root"
      style={{ maxWidth: 860, margin: "0 auto", padding: "48px 28px 90px" }}
    >
      {/* breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Link
          href="/go/topics"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--label-sm)",
            color: "var(--text-secondary)",
            textDecoration: "none",
          }}
        >
          Топики
        </Link>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-disabled)"
          strokeWidth="2"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--label-sm)",
            color: "var(--text-tertiary)",
          }}
        >
          Топик {num2}
        </span>
      </div>

      <h1
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: "var(--fw-bold)",
          fontSize: "var(--heading-lg)",
          lineHeight: "var(--heading-lg-lh)",
          letterSpacing: "var(--heading-lg-ls)",
          color: "var(--text-primary)",
          margin: "0 0 14px",
        }}
      >
        {label}
      </h1>

      {/* progress + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0 36px" }}>
        <TopicProgressHeader tasks={tasks} />
        {firstTask && (
          <Link href={`/go/tasks/${firstTask.slug}`} style={{ marginLeft: "auto" }}>
            <Button hierarchy="accent" size="md" iconRight={<ArrowRight />}>
              К задачам
            </Button>
          </Link>
        )}
      </div>

      {/* intro body */}
      {hasIntro ? (
        <div className="mdx">{children}</div>
      ) : (
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--body-md)",
            lineHeight: "var(--body-md-lh)",
            color: "var(--text-secondary)",
            margin: "0 0 8px",
          }}
        >
          Вводная глава к топику ещё готовится. Задачи уже доступны ниже.
        </p>
      )}

      {/* tasks */}
      <h2
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: "var(--fw-semibold)",
          fontSize: "var(--heading-sm)",
          lineHeight: "var(--heading-sm-lh)",
          letterSpacing: "var(--heading-sm-ls)",
          color: "var(--text-primary)",
          margin: "44px 0 16px",
        }}
      >
        Задачи топика{" "}
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
          {tasks.length}
        </span>
      </h2>
      <div style={{ display: "grid", gap: 10 }}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* prev/next */}
      <nav
        className="topic-detail-nav"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 56,
          paddingTop: 24,
          borderTop: "var(--border-width) solid var(--border-subtle)",
        }}
      >
        {prev ? (
          <PrevNext
            href={`/go/topics/${prev.num}`}
            label={`← Топик ${String(prev.num).padStart(2, "0")}`}
            title={prev.label}
          />
        ) : (
          <span style={{ flex: 1 }} />
        )}
        {next ? (
          <PrevNext
            href={`/go/topics/${next.num}`}
            label={`Топик ${String(next.num).padStart(2, "0")} →`}
            title={next.label}
            align="right"
          />
        ) : (
          <span style={{ flex: 1 }} />
        )}
      </nav>

      <style>{`
        @media (max-width: 640px) {
          .topic-detail-root {
            padding-bottom: 120px !important;
          }
          .topic-detail-nav {
            position: fixed !important;
            bottom: 0;
            left: 0;
            right: 0;
            margin: 0 !important;
            padding: 12px 16px !important;
            background: var(--bg-elevated);
            border-top: var(--border-width) solid var(--border-default);
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
            z-index: 100;
          }
          .topic-detail-nav-link {
            max-width: 48% !important;
            min-width: 0 !important;
          }
          .topic-detail-nav-link span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}

function TopicProgressHeader({ tasks }: { tasks: TaskMeta[] }) {
  const { isSolved } = useProgress();
  const done = tasks.filter((t) => isSolved(t.id)).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const tone = done > 0 && done === tasks.length ? "success" : "accent";
  const labelColor = tone === "success" ? "var(--success-fg)" : "var(--accent-text)";

  return (
    <div style={{ flex: 1, maxWidth: 300 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--label-sm)",
            color: "var(--text-secondary)",
          }}
        >
          {done}/{tasks.length} решено
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--label-sm)",
            color: labelColor,
          }}
        >
          {pct}%
        </span>
      </div>
      <ProgressBar value={done} max={tasks.length || 1} tone={tone} />
    </div>
  );
}

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
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
      className="topic-detail-nav-link"
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
