"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl, useAuth } from "@/lib/auth";

type AdminData = {
  stats: { users: number; solved: number; activeUsers7d: number };
  users: Array<{ id: string; email: string; level: string | null; createdAt: string; _count: { progress: number } }>;
};

export function AdminView() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "forbidden" | "error">("loading");

  useEffect(() => {
    if (loading) return;
    if (!user) { setState("forbidden"); return; }
    let cancelled = false;
    fetch(`${apiUrl()}/admin/overview`, { credentials: "include" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) throw new Error("forbidden");
        if (!response.ok) throw new Error("error");
        return response.json() as Promise<AdminData>;
      })
      .then((payload) => { if (!cancelled) { setData(payload); setState("ready"); } })
      .catch((error: Error) => { if (!cancelled) setState(error.message === "forbidden" ? "forbidden" : "error"); });
    return () => { cancelled = true; };
  }, [loading, user]);

  if (state === "loading") return <div className="admin-page"><div className="admin-loading">Загрузка консоли…</div></div>;
  if (state === "forbidden") return <div className="admin-page"><div className="admin-empty"><span className="admin-empty-code">403</span><h1>Доступ ограничен</h1><p>Эта консоль доступна только участникам команды GraphLMS.</p><Link className="quiet-action" href={user ? "/account" : "/auth"}>{user ? "Вернуться в кабинет" : "Войти"}</Link></div></div>;
  if (state === "error" || !data) return <div className="admin-page"><div className="admin-empty"><h1>Консоль недоступна</h1><p>Не удалось получить данные API. Проверь, что сервер запущен.</p></div></div>;

  return <div className="admin-page"><div className="admin-head"><div><span className="eyebrow">GRAPH / ADMIN</span><h1>Операционный обзор</h1><p>Пользователи, активность и сигнал качества обучения.</p></div><Link href="/" className="quiet-action">На главную ↗</Link></div><div className="admin-stats"><Stat value={data.stats.users} label="пользователей" /><Stat value={data.stats.activeUsers7d} label="активны за 7 дней" /><Stat value={data.stats.solved} label="решений всего" /></div><section className="admin-table-wrap"><div className="admin-table-title"><h2>Последние регистрации</h2><span>{data.users.length} записей</span></div><div className="admin-table"><div className="admin-table-row admin-table-header"><span>Пользователь</span><span>Уровень</span><span>Прогресс</span><span>Регистрация</span></div>{data.users.map((entry) => <div className="admin-table-row" key={entry.id}><span className="admin-user"><i>{entry.email.slice(0, 1).toUpperCase()}</i><b>{entry.email}</b></span><span>{entry.level ?? "не выбран"}</span><span>{entry._count.progress} items</span><span>{new Date(entry.createdAt).toLocaleDateString("ru-RU")}</span></div>)}</div></section></div>;
}

function Stat({ value, label }: { value: number; label: string }) { return <div className="admin-stat"><strong>{value.toLocaleString("ru-RU")}</strong><span>{label}</span></div>; }
