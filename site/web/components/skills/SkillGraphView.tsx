"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ProgressBar } from "@/ds";
import { useProgress } from "@/lib/progress";

interface SkillNode { num: number; label: string; taskIds: string[]; }

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

  return <div className="skill-page" style={{ maxWidth: 980, margin: "0 auto", padding: "48px 28px 80px" }}>
    <div style={{ marginBottom: 30 }}><span className="skill-eyebrow">SKILL GRAPH · GO / CONCURRENCY</span><h1 style={{ margin: "10px 0 8px", fontSize: 36, letterSpacing: "-.03em", color: "var(--text-primary)" }}>Карта навыков</h1><p style={{ margin: 0, maxWidth: 640, color: "var(--text-secondary)", lineHeight: 1.6 }}>Путь от базовых каналов к production-паттернам. Закрытые навыки открывают следующий уровень, но любой узел можно изучать отдельно.</p></div>
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", marginBottom: 32, border: "1px solid var(--border-default)", borderRadius: 7, background: "var(--bg-elevated)" }}><strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{completed}/{rows.length}</strong><span style={{ color: "var(--text-secondary)", fontSize: 14 }}>навыков освоено</span><div style={{ flex: 1 }}><ProgressBar value={completed} max={rows.length || 1} tone="accent" /></div><Link href={next ? `/go/topics/${next.num}` : "/go/practice"} style={{ color: "var(--accent-text)", fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>Следующий →</Link></div>
    <div className="skill-list">{rows.map((row, index) => <div key={row.num} className={`skill-node${row.complete ? " complete" : ""}`}><div className="skill-rail"><span>{String(row.num).padStart(2, "0")}</span>{index < rows.length - 1 && <i />}</div><Link href={`/go/topics/${row.num}`} className="skill-body"><div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}><strong>{row.label}</strong><span className="skill-status">{row.complete ? "освоено" : row.previousDone ? "доступно" : "следующий уровень"}</span></div><div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}><div style={{ flex: 1 }}><ProgressBar value={row.done} max={row.taskIds.length || 1} tone={row.complete ? "success" : "accent"} size="sm" /></div><span className="skill-count">{row.done}/{row.taskIds.length}</span></div>{row.previous && <small>После: {row.previous.label}</small>}</Link></div>)}</div>
    <style>{`.skill-eyebrow{font:600 11px/16px var(--font-mono);letter-spacing:.1em;color:var(--text-tertiary)}.skill-list{display:flex;flex-direction:column}.skill-node{display:grid;grid-template-columns:58px minmax(0,1fr);min-height:108px}.skill-rail{position:relative;display:flex;justify-content:flex-start;padding-top:17px;font:12px var(--font-mono);color:var(--text-tertiary)}.skill-rail i{position:absolute;left:13px;top:39px;bottom:-1px;width:1px;background:var(--border-default)}.skill-body{position:relative;z-index:1;padding:16px 18px;border:1px solid var(--border-default);border-radius:7px;background:var(--bg-elevated);text-decoration:none;transition:.16s ease}.skill-body:hover{border-color:var(--accent);background:var(--bg-hover);text-decoration:none}.skill-body strong{color:var(--text-primary);font-size:16px}.skill-status,.skill-count{font:12px var(--font-mono);color:var(--text-tertiary)}.skill-node.complete .skill-status{color:var(--success-fg)}.skill-body small{display:block;margin-top:9px;color:var(--text-tertiary);font-size:12px}@media(max-width:560px){.skill-page{padding:34px 16px 60px!important}.skill-page h1{font-size:30px!important}.skill-node{grid-template-columns:42px minmax(0,1fr)}.skill-rail i{left:10px}.skill-body{padding:14px}.skill-status{font-size:11px}}`}</style>
  </div>;
}
