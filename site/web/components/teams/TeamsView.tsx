"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Callout } from "@/ds";
import { apiRequest, AuthError, useAuth } from "@/lib/auth";

type TeamSummary = { id: string; name: string; role: string; _count: { members: number; tracks: number } };
type TeamDetail = { id: string; name: string; role: string; members: { userId: string; email: string; role: string }[]; tracks: { id: string; name: string; description?: string | null; items: { id: string; taskId: string; position: number }[] }[] };
type Report = { team: { name: string }; totalTasks: number; members: { userId: string; email: string; role: string; passed: number }[]; tracks: { id: string; name: string; tasks: number; completed: number }[] };

export function TeamsView({ taskOptions }: { taskOptions: { id: string; title: string }[] }) {
  const { user, loading: authLoading } = useAuth();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selected, setSelected] = useState<TeamDetail | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [trackName, setTrackName] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [trackId, setTrackId] = useState("");
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const selectedTrack = selected?.tracks.find((track) => track.id === trackId) ?? selected?.tracks[0];
  const selectedTaskSet = useMemo(() => new Set(selectedTrack?.items.map((item) => item.taskId) ?? []), [selectedTrack]);

  const loadTeams = useCallback(async () => {
    if (!user) return;
    try { setTeams(await apiRequest<TeamSummary[]>("/me/teams", {}, true)); }
    catch (err) { setError(err instanceof Error ? err.message : "Не удалось загрузить команды."); }
  }, [user]);
  const loadTeam = useCallback(async (id: string) => {
    try {
      const [detail, nextReport] = await Promise.all([
        apiRequest<TeamDetail>(`/me/teams/${id}`, {}, true),
        apiRequest<Report>(`/me/teams/${id}/report`, {}, true),
      ]);
      setSelected(detail); setReport(nextReport); setTrackId(detail.tracks[0]?.id ?? "");
    } catch (err) { setError(err instanceof Error ? err.message : "Не удалось загрузить пространство."); }
  }, []);
  useEffect(() => { void loadTeams(); }, [loadTeams]);

  async function submit(event: FormEvent, action: () => Promise<void>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(null);
    try { await action(); } catch (err) { setError(err instanceof AuthError ? err.message : err instanceof Error ? err.message : "Операция не выполнена."); } finally { setBusy(false); }
  }
  if (authLoading) return <main className="teams-page"><p>Загрузка...</p></main>;
  if (!user) return <main className="teams-page"><Callout tone="note" title="Командные пространства доступны после входа"><Link href="/auth?next=%2Fteams" style={{ color: "var(--accent-text)" }}>Открыть вход</Link></Callout></main>;

  async function importSelectedItems() {
    if (!selected || !selectedTrack || !taskIds.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/me/teams/${selected.id}/tracks/${selectedTrack.id}/items`, { method: "POST", body: JSON.stringify({ taskIds }) }, true);
      setTaskIds([]);
      await loadTeam(selected.id);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : err instanceof Error ? err.message : "Операция не выполнена.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="teams-page">
    <div className="teams-head"><div><span className="eyebrow">TEAM WORKSPACE</span><h1>Командные пространства</h1><p>Приватные треки и агрегированный прогресс. Исходный код участников не виден команде.</p></div></div>
    {error && <Callout tone="warning" title="Не получилось">{error}</Callout>}
    <section className="teams-layout">
      <aside className="teams-sidebar">
        <h2>Ваши команды</h2>
        {teams.map((team) => <button key={team.id} type="button" className={selected?.id === team.id ? "team-choice active" : "team-choice"} onClick={() => void loadTeam(team.id)}><strong>{team.name}</strong><small>{team._count.members} участников · {team._count.tracks} треков</small></button>)}
        {teams.length === 0 && <p className="teams-muted">Создайте первое пространство для своей команды.</p>}
        <form onSubmit={(event) => submit(event, async () => { const created = await apiRequest<TeamSummary>("/me/teams", { method: "POST", body: JSON.stringify({ name: teamName }) }, true); setTeamName(""); setTeams((current) => [...current, created]); await loadTeam(created.id); })} className="team-form"><input aria-label="Название команды" value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Название команды" maxLength={80} /><Button size="sm" type="submit" disabled={!teamName.trim() || busy}>Создать</Button></form>
      </aside>
      {selected ? <div className="team-main">
        <div className="team-main-head"><div><span className="eyebrow">PRIVATE SPACE</span><h2>{selected.name}</h2></div><span className="team-role">{selected.role === "owner" ? "владелец" : "участник"}</span></div>
        <div className="team-panels">
          <section className="team-panel"><h3>Участники</h3><div className="member-list">{selected.members.map((member) => <div className="member-row" key={member.userId}><span>{member.email}</span><small>{member.role}</small></div>)}</div>{selected.role === "owner" && <form onSubmit={(event) => submit(event, async () => { await apiRequest(`/me/teams/${selected.id}/members`, { method: "POST", body: JSON.stringify({ email: memberEmail }) }, true); setMemberEmail(""); await loadTeam(selected.id); })} className="stack-form"><input type="email" aria-label="Почта участника" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="почта зарегистрированного участника" /><Button size="sm" type="submit" disabled={!memberEmail.trim() || busy}>Добавить</Button></form>}</section>
          <section className="team-panel"><h3>Треки</h3><div className="track-list">{selected.tracks.map((track) => <button type="button" className={track.id === trackId ? "track-choice active" : "track-choice"} key={track.id} onClick={() => { setTrackId(track.id); setTaskIds([]); }}><strong>{track.name}</strong><small>{track.items.length} задач</small></button>)}</div>{selected.role === "owner" && <form onSubmit={(event) => submit(event, async () => { await apiRequest(`/me/teams/${selected.id}/tracks`, { method: "POST", body: JSON.stringify({ name: trackName, description: trackDescription }) }, true); setTrackName(""); setTrackDescription(""); await loadTeam(selected.id); })} className="stack-form"><input aria-label="Название трека" value={trackName} onChange={(event) => setTrackName(event.target.value)} placeholder="Новый приватный трек" maxLength={100} /><input aria-label="Описание трека" value={trackDescription} onChange={(event) => setTrackDescription(event.target.value)} placeholder="Цель трека (необязательно)" maxLength={500} /><Button size="sm" type="submit" disabled={!trackName.trim() || busy}>Создать трек</Button></form>}</section>
        </div>
        {selectedTrack && <section className="team-panel team-import"><div className="panel-heading"><div><h3>{selectedTrack.name}</h3><p>{selectedTrack.description || "Выберите задачи из каталога курса и соберите последовательность для команды."}</p></div><span>{selectedTaskSet.size} задач</span></div>{selected.role === "owner" && <><div className="task-picker">{taskOptions.map((task) => <label key={task.id}><input type="checkbox" checked={taskIds.includes(task.id) || selectedTaskSet.has(task.id)} disabled={selectedTaskSet.has(task.id)} onChange={(event) => setTaskIds((current) => event.target.checked ? [...current, task.id] : current.filter((id) => id !== task.id))} /><span>{task.id} · {task.title}</span></label>)}</div><Button size="sm" onClick={() => void importSelectedItems()} disabled={!taskIds.length || busy}>Импортировать выбранные</Button></>}</section>}
        {report && <section className="team-panel"><div className="panel-heading"><div><h3>Отчёт о навыках</h3><p>Только подтверждённые PASS, без исходного кода и содержимого попыток.</p></div><span>{report.totalTasks} задач</span></div><div className="report-grid">{report.members.map((member) => <div className="report-row" key={member.userId}><span>{member.email}</span><strong>{member.passed}/{report.totalTasks}</strong></div>)}</div><div className="track-report">{report.tracks.map((track) => <div key={track.id}><span>{track.name}</span><strong>{track.completed}/{track.tasks * report.members.length}</strong></div>)}</div></section>}
      </div> : <div className="team-empty"><h2>Выберите или создайте команду</h2><p>Командный отчёт показывает только факт прохождения задач и помогает планировать следующий шаг.</p></div>}
    </section>
    <style>{`.teams-page{max-width:1120px;margin:0 auto;padding:48px 28px 88px;color:var(--text-primary)}.teams-head{margin-bottom:24px}.teams-head h1{margin:8px 0;font-size:34px}.teams-head p,.team-panel p{color:var(--text-secondary);line-height:1.5}.eyebrow{font:11px var(--font-mono);letter-spacing:.09em;color:var(--text-tertiary)}.teams-layout{display:grid;grid-template-columns:260px minmax(0,1fr);gap:18px}.teams-sidebar,.team-panel,.team-empty{border:1px solid var(--border-default);background:var(--bg-elevated);padding:16px;border-radius:7px}.teams-sidebar h2,.team-panel h3{margin:0 0 12px;font-size:15px}.team-choice,.track-choice{display:flex;width:100%;flex-direction:column;align-items:flex-start;gap:4px;padding:10px;border:1px solid transparent;background:transparent;color:var(--text-primary);text-align:left;cursor:pointer;border-radius:5px}.team-choice:hover,.team-choice.active,.track-choice:hover,.track-choice.active{background:var(--bg-hover);border-color:var(--border-default)}.team-choice small,.track-choice small,.team-role,.teams-muted{color:var(--text-tertiary);font-size:12px}.team-form,.stack-form{display:flex;gap:7px;margin-top:14px}.stack-form{flex-wrap:wrap}.team-form input,.stack-form input{min-width:0;flex:1;height:32px;padding:0 9px;border:1px solid var(--border-default);border-radius:4px;background:var(--bg-canvas);color:var(--text-primary)}.team-main{min-width:0}.team-main-head,.panel-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.team-main-head h2{margin:6px 0 0;font-size:24px}.team-panels{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}.member-list,.track-list{display:flex;flex-direction:column;gap:4px}.member-row{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-subtle);font-size:13px}.member-row small{color:var(--text-tertiary)}.team-import{margin-bottom:12px}.task-picker{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;max-height:230px;overflow:auto;margin-bottom:12px}.task-picker label{display:flex;gap:7px;align-items:flex-start;padding:7px;color:var(--text-secondary);font-size:12px}.report-grid,.track-report{display:grid;gap:6px}.report-row,.track-report>div{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border-subtle);font-size:13px}.track-report{margin-top:14px}.team-empty{min-height:300px;display:grid;place-content:center;text-align:center;color:var(--text-secondary)}@media(max-width:760px){.teams-page{padding:32px 16px 60px}.teams-layout,.team-panels{grid-template-columns:1fr}.task-picker{grid-template-columns:1fr}}`}</style>
  </main>;
}
