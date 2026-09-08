"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, ProgressBar } from "@/ds";
import { useLearningEvents, useProgress } from "@/lib/progress";
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

  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get("data");
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

  const share = async () => {
    const payload: SharedReport = {
      solved: allTasks.filter((task) => solvedIds.has(`${task.courseId}:${task.id}`)).map((task) => `${task.courseId}:${task.id}`),
      ...localStats,
      projectArtifacts,
      createdAt: new Date().toISOString(),
    };
    const url = `${window.location.origin}/account/report?data=${encodeURIComponent(btoa(JSON.stringify(payload)))}`;
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

      <div style={{ marginTop: 34, paddingTop: 18, borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}><span style={{ font: "12px var(--font-mono)", color: "var(--text-tertiary)" }}>{shared?.createdAt ? `отчёт от ${new Date(shared.createdAt).toLocaleDateString("ru-RU")}` : "Локальный отчёт · исходный код не публикуется"}</span><Link href="/account" style={{ color: "var(--accent-text)", textDecoration: "none", fontSize: 13 }}>← Вернуться в кабинет</Link></div>
      <style>{`.report-stats{grid-template-columns:1.3fr repeat(4,1fr)}@media(max-width:700px){.report-page{padding:34px 16px 60px!important}.report-page h1{font-size:30px!important}.report-stats{grid-template-columns:1fr 1fr!important}.report-stats>div:first-child{grid-column:span 2}.report-page section>div[style*="grid-template-columns: 32px"]{grid-template-columns:24px minmax(0,1fr) 48px!important}.report-page section>div[style*="grid-template-columns: 32px"]>div{display:none}}`}</style>
    </main>
  );
}

function ReportStat({ label, value }: { label: string; value: string | number }) {
  return <div style={{ padding: "18px 14px", border: "1px solid var(--border-default)", borderRadius: 7, background: "var(--bg-elevated)" }}><span style={{ display: "block", font: "11px var(--font-mono)", color: "var(--text-tertiary)" }}>{label}</span><strong style={{ display: "block", marginTop: 10, font: "600 22px var(--font-mono)", color: "var(--text-primary)" }}>{value}</strong></div>;
}
