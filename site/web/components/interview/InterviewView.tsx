"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLearningEvents, useProgress, recordLearningEvent } from "@/lib/progress";
import { finishInterview, getInterviewSession, saveInterviewSession, useInterviewSession, type InterviewSession } from "@/lib/interview";

interface InterviewTask {
  id: string;
  num: number;
  title: string;
  slug: string;
  difficulty?: string;
  tags?: string[];
}

const DURATIONS = [
  { value: 20 * 60, label: "20 минут", hint: "быстрый срез" },
  { value: 30 * 60, label: "30 минут", hint: "рекомендуется" },
  { value: 45 * 60, label: "45 минут", hint: "глубокая сессия" },
];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const rest = Math.max(0, seconds) % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function difficultyLabel(value?: string) {
  if (value === "hard") return "сложно";
  if (value === "easy") return "легко";
  return "средне";
}

export function InterviewView({ tasks }: { tasks: InterviewTask[] }) {
  const session = useInterviewSession();
  const { isSolved } = useProgress(tasks.length, "go");
  const events = useLearningEvents();
  const [duration, setDuration] = useState(DURATIONS[1].value);
  const [now, setNow] = useState(() => Date.now());
  const [showAll, setShowAll] = useState(false);

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const selectedTasks = useMemo(() => (session?.taskIds ?? []).map((id) => taskById.get(id)).filter((task): task is InterviewTask => Boolean(task)), [session, taskById]);
  const active = Boolean(session && !session.endedAt);
  const remaining = session ? Math.ceil((new Date(session.startedAt).getTime() + session.durationSec * 1000 - now) / 1000) : 0;
  const solvedCount = selectedTasks.filter((task) => isSolved(task.id, "go")).length;
  const sessionStarted = useMemo(() => new Set(events.filter((event) => event.type === "started").map((event) => event.itemId)), [events]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (active && remaining <= 0) finishInterview("timeout");
  }, [active, remaining]);

  const start = useCallback(() => {
    const preferred = tasks.filter((task) => task.difficulty !== "easy" && task.tags?.some((tag) => ["worker-pool", "rate-limiting", "context", "mutex", "channels", "pipeline", "highload"].includes(tag)));
    const pool = preferred.length >= 3 ? preferred : tasks;
    const picked = shuffle(pool).slice(0, 3);
    const next: InterviewSession = {
      id: `interview-${Date.now().toString(36)}`,
      taskIds: picked.map((task) => task.id),
      startedAt: new Date().toISOString(),
      durationSec: duration,
    };
    saveInterviewSession(next);
    recordLearningEvent("started", `interview:${next.id}`, { courseId: "go", eventId: `started:interview:${next.id}`, meta: { durationSec: duration, taskCount: picked.length } });
    setNow(Date.now());
  }, [duration, tasks]);

  const end = useCallback(() => {
    if (active && !window.confirm("Завершить интервью и открыть разбор?")) return;
    const current = getInterviewSession();
    if (current && !current.endedAt) {
      const ended = finishInterview("manual");
      if (ended) recordLearningEvent("completed", `interview:${ended.id}`, { courseId: "go", eventId: `completed:interview:${ended.id}`, meta: { solved: solvedCount, taskCount: ended.taskIds.length } });
    }
  }, [active, solvedCount]);

  const reset = useCallback(() => saveInterviewSession({ id: "", taskIds: [], startedAt: "", durationSec: 0, endedAt: new Date().toISOString() }), []);

  if (!session || !session.id) return <Setup tasks={tasks} duration={duration} setDuration={setDuration} onStart={start} />;

  const elapsedDuration = session.endedAt
    ? Math.min(session.durationSec, Math.max(0, Math.ceil((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)))
    : session.durationSec;

  return <main className="interview-page">
    <div className="interview-head">
      <div><span className="interview-eyebrow">INTERVIEW MODE · GO / CONCURRENCY</span><h1>{active ? "Интервью идёт" : "Разбор интервью"}</h1><p>{active ? "Решай задачи в любом порядке. Скорость не публикуется: важнее, что именно удалось объяснить и исправить." : session.endReason === "timeout" ? "Время вышло. Посмотри, какие темы стоит повторить, и запусти новую сессию." : "Сессия завершена. Используй результат как карту следующего шага."}</p></div>
      <div className={`interview-clock${active && remaining < 120 ? " urgent" : ""}`}><strong>{active ? formatTime(remaining) : formatTime(elapsedDuration)}</strong><span>{active ? "осталось" : "длительность"}</span></div>
    </div>
    <section className="interview-summary"><div><strong>{solvedCount}/{selectedTasks.length}</strong><span>задач решено</span></div><div className="interview-summary-meter"><i style={{ width: `${selectedTasks.length ? (solvedCount / selectedTasks.length) * 100 : 0}%` }} /></div><span className="interview-summary-note">{active ? "Можно открыть задачу и вернуться сюда" : solvedCount === selectedTasks.length ? "Все задачи пройдены" : "Повтори отмеченные темы"}</span></section>
    <section className="interview-list" aria-label="Задачи интервью">
      {selectedTasks.map((task, index) => {
        const solved = isSolved(task.id, "go");
        const started = sessionStarted.has(task.id);
        const href = `/go/tasks/${task.slug}?interview=${encodeURIComponent(session.id)}`;
        const body = <><span className={`interview-task-index${solved ? " solved" : ""}`}>{solved ? "✓" : String(index + 1).padStart(2, "0")}</span><span className="interview-task-copy"><b>{task.title}</b><small>{difficultyLabel(task.difficulty)}{task.tags?.[0] ? ` · ${task.tags[0]}` : ""}</small></span><span className={`interview-task-state${solved ? " solved" : ""}`}>{solved ? "решено" : started ? "в работе" : "открыть"}</span><span aria-hidden="true">→</span></>;
        return <Link className="interview-task" href={href} key={task.id}>{body}</Link>;
      })}
    </section>
    {active ? <button className="interview-finish" type="button" onClick={end}>Завершить и открыть разбор <span aria-hidden="true">→</span></button> : <div className="interview-finished-actions"><button className="interview-finish" type="button" onClick={reset}>Новая сессия <span aria-hidden="true">↻</span></button><Link href="/account" className="interview-secondary">Открыть кабинет →</Link></div>}
    <button type="button" className="interview-details-toggle" onClick={() => setShowAll((value) => !value)}>{showAll ? "Скрыть критерии" : "Как читать результат"}</button>
    {showAll && <div className="interview-details"><p><b>Решено</b> — тесты задачи прошли и результат попал в твой прогресс.</p><p><b>В работе</b> — задача открывалась во время сессии, но ещё не закрыта.</p><p><b>Время</b> — локальный таймер для самопроверки, без рейтинга и штрафа за паузу.</p></div>}
    <style>{`.interview-page{max-width:900px;margin:0 auto;padding:52px 28px 88px;color:var(--text-primary)}.interview-head{display:flex;align-items:end;justify-content:space-between;gap:28px;padding-bottom:30px;border-bottom:1px solid #2a3039}.interview-eyebrow{font:600 11px var(--font-mono);letter-spacing:.1em;color:var(--text-tertiary)}.interview-head h1{margin:11px 0 9px;font-size:40px;letter-spacing:-.04em}.interview-head p{max-width:620px;margin:0;color:var(--text-secondary);font-size:15px;line-height:1.55}.interview-clock{display:flex;flex:none;flex-direction:column;gap:4px;min-width:130px;padding:16px;border:1px solid #2a3039;border-radius:7px;background:#14171c}.interview-clock strong{font:700 28px var(--font-mono);letter-spacing:.02em}.interview-clock span{color:var(--text-tertiary);font:11px var(--font-mono)}.interview-clock.urgent{border-color:#ff5c6c;color:#ff9aa4}.interview-summary{display:flex;align-items:center;gap:18px;margin:24px 0 14px;padding:16px 18px;border:1px solid #2a3039;border-radius:7px;background:#14171c}.interview-summary strong{font:700 22px var(--font-mono)}.interview-summary div:first-child span{display:block;margin-top:3px;color:var(--text-tertiary);font-size:11px}.interview-summary-meter{flex:1;height:5px;overflow:hidden;border-radius:2px;background:#262c34}.interview-summary-meter i{display:block;height:100%;background:#39d98a}.interview-summary-note{color:var(--text-tertiary);font:11px var(--font-mono)}.interview-list{border-top:1px solid #2a3039}.interview-task{display:grid;grid-template-columns:34px minmax(0,1fr) auto 18px;align-items:center;gap:12px;padding:17px 8px;color:inherit;text-decoration:none;border-bottom:1px solid #242932}.interview-task:hover{background:#171b22;text-decoration:none}.interview-task-index{display:grid;width:26px;height:26px;place-items:center;color:var(--text-tertiary);border:1px solid #343a45;border-radius:50%;font:10px var(--font-mono)}.interview-task-index.solved{color:#39d98a;border-color:#39d98a}.interview-task-copy{min-width:0}.interview-task-copy b{display:block;overflow:hidden;font-size:15px;text-overflow:ellipsis;white-space:nowrap}.interview-task-copy small{display:block;margin-top:4px;color:var(--text-tertiary);font:11px var(--font-mono)}.interview-task-state{color:var(--text-tertiary);font:11px var(--font-mono)}.interview-task-state.solved{color:#39d98a}.interview-task>span:last-child{color:#78a9ff;font-size:17px}.interview-finish{display:inline-flex;align-items:center;justify-content:space-between;gap:18px;min-height:42px;margin-top:20px;padding:0 15px;color:#fff;border:1px solid #276ef1;border-radius:6px;background:#276ef1;font-size:13px;font-weight:600;cursor:pointer}.interview-finish:hover{background:#4a86ff}.interview-finish span{font-size:17px}.interview-finished-actions{display:flex;align-items:center;gap:18px;flex-wrap:wrap}.interview-secondary{color:#78a9ff;font:12px var(--font-mono);text-decoration:none}.interview-details-toggle{display:block;margin-top:28px;padding:0;color:var(--text-tertiary);border:0;background:none;font:12px var(--font-mono);cursor:pointer}.interview-details{margin-top:14px;padding:14px 16px;border-left:2px solid #276ef1;background:#11151a;color:var(--text-secondary);font-size:12px;line-height:1.5}.interview-details p{margin:6px 0}.interview-details b{color:var(--text-primary)}@media(max-width:680px){.interview-page{padding:36px 16px 64px}.interview-head{align-items:start;flex-direction:column}.interview-head h1{font-size:32px}.interview-clock{width:100%;box-sizing:border-box}.interview-summary{align-items:start;flex-wrap:wrap;gap:12px}.interview-summary-meter{order:3;flex-basis:100%}.interview-summary-note{margin-left:auto}.interview-task{grid-template-columns:30px minmax(0,1fr) auto 14px;gap:8px;padding:14px 2px}.interview-task-copy b{font-size:13px}.interview-task-state{font-size:10px}}
    `}</style>
  </main>;
}

