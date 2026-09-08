"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TaskMeta } from "@/lib/content";
import { TaskCard } from "@/components/TaskCard";
import { TopicProgress } from "@/components/TopicProgress";
import { ProgressStat } from "@/components/ProgressStat";
import { useLearningEvents, useProgress } from "@/lib/progress";
import { apiRequest } from "@/lib/auth";

interface TopicItem {
  num: number;
  label: string;
  tasks: TaskMeta[];
}

export function TopicsIndexView({
  topics,
  total,
}: {
  topics: TopicItem[];
  total: number;
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const { isSolved } = useProgress(total, "go");
  const events = useLearningEvents();
  const inProgress = useMemo(() => new Set(events.filter((event) => event.type === "started" || event.type === "run").map((event) => event.itemId)), [events]);
  const allTasks = useMemo(() => topics.flatMap((t) => t.tasks.map((task) => ({ ...task, topicNum: t.num, topicLabel: t.label }))), [topics]);
  const tags = useMemo(() => [...new Set(allTasks.flatMap((task) => task.tags ?? []))].sort(), [allTasks]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allTasks.filter((task) => {
      const matchesQuery = !needle || [task.title, task.topicLabel, task.topic, ...(task.tags ?? [])].join(" ").toLowerCase().includes(needle);
      const matchesTopic = topic === "all" || String(task.topicNum) === topic;
      const matchesDifficulty = difficulty === "all" || (task.difficulty ?? "").toLowerCase() === difficulty;
      const solved = isSolved(task.id, task.courseId);
      const matchesStatus = status === "all" || (status === "solved" ? solved : status === "in-progress" ? inProgress.has(task.id) && !solved : !solved && !inProgress.has(task.id));
      return matchesQuery && matchesTopic && matchesDifficulty && matchesStatus;
    });
  }, [allTasks, difficulty, inProgress, isSolved, query, status, topic]);
  const grouped = useMemo(() => new Map(topics.map((t) => [t.num, filtered.filter((task) => task.topicNum === t.num)])), [filtered, topics]);
  return (
    <div className="topics-index-page" style={{ maxWidth: 920, margin: "0 auto", padding: "56px 28px 80px" }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--label-sm)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--accent-text)",
        }}
      >
        Топики · {total} задач
      </span>
      <h1
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: "var(--fw-bold)",
          fontSize: "var(--heading-xl)",
          lineHeight: "var(--heading-xl-lh)",
          letterSpacing: "var(--heading-xl-ls)",
          color: "var(--text-primary)",
          margin: "14px 0 12px",
        }}
      >
        Тренажёр
      </h1>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--body-lg)",
          lineHeight: "var(--body-lg-lh)",
          color: "var(--text-secondary)",
          maxWidth: 620,
          margin: "0 0 28px",
        }}
      >
        {topics.length} топиков, {total} задач. Решай по порядку или ныряй в
        нужную тему. читай → решай → прогоняй → разбирай.
      </p>

      <div
        style={{
          padding: "16px 18px",
          background: "var(--bg-elevated)",
          border: "var(--border-width) solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          marginBottom: 48,
        }}
      >
        <ProgressStat total={total} />
      </div>

      <LeaderboardPanel />

      <div className="practice-filters" style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1.5fr) repeat(3, minmax(140px, 1fr))", gap: 10, marginBottom: 32 }}>
        <label className="practice-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по задачам и навыкам" aria-label="Поиск по задачам и навыкам" /></label>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Фильтр по теме"><option value="all">Все темы</option>{topics.map((t) => <option key={t.num} value={t.num}>{String(t.num).padStart(2, "0")} · {t.label}</option>)}</select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Фильтр по сложности"><option value="all">Любая сложность</option><option value="easy">Лёгкая</option><option value="medium">Средняя</option><option value="hard">Сложная</option></select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Фильтр по статусу"><option value="all">Любой статус</option><option value="todo">Не начато</option><option value="in-progress">В процессе</option><option value="solved">Решено</option></select>
      </div>
      {tags.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 7, margin: "-20px 0 32px" }}><span style={{ color: "var(--text-tertiary)", fontSize: 12, alignSelf: "center" }}>Навыки:</span>{tags.slice(0, 12).map((tag) => <button key={tag} type="button" onClick={() => setQuery(tag)} style={{ border: "1px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-secondary)", borderRadius: 5, padding: "5px 9px", fontSize: 12, cursor: "pointer" }}>{tag}</button>)}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
        {topics.map((t) => {
          const matching = grouped.get(t.num) ?? [];
          if (matching.length === 0) return null;
          return <TopicSection key={t.num} topic={{ ...t, tasks: matching }} />;
        })}
        {filtered.length === 0 && <div style={{ padding: "32px 20px", border: "1px dashed var(--border-default)", color: "var(--text-secondary)", textAlign: "center" }}>Ничего не найдено. Измени фильтры или попробуй другой запрос.</div>}
      </div>
      <style>{`.practice-search{display:flex;align-items:center;gap:8px;height:42px;padding:0 12px;border:1px solid var(--border-default);border-radius:6px;background:var(--bg-inset);color:var(--text-tertiary)}.practice-search input{width:100%;border:0;outline:0;background:transparent;color:var(--text-primary);font:14px var(--font-sans)}.practice-filters select{height:42px;min-width:0;padding:0 10px;border:1px solid var(--border-default);border-radius:6px;background:var(--bg-inset);color:var(--text-secondary);font:13px var(--font-sans)}@media(max-width:760px){.practice-filters{grid-template-columns:1fr 1fr!important}.practice-search{grid-column:1/-1}}@media(max-width:420px){.practice-filters{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

interface LeaderboardEntry {
  rank: number;
  alias: string;
  feedback: number;
  passed: number;
  passRate: number;
  solvedTasks: number;
}

function LeaderboardPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [participants, setParticipants] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ participants: number; entries: LeaderboardEntry[] }>("/leaderboard?courseId=go")
      .then((payload) => {
        if (cancelled) return;
        setParticipants(payload.participants);
        setEntries(payload.entries.slice(0, 5));
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "unavailable") return null;
  return (
    <section aria-label="Рейтинг качества решений" style={{ marginBottom: 36, padding: "16px 18px", border: "1px solid var(--border-default)", borderRadius: 7, background: "var(--bg-elevated)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
        <div><span style={{ display: "block", color: "var(--accent-text)", font: "11px var(--font-mono)", letterSpacing: ".08em" }}>QUALITY BOARD</span><h2 style={{ margin: "6px 0 0", color: "var(--text-primary)", fontSize: 17 }}>Стабильность решений</h2></div>
        <span style={{ color: "var(--text-tertiary)", font: "11px var(--font-mono)" }}>{state === "loading" ? "загрузка" : `${participants} участников`}</span>
      </div>
      {state === "loading" ? <div style={{ height: 42, color: "var(--text-tertiary)", fontSize: 13 }}>Получаем обезличенную статистику...</div> : entries.length === 0 ? <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Рейтинг появится после трёх проверок у первых участников.</div> : <div style={{ display: "grid", gap: 4 }}>
        {entries.map((entry) => <div key={entry.alias} style={{ display: "grid", gridTemplateColumns: "30px minmax(0,1fr) 100px 74px", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid var(--border-subtle)", fontSize: 12 }}><span style={{ color: "var(--text-tertiary)", font: "11px var(--font-mono)" }}>{String(entry.rank).padStart(2, "0")}</span><strong style={{ overflow: "hidden", color: "var(--text-primary)", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{entry.alias}</strong><span style={{ color: "var(--text-secondary)", textAlign: "right" }}>{entry.passed}/{entry.feedback} PASS</span><span style={{ color: "var(--success-fg)", font: "11px var(--font-mono)", textAlign: "right" }}>{entry.passRate}%</span></div>)}
      </div>}
      <p style={{ margin: "12px 0 0", color: "var(--text-tertiary)", fontSize: 11 }}>Только качество и устойчивость обратной связи, без скорости и раскрытия профиля.</p>
      <style>{`@media(max-width:520px){[aria-label="Рейтинг качества решений"] div[style*="grid-template-columns"]{grid-template-columns:24px minmax(0,1fr) 62px!important}[aria-label="Рейтинг качества решений"] div[style*="grid-template-columns"]>span:last-child{display:none}}`}</style>
    </section>
  );
}

function TopicSection({ topic }: { topic: TopicItem }) {
  const [hover, setHover] = useState(false);
  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <Link
          href={`/go/topics/${topic.num}`}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--label-sm)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--text-tertiary)",
            textDecoration: "none",
          }}
        >
          Топик {String(topic.num).padStart(2, "0")}
        </Link>
        <Link
          href={`/go/topics/${topic.num}`}
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: "var(--fw-semibold)",
            fontSize: "var(--heading-sm)",
            lineHeight: "var(--heading-sm-lh)",
            letterSpacing: "var(--heading-sm-ls)",
            color: "var(--text-primary)",
            textDecoration: "none",
          }}
        >
          {topic.label}
        </Link>
        <TopicProgress tasks={topic.tasks} />
        <Link
          href={`/go/topics/${topic.num}`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--label-md)",
            fontWeight: "var(--fw-medium)",
            color: "var(--accent-text)",
            textDecoration: hover ? "underline" : "none",
            textUnderlineOffset: 2,
          }}
        >
          Подробнее →
        </Link>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 10,
        }}
      >
        {topic.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}
