"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, ProgressBar } from "@/ds";
import { getTaskAttempts, recordLearningEvent, useLearningEvents, useProgress } from "@/lib/progress";
import { useProjectArtifacts, type ProjectArtifact } from "@/lib/projectArtifacts";

interface ReportTask {
  id: string;
  courseId: string;
  num: number;
  title: string;
  slug: string;
  difficulty?: string;
}

interface ReportTopic {
  courseId: string;
  num: number;
  label: string;
  taskIds: string[];
}

interface ReportCourse {
  id: string;
  title: string;
  short: string;
  tasks: ReportTask[];
  topics: ReportTopic[];
}

interface SharedReport {
  solved: string[];
  runs: number;
  feedback: number;
  chapters: number;
  labs: number;
  createdAt: string;
  projectArtifacts: ProjectArtifact[];
}

export function ReportView({ courses, tasks, topics }: { courses?: ReportCourse[]; tasks?: ReportTask[]; topics?: ReportTopic[] }) {
  const reportCourses = courses ?? [{ id: "go", title: "Конкурентность Go", short: "Go", tasks: tasks ?? [], topics: topics ?? [] }];
  const goTasks = reportCourses.find((course) => course.id === "go")?.tasks ?? [];
  const basicsTasks = reportCourses.find((course) => course.id === "go-basics")?.tasks ?? [];
  const osTasks = reportCourses.find((course) => course.id === "os")?.tasks ?? [];
  const { solved: goSolved } = useProgress(goTasks.length, "go");
  const { solved: basicsSolved } = useProgress(basicsTasks.length, "go-basics");
  const { solved: osSolved } = useProgress(osTasks.length, "os");
  const events = useLearningEvents();
  const projectArtifacts = useProjectArtifacts();
  const [shared, setShared] = useState<SharedReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [careerGoal, setCareerGoal] = useState("go");

  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get("data");
    try {
      setCareerGoal(window.localStorage.getItem("graphlms.goal.v1") ?? "go");
    } catch {
      // Private browsing can deny storage access; the default route remains valid.
    }
    if (!encoded) return;
    try {
      const parsed = JSON.parse(atob(decodeURIComponent(encoded))) as Partial<SharedReport>;
      if (!Array.isArray(parsed.solved)) return;
      setShared({
        solved: parsed.solved.filter((id): id is string => typeof id === "string"),
        runs: typeof parsed.runs === "number" ? parsed.runs : 0,
        feedback: typeof parsed.feedback === "number" ? parsed.feedback : 0,
        chapters: typeof parsed.chapters === "number" ? parsed.chapters : 0,
        labs: typeof parsed.labs === "number" ? parsed.labs : 0,
        createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : "",
        projectArtifacts: Array.isArray(parsed.projectArtifacts) ? parsed.projectArtifacts.filter((item): item is ProjectArtifact => Boolean(item) && typeof item.trackId === "string" && (item.status === "draft" || item.status === "verified") && typeof item.evidence === "string" && typeof item.updatedAt === "string") : [],
      });
    } catch {
      // A malformed or truncated link simply falls back to the local report.
    }
  }, []);

  const localStats = useMemo(() => ({
    runs: events.filter((event) => event.type === "run").length,
    feedback: events.filter((event) => event.type === "passed" || event.type === "failed").length,
    chapters: new Set(events.filter((event) => event.type === "started" && event.itemId.includes(":chapter:")).map((event) => event.itemId)).size,
    labs: new Set(events.filter((event) => event.type === "started" && event.itemId.includes(":lab:")).map((event) => event.itemId)).size,
  }), [events]);
  const localSolved = useMemo(() => new Set([
    ...[...goSolved].map((id) => `go:${id}`),
    ...[...basicsSolved].map((id) => `go-basics:${id}`),
    ...[...osSolved].map((id) => `os:${id}`),
  ]), [goSolved, basicsSolved, osSolved]);
  const solvedIds = useMemo(() => {
    if (!shared) return localSolved;
    // Older links stored bare Go task IDs. Treat those as Go IDs while using
    // canonical course:id values for the multi-course report.
    return new Set(shared.solved.map((id) => id.includes(":") ? id : `go:${id}`));
  }, [localSolved, shared]);
  const stats = shared ?? { ...localStats, createdAt: "", projectArtifacts };
  const reportArtifacts = shared ? shared.projectArtifacts : projectArtifacts;
  const allTasks = reportCourses.flatMap((course) => course.tasks);
  const knownSolved = allTasks.filter((task) => solvedIds.has(`${task.courseId}:${task.id}`));
  const percent = allTasks.length ? Math.round((knownSolved.length / allTasks.length) * 100) : 0;
  useEffect(() => {
    if (!shared) recordLearningEvent("report_created", "skill-report", { eventId: "report_created:local" });
  }, [shared]);

  const share = async () => {
    const payload: SharedReport = {
      solved: allTasks.filter((task) => solvedIds.has(`${task.courseId}:${task.id}`)).map((task) => `${task.courseId}:${task.id}`),
      ...localStats,
      projectArtifacts,
      createdAt: new Date().toISOString(),
    };
    const url = `${window.location.origin}/account/report?data=${encodeURIComponent(btoa(JSON.stringify(payload)))}`;
    recordLearningEvent("report_shared", "skill-report", { eventId: `report_shared:${Date.now()}` });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Ссылка на skill report", url);
    }
  };

  return (
    <main className="report-page" style={{ maxWidth: 900, margin: "0 auto", padding: "48px 28px 84px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap", marginBottom: 34 }}>
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".1em", color: "var(--text-tertiary)" }}>GRAPH / SKILL REPORT</span>
          <h1 style={{ margin: "10px 0 8px", fontSize: 36, letterSpacing: "-.03em", color: "var(--text-primary)" }}>Доказательство навыка</h1>
          <p style={{ margin: 0, maxWidth: 580, color: "var(--text-secondary)", lineHeight: 1.6 }}>{shared ? "Публичный отчёт GraphLMS без исходного кода решений." : "Собери компактный отчёт о практике, который можно показать коллегам или на собеседовании."}</p>
        </div>
        {!shared && <Button hierarchy="accent" size="md" onClick={share}>{copied ? "Ссылка скопирована" : "Скопировать ссылку"}</Button>}
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "1.3fr repeat(4, 1fr)", gap: 10, marginBottom: 28 }} className="report-stats">
        <div style={{ padding: "18px", border: "1px solid var(--border-default)", borderRadius: 7, background: "var(--bg-elevated)" }}><span style={{ display: "block", font: "11px var(--font-mono)", color: "var(--text-tertiary)" }}>РЕШЕНО</span><strong style={{ display: "block", marginTop: 9, font: "600 30px var(--font-mono)", color: "var(--text-primary)" }}>{knownSolved.length}<small style={{ fontSize: 14, color: "var(--text-tertiary)" }}>/{allTasks.length}</small></strong><ProgressBar value={knownSolved.length} max={allTasks.length || 1} tone="accent" size="sm" /></div>
        <ReportStat label="процент" value={`${percent}%`} />
        <ReportStat label="запуски" value={stats.runs} />
        <ReportStat label="проверки" value={stats.feedback} />
        <ReportStat label="лабы" value={stats.labs} />
      </section>

      <section className="report-identity"><div><span>КАРЬЕРНАЯ СВЯЗЬ</span><strong>Backend / system engineering</strong><p>PASS подтверждает конкретный инженерный цикл: prerequisite → runnable-задача → тесты и инварианты → обратная связь.</p></div><div><span>СТАТУС ДОКУМЕНТА</span><strong>Verified skill report</strong><p>Не сертификат и не обещание оффера. Исходный код по умолчанию не публикуется.</p></div></section>

      <section style={{ border: "1px solid var(--border-default)", borderRadius: 7, overflow: "hidden", background: "var(--bg-elevated)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)" }}><h2 style={{ margin: 0, fontSize: 15, color: "var(--text-primary)" }}>Навыки и практика</h2></div>
        {reportCourses.map((course) => <div key={course.id}>
          <div style={{ padding: "14px 18px 8px", color: "var(--text-secondary)", font: "11px var(--font-mono)", letterSpacing: ".06em" }}>{course.title.toUpperCase()}</div>
          {course.topics.map((topic, index) => {
            const done = topic.taskIds.filter((id) => solvedIds.has(`${topic.courseId}:${id}`)).length;
            return <div key={`${topic.courseId}:${topic.num}`} style={{ display: "grid", gridTemplateColumns: "32px minmax(0, 1fr) 180px 48px", alignItems: "center", gap: 14, padding: "13px 18px", borderTop: index || course.id !== reportCourses[0].id ? "1px solid var(--border-subtle)" : "none" }}><span style={{ font: "12px var(--font-mono)", color: "var(--text-tertiary)" }}>{String(topic.num).padStart(2, "0")}</span><span style={{ color: "var(--text-primary)", fontSize: 14 }}>{topic.label}</span><ProgressBar value={done} max={topic.taskIds.length || 1} tone={done === topic.taskIds.length && done > 0 ? "success" : "accent"} size="sm" /><span style={{ font: "12px var(--font-mono)", color: "var(--text-tertiary)", textAlign: "right" }}>{done}/{topic.taskIds.length}</span></div>;
          })}
          {course.topics.length === 0 && <div style={{ padding: "10px 18px 16px", color: "var(--text-tertiary)", fontSize: 13 }}>Практических задач пока нет — прогресс глав и лабораторий виден в событиях.</div>}
        </div>)}
      </section>

      <section style={{ marginTop: 28 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 12 }}><h2 style={{ margin: 0, fontSize: 15, color: "var(--text-primary)" }}>Артефакты</h2><span style={{ font: "12px var(--font-mono)", color: "var(--text-tertiary)" }}>{reportArtifacts.length} проектных · {stats.chapters} глав · {stats.labs} лабораторий</span></div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{reportArtifacts.map((artifact) => <Link key={artifact.trackId} href="/projects" style={{ display: "inline-flex", flexDirection: "column", gap: 4, maxWidth: 320, padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: 6, textDecoration: "none", color: "var(--text-secondary)", fontSize: 13 }}><span style={{ font: "11px var(--font-mono)", color: artifact.status === "verified" ? "var(--success-fg)" : "var(--accent-text)" }}>{artifact.status === "verified" ? "VERIFIED" : "DRAFT"} · {artifact.trackId}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artifact.evidence || "Без описания"}</span></Link>)}{knownSolved.slice(0, 12).map((task) => <Link key={`${task.courseId}:${task.id}`} href={`/${task.courseId}/tasks/${task.slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: 6, textDecoration: "none", color: "var(--text-secondary)", fontSize: 13 }}><span style={{ font: "11px var(--font-mono)", color: "var(--success-fg)" }}>PASS</span>{task.title}{task.difficulty && <Badge variant="difficulty" tone={task.difficulty === "easy" ? "easy" : task.difficulty === "hard" ? "hard" : "medium"} size="sm">{task.difficulty}</Badge>}</Link>)}</div></section>

      <section className="report-proof-section">
        <div><span className="report-proof-kicker">ПРОВЕРЯЕМОЕ ДОКАЗАТЕЛЬСТВО</span><h2>Что можно показать работодателю</h2><p>Каждая строка ниже опирается на PASS в runner и не раскрывает исходный код.</p></div>
        <div className="report-proof-grid">{knownSolved.slice(0, 8).map((task) => {
          const passEvents = events.filter((event) => event.itemId === task.id && event.type === "passed").sort((a, b) => a.at.localeCompare(b.at));
          const attempts = getTaskAttempts(task.id, task.courseId);
          const first = attempts.at(-1)?.at ?? passEvents[0]?.at;
          const last = attempts.find((attempt) => attempt.passed)?.at ?? passEvents.at(-1)?.at;
          const date = last ? new Date(last).toLocaleDateString("ru-RU") : "локальный PASS";
          const firstDate = first ? new Date(first).toLocaleDateString("ru-RU") : date;
          const testSummary = attempts.find((attempt) => attempt.passed)?.summary ?? "тесты и инварианты";
          return <article key={`${task.courseId}:${task.id}`}><div><strong>{task.title}</strong><span>{task.difficulty ?? "практика"} · PASS {date}</span></div><p>{testSummary}. Первая попытка: {firstDate}; подтверждено: {date}.</p><Link href={`/${task.courseId}/tasks/${task.slug}`}>Открыть evidence ↗</Link></article>;
        })}</div>
        {knownSolved.length === 0 && <div className="report-proof-empty">Первый PASS автоматически появится здесь после запуска задачи.</div>}
        <div className="report-career-actions"><Link href="/projects">Собрать проектный артефакт ↗</Link><Link href="/go/interview">Подготовиться к интервью ↗</Link><Link href={knownSolved.length ? "/go/tasks/02" : "/go/tasks/01"}>Закрыть следующий пробел ↗</Link><span className="report-goal-note">цель: {careerGoal}</span></div>
      </section>

      <div style={{ marginTop: 34, paddingTop: 18, borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}><span style={{ font: "12px var(--font-mono)", color: "var(--text-tertiary)" }}>{shared?.createdAt ? `отчёт от ${new Date(shared.createdAt).toLocaleDateString("ru-RU")}` : "Локальный отчёт · исходный код не публикуется"}</span><Link href="/account" style={{ color: "var(--accent-text)", textDecoration: "none", fontSize: 13 }}>← Вернуться в кабинет</Link></div>
      <style>{`.report-stats{grid-template-columns:1.3fr repeat(4,1fr)}@media(max-width:700px){.report-page{padding:34px 16px 60px!important}.report-page h1{font-size:30px!important}.report-stats{grid-template-columns:1fr 1fr!important}.report-stats>div:first-child{grid-column:span 2}.report-page section>div[style*="grid-template-columns: 32px"]{grid-template-columns:24px minmax(0,1fr) 48px!important}.report-page section>div[style*="grid-template-columns: 32px"]>div{display:none}}`}</style>
      <style>{`.report-identity{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:28px}.report-identity>div{padding:15px 16px;border-left:2px solid var(--accent);background:var(--bg-elevated)}.report-identity span{display:block;color:var(--text-tertiary);font:10px var(--font-mono);letter-spacing:.08em}.report-identity strong{display:block;margin-top:7px;font-size:14px}.report-identity p{margin:7px 0 0;color:var(--text-secondary);font-size:12px;line-height:1.45}@media(max-width:620px){.report-identity{grid-template-columns:1fr}}`}</style>
      <style>{`.report-proof-section{margin-top:28px;padding:18px;border:1px solid var(--border-default);border-radius:7px;background:var(--bg-elevated)}.report-proof-kicker{color:var(--success-fg);font:10px var(--font-mono);letter-spacing:.08em}.report-proof-section h2{margin:6px 0 4px;font-size:17px}.report-proof-section>div>p{margin:0;color:var(--text-secondary);font-size:13px}.report-proof-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:16px}.report-proof-grid article{padding:12px;border:1px solid var(--border-subtle);border-radius:5px}.report-proof-grid strong,.report-proof-grid span{display:block}.report-proof-grid strong{font-size:13px}.report-proof-grid span{margin-top:4px;color:var(--text-tertiary);font:10px var(--font-mono)}.report-proof-grid p{margin:9px 0;color:var(--text-secondary);font-size:12px;line-height:1.4}.report-proof-grid a,.report-career-actions a{color:var(--accent-text);font-size:12px;text-decoration:none}.report-proof-empty{margin-top:16px;padding:12px;color:var(--text-tertiary);background:var(--bg-inset);font-size:12px}.report-career-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;padding-top:14px;border-top:1px solid var(--border-subtle)}@media(max-width:650px){.report-proof-grid{grid-template-columns:1fr}}`}</style>
    </main>
  );
}

function ReportStat({ label, value }: { label: string; value: string | number }) {
  return <div style={{ padding: "18px 14px", border: "1px solid var(--border-default)", borderRadius: 7, background: "var(--bg-elevated)" }}><span style={{ display: "block", font: "11px var(--font-mono)", color: "var(--text-tertiary)" }}>{label}</span><strong style={{ display: "block", marginTop: 10, font: "600 22px var(--font-mono)", color: "var(--text-primary)" }}>{value}</strong></div>;
}
