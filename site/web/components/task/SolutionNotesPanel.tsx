"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Callout } from "@/ds";
import { apiRequest, AuthError, useAuth } from "@/lib/auth";

type SolutionNote = {
  id: string;
  body: string;
  createdAt: string;
  author: string;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function SolutionNotesPanel({ taskId, solved }: { taskId: string; solved: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<SolutionNote[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!solved || !user) return;
    setLoading(true);
    try {
      const data = await apiRequest<SolutionNote[]>(`/me/tasks/${encodeURIComponent(taskId)}/solution-notes`, {}, true);
      setNotes(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof AuthError && err.status === 403
        ? "PASS ещё синхронизируется с сервером. Подожди несколько секунд и открой вкладку снова."
        : "Не удалось загрузить заметки.");
    } finally {
      setLoading(false);
    }
  }, [solved, taskId, user]);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (trimmed.length < 24 || sending) return;
    setSending(true);
    setError(null);
    try {
      const note = await apiRequest<SolutionNote>(`/me/tasks/${encodeURIComponent(taskId)}/solution-notes`, {
        method: "POST",
        body: JSON.stringify({ body: trimmed }),
      }, true);
      setNotes((current) => [...current.filter((item) => item.id !== note.id), note]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Не удалось опубликовать заметку.");
    } finally {
      setSending(false);
    }
  }

  if (!solved) {
    return <Callout tone="note" title="Откроется после PASS">Здесь собраны короткие объяснения от других решивших. Код и готовые фрагменты не публикуются.</Callout>;
  }

  if (authLoading) return null;
  if (!user) {
    return <Callout tone="note" title="Войдите после решения"><a href={`/auth?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`} style={{ color: "var(--accent-text)" }}>Открыть вход</a></Callout>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100%", flexDirection: "column", gap: 18 }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: "var(--heading-sm)", fontWeight: "var(--fw-semibold)" }}>Заметки решивших</h2>
        <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--body-sm)", lineHeight: "20px" }}>Инвариант, trade-off или ошибка, которая помогла найти решение. Без исходного кода.</p>
      </div>

      {error && <Callout tone="warning" title="Не получилось">{error}</Callout>}

      {loading ? <div style={{ color: "var(--text-tertiary)", fontSize: "var(--body-sm)" }}>Загружаем заметки...</div> : notes.length === 0 ? (
        <div style={{ padding: "18px 0", color: "var(--text-tertiary)", fontSize: "var(--body-sm)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>Пока нет заметок. Зафиксируйте главный вывод из решения.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {notes.map((note) => <article key={note.id} style={{ paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6, color: "var(--text-tertiary)", fontSize: "var(--label-sm)" }}><span style={{ color: "var(--text-secondary)", fontWeight: "var(--fw-medium)" }}>{note.author}</span><time dateTime={note.createdAt} style={{ flexShrink: 0 }}>{formatDate(note.createdAt)}</time></div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "var(--text-primary)", fontSize: "var(--body-sm)", lineHeight: "21px" }}>{note.body}</p>
          </article>)}
        </div>
      )}

      <form onSubmit={submit} style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 9 }}>
        <label htmlFor="solution-note" style={{ color: "var(--text-secondary)", fontSize: "var(--label-md)", fontWeight: "var(--fw-semibold)" }}>Ваш вывод</label>
        <textarea id="solution-note" value={body} onChange={(event) => setBody(event.target.value.slice(0, 1500))} maxLength={1500} minLength={24} rows={4} placeholder="Например: какой инвариант сделал решение очевидным?" style={{ width: "100%", resize: "vertical", minHeight: 92, padding: "10px 11px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--bg-canvas)", color: "var(--text-primary)", font: "inherit", lineHeight: 1.45, boxSizing: "border-box" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}><span style={{ color: "var(--text-tertiary)", fontSize: "var(--label-sm)" }}>{body.length}/1500</span><Button type="submit" size="sm" disabled={body.trim().length < 24 || sending} loading={sending}>Опубликовать</Button></div>
      </form>
    </div>
  );
}
