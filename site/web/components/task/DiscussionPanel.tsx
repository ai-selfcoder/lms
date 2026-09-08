"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Callout } from "@/ds";
import { apiRequest, useAuth } from "@/lib/auth";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: string;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function DiscussionPanel({ taskId }: { taskId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Comment[]>(`/tasks/${encodeURIComponent(taskId)}/comments`);
      setComments(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError("Не удалось загрузить обсуждение.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      const comment = await apiRequest<Comment>(`/me/tasks/${encodeURIComponent(taskId)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: trimmed }),
      }, true);
      setComments((current) => [...current, comment]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Не удалось отправить комментарий.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100%", flexDirection: "column", gap: 18 }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: "var(--heading-sm)", fontWeight: "var(--fw-semibold)" }}>Обсуждение</h2>
        <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--body-sm)", lineHeight: "20px" }}>
          Вопросы и наблюдения по этой задаче, без готового кода.
        </p>
      </div>

      {error && <Callout tone="warning" title="Не получилось">{error}</Callout>}

      {loading ? (
        <div style={{ color: "var(--text-tertiary)", fontSize: "var(--body-sm)" }}>Загружаем комментарии...</div>
      ) : comments.length === 0 ? (
        <div style={{ padding: "18px 0", color: "var(--text-tertiary)", fontSize: "var(--body-sm)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
              Пока нет сообщений. Поделитесь первым вопросом или наблюдением.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {comments.map((comment) => (
            <article key={comment.id} style={{ paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6, color: "var(--text-tertiary)", fontSize: "var(--label-sm)" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: "var(--fw-medium)", overflow: "hidden", textOverflow: "ellipsis" }}>{comment.author}</span>
                <time dateTime={comment.createdAt} style={{ flexShrink: 0 }}>{formatDate(comment.createdAt)}</time>
              </div>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "var(--text-primary)", fontSize: "var(--body-sm)", lineHeight: "21px" }}>{comment.body}</p>
            </article>
          ))}
        </div>
      )}

      {authLoading ? null : user ? (
        <form onSubmit={submit} style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 9 }}>
          <label htmlFor="task-comment" style={{ color: "var(--text-secondary)", fontSize: "var(--label-md)", fontWeight: "var(--fw-semibold)" }}>Ваш комментарий</label>
          <textarea
            id="task-comment"
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, 2000))}
            maxLength={2000}
            rows={4}
            placeholder="Например: на каком шаге возникает гонка? Не вставляйте код."
            style={{ width: "100%", resize: "vertical", minHeight: 92, padding: "10px 11px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--bg-canvas)", color: "var(--text-primary)", font: "inherit", lineHeight: 1.45, boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "var(--text-tertiary)", fontSize: "var(--label-sm)" }}>{body.length}/2000</span>
            <Button type="submit" size="sm" disabled={!body.trim() || sending} loading={sending}>Отправить</Button>
          </div>
        </form>
      ) : (
        <Callout tone="note" title="Войдите, чтобы написать">
          <a href={`/auth?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`} style={{ color: "var(--accent-text)" }}>Открыть вход</a>
        </Callout>
      )}
    </div>
  );
}