function Setup({ tasks, duration, setDuration, onStart }: { tasks: InterviewTask[]; duration: number; setDuration: (value: number) => void; onStart: () => void }) {
  return <main className="interview-page"><div className="interview-head"><div><span className="interview-eyebrow">INTERVIEW MODE · GO / CONCURRENCY</span><h1>Проверь себя в бою</h1><p>Три случайные задачи, ограниченное время и честный разбор после сессии. Решения и скорость остаются только у тебя.</p></div><div className="interview-clock"><strong>3</strong><span>задачи в сессии</span></div></div><section className="interview-setup"><span className="interview-setup-label">ВЫБЕРИ ЛИМИТ</span><div className="interview-duration-options">{DURATIONS.map((item) => <button type="button" key={item.value} className={duration === item.value ? "selected" : ""} onClick={() => setDuration(item.value)}><b>{item.label}</b><small>{item.hint}</small></button>)}</div><div className="interview-rules"><p><b>Внутри:</b> задачи из каналов, синхронизации, worker pool и highload.</p><p><b>После:</b> статус каждой задачи, темы для повторения и ссылка в кабинет.</p></div><button className="interview-finish" type="button" onClick={onStart} disabled={tasks.length < 3}>Начать интервью <span aria-hidden="true">→</span></button>{tasks.length < 3 && <small className="interview-warning">Недостаточно задач для новой сессии.</small>}</section><style>{`.interview-setup{max-width:620px;margin-top:28px;padding:20px;border:1px solid #2a3039;border-radius:7px;background:#14171c}.interview-setup-label{color:var(--text-tertiary);font:10px var(--font-mono);letter-spacing:.1em}.interview-duration-options{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:13px}.interview-duration-options button{display:flex;flex-direction:column;gap:5px;min-height:68px;padding:12px;text-align:left;color:var(--text-secondary);border:1px solid #343a45;border-radius:6px;background:#11151a;cursor:pointer}.interview-duration-options button:hover,.interview-duration-options button.selected{color:var(--text-primary);border-color:#276ef1;background:#151d2b}.interview-duration-options b{font-size:13px}.interview-duration-options small{color:var(--text-tertiary);font:10px var(--font-mono)}.interview-rules{margin:20px 0 2px;padding:12px 14px;border-left:2px solid #276ef1;background:#11151a;color:var(--text-secondary);font-size:12px;line-height:1.5}.interview-rules p{margin:5px 0}.interview-rules b{color:var(--text-primary)}.interview-warning{display:block;margin-top:10px;color:#ff9aa4}@media(max-width:560px){.interview-duration-options{grid-template-columns:1fr}.interview-setup{padding:16px}}
    `}</style></main>;
}
