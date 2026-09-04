"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProgress, loadCode, saveCode, clearCode } from "@/lib/progress";
import { Button, Logo } from "@/ds";
import { TaskNav } from "./TaskNav";
import { EditorPanel } from "./EditorPanel";
import { DescPanel } from "./DescPanel";
import { useGradeJob } from "./useGradeJob";
import type { NavTopic, TaskCore, TaskNeighbour } from "./types";

const ChevL = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const ChevR = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const PanelIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </svg>
);

export function TaskWorkspace({
  task,
  nav,
  prev,
  next,
  problemNode,
  theoryNode,
  solutionNode,
  hasSolution,
  hints,
  course = "go",
}: {
  task: TaskCore;
  nav: NavTopic[];
  prev: TaskNeighbour | null;
  next: TaskNeighbour | null;
  problemNode: ReactNode;
  theoryNode: ReactNode | null;
  solutionNode: ReactNode | null;
  hasSolution: boolean;
  hints: string[];
  /** Course slug — selects the grader task tree and prev/next URLs. */
  course?: string;
}) {
  const router = useRouter();
  const total = useMemo(
    () => nav.reduce((n, t) => n + t.tasks.length, 0),
    [nav]
  );
  const { isSolved, markSolved } = useProgress(total);
  const solved = isSolved(task.id);

  const [code, setCode] = useState(task.starter);
  const job = useGradeJob();
  const running = job.phase === "queued" || job.phase === "running";
  const result = job.result;
  const [collapsed, setCollapsed] = useState(false);

  // Load persisted code (or starter) on task change.
  useEffect(() => {
    const saved = loadCode(task.id);
    setCode(saved ?? task.starter);
    job.reset();
  }, [task.id, task.starter, job.reset]);

  const handleChange = useCallback(
    (v: string) => {
      setCode(v);
      saveCode(task.id, v);
    },
    [task.id]
  );

  const handleReset = useCallback(() => {
    setCode(task.starter);
    clearCode(task.id);
    job.reset();
  }, [task.id, task.starter, job.reset]);

  const handleRun = useCallback(() => {
    if (running) return;
    job.start(task.id, course, code);
  }, [running, job.start, task.id, course, code]);

  useEffect(() => {
    if (job.phase === "done" && job.result?.pass && !job.result.error) {
      markSolved(task.id);
    }
  }, [job.phase, job.result, markSolved, task.id]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--bg-canvas)",
        color: "var(--text-primary)",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          height: 48,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 14px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
        }}
      >
        <Button
          hierarchy="ghost"
          size="sm"
          iconOnly
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Список задач"
          title="Список задач"
        >
          {PanelIcon}
        </Button>

        <Link href="/" aria-label="GraphLMS" style={{ display: "inline-flex" }}>
          <Logo size={22} showWordmark={false} />
        </Link>

        {/* breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--label-sm)",
              color: "var(--text-tertiary)",
              whiteSpace: "nowrap",
            }}
          >
            {task.topic}
          </span>
          <span style={{ display: "inline-flex", color: "var(--text-disabled)" }}>
            {ChevR}
          </span>
          <span
            style={{
              fontSize: "var(--label-md)",
              fontWeight: "var(--fw-semibold)",
              color: "var(--text-primary)",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", marginRight: 6 }}>
              {String(task.num).padStart(2, "0")}
            </span>
            {task.title}
          </span>
          {solved && (
            <span style={{ display: "inline-flex", flexShrink: 0 }} title="Решено">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="var(--success)" opacity="0.16" />
                <path
                  d="M7.5 12.5l3 3 6-6.5"
                  stroke="var(--success)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </div>

        {/* prev / next */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {prev ? (
            <Button
              hierarchy="secondary"
              size="sm"
              iconOnly
              onClick={() => router.push(`/${course}/tasks/${prev.slug}`)}
              title={`${prev.num}. ${prev.title}`}
              aria-label="Назад"
            >
              {ChevL}
            </Button>
          ) : (
            <Button hierarchy="secondary" size="sm" iconOnly disabled aria-label="Назад">
              {ChevL}
            </Button>
          )}
          {next ? (
            <Button
              hierarchy="secondary"
              size="sm"
              iconOnly
              onClick={() => router.push(`/${course}/tasks/${next.slug}`)}
              title={`${next.num}. ${next.title}`}
              aria-label="Дальше"
            >
              {ChevR}
            </Button>
          ) : (
            <Button hierarchy="secondary" size="sm" iconOnly disabled aria-label="Дальше">
              {ChevR}
            </Button>
          )}
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* left navigator */}
        <aside
          style={{
            width: collapsed ? 56 : 300,
            flexShrink: 0,
            borderRight: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            transition: "width var(--dur-base) var(--ease-out)",
            overflow: "hidden",
          }}
        >
          <TaskNav
            nav={nav}
            activeId={task.id}
            total={total}
            collapsed={collapsed}
            course={course}
            onNavigate={() => {
              if (typeof window !== "undefined" && window.innerWidth < 900)
                setCollapsed(true);
            }}
          />
        </aside>

        {/* center: editor + terminal */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <EditorPanel
            code={code}
            onChange={handleChange}
            onRun={handleRun}
            onReset={handleReset}
            running={running}
            result={result}
            taskId={task.id}
            taskTitle={task.title}
            taskType={task.type}
            queue={job.phase === "queued" ? { position: job.position, queueLength: job.queueLength } : null}
          />
        </main>

        {/* right: description tabs */}
        <aside
          style={{
            width: 380,
            flexShrink: 0,
            minWidth: 300,
            borderLeft: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
          }}
        >
          <DescPanel
            taskId={task.id}
            problemNode={problemNode}
            theoryNode={theoryNode}
            solutionNode={solutionNode}
            hasSolution={hasSolution}
            solved={solved}
            hints={hints}
          />
        </aside>
      </div>
    </div>
  );
}
