"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProgressBar } from "@/ds";
import { useProgress } from "@/lib/progress";
import { apiUrl } from "@/lib/auth";

interface SkillNode { num: number; label: string; taskIds: string[]; }
interface LeaderboardEntry { rank: number; alias: string; feedback: number; passed: number; passRate: number; solvedTasks: number; }

export function SkillGraphView({ skills }: { skills: SkillNode[] }) {
  const { isSolved } = useProgress(undefined, "go");
  const rows = useMemo(() => skills.map((skill, index) => {
    const done = skill.taskIds.filter((id) => isSolved(id, "go")).length;
    const previous = index > 0 ? skills[index - 1] : null;
    const previousDone = previous ? previous.taskIds.every((id) => isSolved(id, "go")) : true;
    return { ...skill, done, previous, previousDone, complete: done === skill.taskIds.length && skill.taskIds.length > 0 };
  }), [isSolved, skills]);
  const completed = rows.filter((row) => row.complete).length;
  const next = rows.find((row) => !row.complete) ?? rows[rows.length - 1];
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardState, setLeaderboardState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiUrl()}/leaderboard?courseId=go`)
      .then((response) => response.ok ? response.json() as Promise<{ entries?: LeaderboardEntry[] }> : Promise.reject(new Error("leaderboard")))
      .then((payload) => {
        if (cancelled) return;
        const entries = Array.isArray(payload.entries) ? payload.entries : [];
        setLeaderboard(entries);
        setLeaderboardState(entries.length ? "ready" : "empty");
      })
      .catch(() => { if (!cancelled) setLeaderboardState("error"); });
    return () => { cancelled = true; };
  }, []);

  return <div className="skill-page" style={{ maxWidth: 980, margin: "0 auto", padding: "48px 28px 80px" }}>
    <div style={{ marginBottom: 30 }}><span className="skill-eyebrow">SKILL GRAPH · GO / CONCURRENCY</span><h1 style={{ margin: "10px 0 8px", fontSize: 36, letterSpacing: "-.03em", color: "var(--text-primary)" }}>Карта навыков</h1><p style={{ margin: 0, maxWidth: 640, color: "var(--text-secondary)", lineHeight: 1.6 }}>Путь от базовых каналов к production-паттернам. Закрытые навыки открывают следующий уровень, но любой узел можно изучать отдельно.</p></div>
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", marginBottom: 32, border: "1px solid var(--border-default)", borderRadius: 7, background: "var(--bg-elevated)" }}><strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{completed}/{rows.length}</strong><span style={{ color: "var(--text-secondary)", fontSize: 14 }}>навыков освоено</span><div style={{ flex: 1 }}><ProgressBar value={completed} max={rows.length || 1} tone="accent" /></div><Link href={next ? `/go/topics/${next.num}` : "/go/practice"} style={{ color: "var(--accent-text)", fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>Следующий →</Link></div>
    <div className="skill-list">{rows.map((row, index) => <div key={row.num} className={`skill-node${row.complete ? " complete" : ""}`}><div className="skill-rail"><span>{String(row.num).padStart(2, "0")}</span>{index < rows.length - 1 && <i />}</div><Link href={`/go/topics/${row.num}`} className="skill-body"><div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}><strong>{row.label}</strong><span className="skill-status">{row.complete ? "освоено" : row.previousDone ? "доступно" : "следующий уровень"}</span></div><div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}><div style={{ flex: 1 }}><ProgressBar value={row.done} max={row.taskIds.length || 1} tone={row.complete ? "success" : "accent"} size="sm" /></div><span className="skill-count">{row.done}/{row.taskIds.length}</span></div>{row.previous && <small>После: {row.previous.label}</small>}</Link></div>)}</div>
    <section className="skill-leaderboard" aria-label="Таблица качества решений">
      <div className="skill-leaderboard-head"><div><span className="skill-eyebrow">QUALITY / ANONYMOUS</span><h2>Стабильность решений</h2></div><span className="skill-leaderboard-note">без скорости и исходного кода</span></div>
      {leaderboardState === "loading" && <p className="skill-leaderboard-empty">Загрузка данных...</p>}
      {leaderboardState === "error" && <p className="skill-leaderboard-empty">Таблица временно недоступна.</p>}
      {leaderboardState === "empty" && <p className="skill-leaderboard-empty">Появится после трёх проверок у нескольких участников.</p>}
      {leaderboardState === "ready" && <div className="skill-leaderboard-table"><div className="skill-leaderboard-row skill-leaderboard-header"><span>#</span><span>Участник</span><span>Проверки</span><span>Качество</span></div>{leaderboard.map((entry) => <div className="skill-leaderboard-row" key={entry.alias}><span>{String(entry.rank).padStart(2, "0")}</span><strong>{entry.alias}</strong><span>{entry.feedback}</span><span>{entry.passRate}%</span></div>)}</div>}
    </section>
    <style>{`.skill-eyebrow{font:600 11px/16px var(--font-mono);letter-spacing:.1em;color:var(--text-tertiary)}.skill-list{display:flex;flex-direction:column}.skill-node{display:grid;grid-template-columns:58px minmax(0,1fr);min-height:108px}.skill-rail{position:relative;display:flex;justify-content:flex-start;padding-top:17px;font:12px var(--font-mono);color:var(--text-tertiary)}.skill-rail i{position:absolute;left:13px;top:39px;bottom:-1px;width:1px;background:var(--border-default)}.skill-body{position:relative;z-index:1;padding:16px 18px;border:1px solid var(--border-default);border-radius:7px;background:var(--bg-elevated);text-decoration:none;transition:.16s ease}.skill-body:hover{border-color:var(--accent);background:var(--bg-hover);text-decoration:none}.skill-body strong{color:var(--text-primary);font-size:16px}.skill-status,.skill-count{font:12px var(--font-mono);color:var(--text-tertiary)}.skill-node.complete .skill-status{color:var(--success-fg)}.skill-body small{display:block;margin-top:9px;color:var(--text-tertiary);font-size:12px}.skill-leaderboard{margin-top:38px;border:1px solid var(--border-default);border-radius:7px;overflow:hidden;background:var(--bg-elevated)}.skill-leaderboard-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px;border-bottom:1px solid var(--border-subtle)}.skill-leaderboard-head h2{margin:8px 0 0;font-size:18px;color:var(--text-primary)}.skill-leaderboard-note,.skill-leaderboard-empty{font-size:12px;color:var(--text-tertiary)}.skill-leaderboard-empty{padding:20px 18px;margin:0}.skill-leaderboard-row{display:grid;grid-template-columns:48px minmax(0,1fr) 90px 90px;align-items:center;gap:12px;padding:12px 18px;border-top:1px solid var(--border-subtle);font:12px var(--font-mono);color:var(--text-tertiary)}.skill-leaderboard-header{border-top:0;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.skill-leaderboard-row strong{font:13px var(--font-sans);color:var(--text-primary)}.skill-leaderboard-row span:last-child{color:var(--success-fg)}@media(max-width:560px){.skill-page{padding:34px 16px 60px!important}.skill-page h1{font-size:30px!important}.skill-node{grid-template-columns:42px minmax(0,1fr)}.skill-rail i{left:10px}.skill-body{padding:14px}.skill-status{font-size:11px}.skill-leaderboard-row{grid-template-columns:32px minmax(0,1fr) 58px 58px;padding:11px 12px}.skill-leaderboard-head{padding:15px 12px}.skill-leaderboard-note{max-width:120px;text-align:right}}`}</style>
  </div>;
}
