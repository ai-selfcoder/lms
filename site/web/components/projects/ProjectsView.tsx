"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { recordLearningEvent, useLearningEvents, useProgress } from "@/lib/progress";
import { saveProjectArtifact, useProjectArtifacts } from "@/lib/projectArtifacts";
import type { ProjectStep, ProjectTrack } from "@/lib/projectTracks";

function isComplete(step: ProjectStep, solved: (id: string) => boolean, started: Set<string>) {
  return step.kind === "task" ? solved(step.statusId) : started.has(step.statusId);
}

export function ProjectsView({ tracks }: { tracks: ProjectTrack[] }) {
  const { isSolved } = useProgress(undefined, "go");
  const events = useLearningEvents();
  const artifacts = useProjectArtifacts();
  const [editingTrack, setEditingTrack] = useState<string | null>(null);
  const [evidence, setEvidence] = useState("");
  const started = useMemo(() => new Set(events.filter((event) => event.type === "started").map((event) => event.itemId)), [events]);
  const summaries = useMemo(() => tracks.map((track) => {
    const done = track.steps.filter((step) => isComplete(step, isSolved, started)).length;
    const next = track.steps.find((step) => !isComplete(step, isSolved, started));
    return { track, done, next, complete: done === track.steps.length };
  }), [isSolved, started, tracks]);
  const totalDone = summaries.reduce((sum, item) => sum + item.done, 0);
  const totalSteps = tracks.reduce((sum, track) => sum + track.steps.length, 0);

  return <main className="projects-page">
    <div className="projects-head">
      <div>
        <span className="projects-eyebrow">PROJECT TRACKS · GRAPH LMS</span>
        <h1>Собери работающий артефакт</h1>
        <p>Короткие вертикальные срезы: теория, исполняемая задача и эксперимент. Каждый шаг опирается на уже существующий контент.</p>
      </div>
      <div className="projects-total"><strong>{totalDone}/{totalSteps}</strong><span>шагов закрыто</span></div>
    </div>
    <div className="projects-grid">
      {summaries.map(({ track, done, next, complete }) => {
        const artifact = artifacts.find((item) => item.trackId === track.id);
        return <section className={`project-card${complete ? " is-complete" : ""}`} key={track.id}>
        <div className="project-card-top"><span>{track.kicker}</span><b>{done}/{track.steps.length}</b></div>
        <h2>{track.title}</h2>
        <p className="project-description">{track.description}</p>
        <div className="project-meter"><i style={{ width: `${(done / track.steps.length) * 100}%` }} /></div>
        <div className="project-meta"><span>{track.estimate}</span><span>{complete ? "трек завершён" : `следом: ${next?.title ?? "готово"}`}</span></div>
        <div className="project-outcome"><span>АРТЕФАКТ</span>{track.outcome}</div>
        <div className="project-steps">
          {track.steps.map((step, index) => {
            const completeStep = isComplete(step, isSolved, started);
            const available = completeStep || index === 0 || isComplete(track.steps[index - 1], isSolved, started);
            const body = <><span className="project-step-index">{completeStep ? "✓" : String(index + 1).padStart(2, "0")}</span><span className="project-step-copy"><b>{step.title}</b><small>{step.note}</small></span><span className="project-step-state">{completeStep ? "готово" : available ? "открыть" : "после шага"}</span></>;
            return available ? <Link className={`project-step${completeStep ? " complete" : ""}`} href={step.href} key={step.id}>{body}</Link> : <div className="project-step locked" key={step.id} aria-disabled="true">{body}</div>;
          })}
        </div>
        <div className="project-artifact-row">
          <span>{artifact?.status === "verified" ? "АРТЕФАКТ ЗАФИКСИРОВАН" : artifact ? "АРТЕФАКТ В РАБОТЕ" : "АРТЕФАКТ НЕ ЗАФИКСИРОВАН"}</span>
          <button type="button" onClick={() => { setEditingTrack(track.id); setEvidence(artifact?.evidence ?? ""); }}>{artifact ? "Изменить доказательство" : "Добавить доказательство"}</button>
        </div>
        {editingTrack === track.id && <form className="project-artifact-form" onSubmit={(event) => { event.preventDefault(); saveProjectArtifact({ trackId: track.id, status: complete ? "verified" : "draft", evidence }); recordLearningEvent("artifact_saved", `project:${track.id}`, { eventId: `artifact_saved:${track.id}` }); setEditingTrack(null); }}><textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Что работает и чем ты это проверил?" maxLength={2000} rows={3} /><div><button type="button" onClick={() => setEditingTrack(null)}>Отмена</button><button type="submit">Сохранить</button></div></form>}
        <Link className="project-cta" href={next?.href ?? track.steps[track.steps.length - 1].href}>{complete ? "Открыть трек ещё раз" : "Продолжить трек"}<span aria-hidden="true">→</span></Link>
      </section>;
      })}
    </div>
    <style>{`.projects-page{max-width:1080px;margin:0 auto;padding:52px 28px 88px;color:var(--text-primary)}.projects-head{display:flex;align-items:end;justify-content:space-between;gap:28px;padding-bottom:30px;border-bottom:1px solid #2a3039}.projects-eyebrow{font:600 11px var(--font-mono);letter-spacing:.1em;color:var(--text-tertiary)}.projects-head h1{margin:11px 0 9px;font-size:40px;letter-spacing:-.04em}.projects-head p{max-width:650px;margin:0;color:var(--text-secondary);font-size:15px;line-height:1.55}.projects-total{display:flex;flex-direction:column;gap:4px;min-width:130px;padding:15px 16px;border:1px solid #2a3039;border-radius:7px;background:#14171c}.projects-total strong{font:700 27px var(--font-mono)}.projects-total span{color:var(--text-tertiary);font-size:12px}.projects-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:28px}.project-card{display:flex;flex-direction:column;min-width:0;padding:20px;border:1px solid #2a3039;border-radius:7px;background:#14171c}.project-card.is-complete{border-color:rgba(57,217,138,.48)}.project-card-top{display:flex;justify-content:space-between;gap:12px;color:#78a9ff;font:10px var(--font-mono);letter-spacing:.08em}.project-card-top b{color:var(--text-tertiary);font-weight:500;letter-spacing:0}.project-card h2{margin:19px 0 7px;font-size:24px;letter-spacing:-.025em}.project-description{min-height:48px;margin:0;color:var(--text-secondary);font-size:13px;line-height:1.5}.project-meter{height:5px;margin:18px 0 9px;overflow:hidden;border-radius:2px;background:#262c34}.project-meter i{display:block;height:100%;background:#39d98a}.project-meta{display:flex;justify-content:space-between;gap:10px;color:var(--text-tertiary);font:11px var(--font-mono)}.project-meta span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.project-outcome{margin:18px 0 8px;padding:11px 12px;color:var(--text-secondary);font-size:12px;line-height:1.45;border-left:2px solid #276ef1;background:#11151a}.project-outcome span{display:block;margin-bottom:4px;color:#78a9ff;font:10px var(--font-mono);letter-spacing:.08em}.project-steps{border-top:1px solid #2a3039}.project-step{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #242932;color:inherit;text-decoration:none}.project-step:hover{background:#171b22;text-decoration:none}.project-step-index{display:grid;width:24px;height:24px;place-items:center;color:var(--text-tertiary);border:1px solid #343a45;border-radius:50%;font:10px var(--font-mono)}.project-step-copy{min-width:0}.project-step-copy b{display:block;overflow:hidden;color:var(--text-primary);font-size:13px;text-overflow:ellipsis;white-space:nowrap}.project-step-copy small{display:block;margin-top:3px;overflow:hidden;color:var(--text-tertiary);font-size:11px;text-overflow:ellipsis;white-space:nowrap}.project-step-state{color:var(--text-tertiary);font:10px var(--font-mono)}.project-step.complete .project-step-index{color:#39d98a;border-color:#39d98a}.project-step.complete .project-step-state{color:#39d98a}.project-step.locked{opacity:.45}.project-artifact-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;color:var(--text-tertiary);font:10px var(--font-mono)}.project-artifact-row button,.project-artifact-form button{border:1px solid #343a45;border-radius:4px;background:transparent;color:#78a9ff;font:11px var(--font-mono);padding:5px 8px;cursor:pointer}.project-artifact-form{margin-top:8px}.project-artifact-form textarea{display:block;width:100%;box-sizing:border-box;resize:vertical;padding:8px;border:1px solid #343a45;border-radius:4px;background:#11151a;color:var(--text-primary);font:12px/1.45 var(--font-mono)}.project-artifact-form>div{display:flex;justify-content:flex-end;gap:6px;margin-top:6px}.project-cta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:16px;color:#78a9ff;font-size:13px;font-weight:600;text-decoration:none}.project-cta:hover{text-decoration:underline;text-underline-offset:3px}.project-cta span{font-size:17px}@media(max-width:760px){.projects-page{padding:36px 16px 64px}.projects-head{align-items:start;flex-direction:column}.projects-head h1{font-size:32px}.projects-total{width:100%;box-sizing:border-box}.projects-grid{grid-template-columns:1fr;margin-top:20px}}`}</style>
  </main>;
}
