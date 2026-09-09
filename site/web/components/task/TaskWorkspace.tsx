"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProgress, loadCode, saveCode, clearCode, getLearningEvents, recordLearningEvent, recordTaskAttempt, useTaskAttempts } from "@/lib/progress";
import { useInterviewSession } from "@/lib/interview";
import { apiRequest, confirmTaskPass, useAuth } from "@/lib/auth";
import { AnalyticsPreferences } from "@/components/Analytics";
import { Button, Logo } from "@/ds";
import { TaskNav } from "./TaskNav";
import { EditorPanel } from "./EditorPanel";
import { DescPanel } from "./DescPanel";
import { useGradeJob } from "./useGradeJob";
import type { NavTopic, TaskCore, TaskLearningContext, TaskNeighbour } from "./types";

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
  editorialNode,
  hasSolution,
  hints,
  course = "go",
  contentVersion,
  contentVersionDate,
  learningContext,
}: {
  task: TaskCore;
  nav: NavTopic[];
  prev: TaskNeighbour | null;
  next: TaskNeighbour | null;
  problemNode: ReactNode;
  theoryNode: ReactNode | null;
  solutionNode: ReactNode | null;
  editorialNode: ReactNode | null;
  hasSolution: boolean;
  hints: string[];
  /** Course slug — selects the grader task tree and prev/next URLs. */
  course?: string;
  /** Published version of the task contract and learning material. */
  contentVersion?: string;
  contentVersionDate?: string;
  learningContext?: TaskLearningContext;
}) {
  const router = useRouter();
  const total = useMemo(
    () => nav.reduce((n, t) => n + t.tasks.length, 0),
    [nav]
  );
  const { isSolved, markSolved } = useProgress(total, course);
  const attempts = useTaskAttempts(task.id, course);
  const { user } = useAuth();
  const interviewSession = useInterviewSession();
  const interviewMode = interviewSession && !interviewSession.endedAt && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("interview");
  const [interviewNow, setInterviewNow] = useState(() => Date.now());
  useEffect(() => {
    if (!interviewSession || interviewSession.endedAt) return;
    setInterviewNow(Date.now());
    const timer = window.setInterval(() => setInterviewNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [interviewSession]);
  const interviewRemaining = interviewSession
    ? Math.max(0, Math.ceil((new Date(interviewSession.startedAt).getTime() + interviewSession.durationSec * 1000 - interviewNow) / 1000))
    : 0;
  const solved = isSolved(task.id, course);

  const [code, setCode] = useState(task.starter);
  const attemptCodeRef = useRef(task.starter);
  const attemptTokenRef = useRef<string | null>(null);
  const recordedAttemptRef = useRef<string | null>(null);
  const reportedPassRef = useRef<string | null>(null);
  const job = useGradeJob();
  const { reset: resetJob, start: startJob } = job;
  const running = job.phase === "queued" || job.phase === "running";
  const result = job.result;
  const confirmedPassProof = job.passProof;
  const [collapsed, setCollapsed] = useState(false);

  // Load persisted code (or starter) on task change.
  useEffect(() => {
    const saved = loadCode(task.id, course);
    setCode(saved ?? task.starter);
    attemptCodeRef.current = saved ?? task.starter;
    attemptTokenRef.current = null;
    recordedAttemptRef.current = null;
    resetJob();
    recordLearningEvent("started", task.id, { courseId: course, eventId: `started:${course}:${task.id}` });
    if (!getLearningEvents().some((event) => event.type === "first_task_started")) {
      recordLearningEvent("first_task_started", `${course}:${task.id}`, { courseId: course, eventId: "first_task_started" });
    }
  }, [task.id, task.starter, course, resetJob]);

  const handleChange = useCallback(
    (v: string) => {
      setCode(v);
      attemptCodeRef.current = v;
      saveCode(task.id, v, course);
    },
    [task.id, course]
  );

  const handleReset = useCallback(() => {
    setCode(task.starter);
    attemptCodeRef.current = task.starter;
    clearCode(task.id, course);
    resetJob();
  }, [task.id, task.starter, course, resetJob]);

  const handleRun = useCallback(() => {
    if (running) return;
    attemptTokenRef.current = `${task.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    recordedAttemptRef.current = null;
    attemptCodeRef.current = code;
    recordLearningEvent("run", task.id, { courseId: course });
    startJob(task.id, course, code);
  }, [running, startJob, task.id, course, code]);

  useEffect(() => {
    if (job.phase === "done" && job.result && attemptTokenRef.current && recordedAttemptRef.current !== attemptTokenRef.current) {
      const summary = job.result.summary ? `${job.result.summary.passed}/${job.result.summary.total} тестов` : undefined;
      recordTaskAttempt({
        taskId: task.id,
        courseId: course,
        code: attemptCodeRef.current,
        passed: Boolean(job.result.pass && !job.result.error),
        durationMs: job.result.durationMs ?? 0,
        summary,
      });
      recordLearningEvent("feedback", task.id, { courseId: course });
      recordedAttemptRef.current = attemptTokenRef.current;
    }
    if (job.phase === "done" && job.result?.pass && !job.result.error) {
      markSolved(task.id, course);
      recordLearningEvent("passed", task.id, { courseId: course });
      recordLearningEvent("first_pass", task.id, { courseId: course, eventId: `first_pass:${course}:${task.id}` });
      recordLearningEvent("completed", task.id, { courseId: course, eventId: `completed:${course}:${task.id}` });
    } else if (job.phase === "done" && job.result && !job.result.pass) {
      recordLearningEvent("failed", task.id, { courseId: course });
    }
  }, [job.phase, job.result, markSolved, task.id, course]);

  useEffect(() => {
    if (!user || !confirmedPassProof || !result?.pass || result.error) return;
    const reportKey = `${course}:${task.id}:${confirmedPassProof}`;
    if (reportedPassRef.current === reportKey) return;
    reportedPassRef.current = reportKey;
    void confirmTaskPass(`${course}:${task.id}`, confirmedPassProof).then(() => apiRequest("/me/reports", {
      method: "POST",
      body: JSON.stringify({ title: `Verified skill: ${task.title}`, skills: [{ course, taskId: task.id, title: task.title, difficulty: task.type ?? "practice", passedAt: new Date().toISOString() }] }),
    }, true)).catch(() => {
      // Local completion remains valid; the notes panel explains a delayed sync.
    });
  }, [confirmedPassProof, course, result?.error, result?.pass, task.id, task.title, task.type, user]);

  return (
    <div
      className="task-shell"
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
          {interviewMode && <Link href={`/go/interview`} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginLeft: 8, padding: "4px 7px", color: interviewRemaining < 120 ? "var(--danger)" : "var(--accent-text)", border: "1px solid var(--border-default)", borderRadius: 4, font: "11px var(--font-mono)", textDecoration: "none", whiteSpace: "nowrap" }}>интервью · {String(Math.floor(interviewRemaining / 60)).padStart(2, "0")}:{String(interviewRemaining % 60).padStart(2, "0")}</Link>}
        </div>

        {/* account + prev / next */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {contentVersion && <Link href={`/changelog#v${contentVersion}`} title={contentVersionDate ? `Версия задания от ${contentVersionDate}` : "История изменений задания"} style={{ color: "var(--text-tertiary)", font: "11px var(--font-mono)", textDecoration: "none", whiteSpace: "nowrap" }}>v{contentVersion}</Link>}
          <span className="task-analytics-preferences"><AnalyticsPreferences /></span>
          <Link
            href={user ? "/account" : "/auth"}
            style={{
              color: "var(--text-secondary)",
              fontSize: 12,
              textDecoration: "none",
              whiteSpace: "nowrap",
              padding: "5px 7px",
              border: "1px solid var(--border-default)",
              borderRadius: 5,
            }}
            title={user ? "Личный кабинет" : "Войти или создать аккаунт"}
          >
            {user ? "Кабинет" : "Войти"}
          </Link>
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
      <div className="task-shell-body" style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* left navigator */}
        <aside
          className="task-left-nav"
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
        <main className="task-editor" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
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
            attempts={attempts}
            onRestoreCode={(nextCode) => {
              setCode(nextCode);
              attemptCodeRef.current = nextCode;
              saveCode(task.id, nextCode, course);
              resetJob();
            }}
          />
          {result?.pass && !result.error && (
            <section className="pass-evidence-panel" aria-labelledby="pass-evidence-title">
              <div>
                <span className="pass-evidence-kicker">VERIFIED SKILL · PASS</span>
                <h2 id="pass-evidence-title">Доказательство сохранено</h2>
                <p>Задача «{task.title}» подтверждена проверками. Это evidence для backend/system engineering, а не сертификат.</p>
                <div className="pass-evidence-checks">
                  <span>{result.summary ? `${result.summary.passed}/${result.summary.total} тестов пройдено` : "grader PASS"}</span>
                  <span>{result.race === false ? "race checks включены" : "проверка инвариантов завершена"}</span>
                </div>
              </div>
              <div className="pass-evidence-actions">
                <Link href="/account/report">Открыть skill report ↗</Link>
                <Link href="/projects">Собрать проектный артефакт ↗</Link>
                <Link href="/go/interview">Подготовиться к интервью ↗</Link>
                {next && <Link href={`/${course}/tasks/${next.slug}`}>Закрыть следующий пробел ↗</Link>}
              </div>
            </section>
          )}
        </main>

        {/* right: description tabs */}
        <aside
          className="task-description"
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
            editorialNode={editorialNode}
            hasSolution={hasSolution}
            solved={solved}
            hints={hints}
            discussionTaskId={`${course}:${task.id}`}
            learningContext={learningContext}
          />
        </aside>
      </div>
      <style>{`@media (max-width: 900px) {
        .task-shell { height: auto !important; min-height: 100vh; overflow: auto !important; }
        .task-shell-body { flex-direction: column; overflow: visible; }
        .task-left-nav { width: 100% !important; height: 180px; border-right: 0 !important; border-bottom: 1px solid var(--border-subtle); }
        .task-left-nav > div { height: 100%; }
        .task-editor { min-height: 560px; flex: none !important; }
        .task-description { width: 100% !important; min-width: 0 !important; min-height: 380px; border-left: 0 !important; border-top: 1px solid var(--border-subtle); }
      }
      @media (max-width: 560px) {
        .task-shell > header { gap: 7px !important; padding: 0 8px !important; }
        .task-shell > header > div:last-child { gap: 4px !important; }
        .task-shell > header > div:last-child a { display: none; }
        .task-analytics-preferences { display: none; }
      }`}</style>
      <style>{`.pass-evidence-panel{display:flex;justify-content:space-between;gap:20px;padding:16px 18px;border-top:1px solid rgba(57,217,138,.35);background:#101c18;color:var(--text-primary)}.pass-evidence-kicker{display:block;color:#39d98a;font:10px var(--font-mono);letter-spacing:.08em}.pass-evidence-panel h2{margin:6px 0 4px;font-size:15px}.pass-evidence-panel p{max-width:620px;margin:0;color:var(--text-secondary);font-size:12px;line-height:1.45}.pass-evidence-checks{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;color:#9ee7bc;font:11px var(--font-mono)}.pass-evidence-checks span{padding:4px 7px;border:1px solid rgba(57,217,138,.3);border-radius:4px}.pass-evidence-actions{display:flex;flex-direction:column;align-items:flex-end;gap:7px;min-width:190px}.pass-evidence-actions a{color:#9ec1ff;font-size:12px;text-decoration:none;white-space:nowrap}.pass-evidence-actions a:hover{text-decoration:underline}@media(max-width:700px){.pass-evidence-panel{flex-direction:column}.pass-evidence-actions{align-items:flex-start;min-width:0}}`}</style>
    </div>
  );
}
