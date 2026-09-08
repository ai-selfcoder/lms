"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl, useAuth } from "@/lib/auth";
import type { ContentHealthReport } from "@/lib/contentHealth";

type AdminData = {
  stats: {
    users: number;
    solved: number;
    activeUsers7d: number;
    usersWithProgress: number;
    activationRate: number;
    averageSolvedPerActive: number;
    solvedLast7d: number;
    learningEvents7d: number;
    meaningfulUsers7d: number;
  };
  taskQuality: {
    windowDays: number;
    feedback: number;
    failed: number;
    recoveredUsers: number;
    items: Array<{
      courseId: string;
      taskId: string;
      feedback: number;
      failed: number;
      passed: number;
      failureRate: number;
      recoveredUsers: number;
      startedUsers: number;
      completedUsers: number;
    }>;
  };
  users: Array<{
    id: string;
    email: string;
    level: string | null;
    createdAt: string;
    _count: { progress: number };
  }>;
};

export function AdminView({ contentHealth }: { contentHealth: ContentHealthReport }) {
  const { user, loading } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "forbidden" | "error">("loading");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setState("forbidden");
      return;
    }
    let cancelled = false;
    fetch(`${apiUrl()}/admin/overview`, { credentials: "include" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) throw new Error("forbidden");
        if (!response.ok) throw new Error("error");
        return response.json() as Promise<AdminData>;
      })
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setState("ready");
        }
      })
      .catch((error: Error) => {
        if (!cancelled) setState(error.message === "forbidden" ? "forbidden" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  if (state === "loading") return <div className="admin-page"><div className="admin-loading">Загрузка консоли...</div></div>;
  if (state === "forbidden") {
    return (
      <div className="admin-page">
        <div className="admin-empty">
          <span className="admin-empty-code">403</span>
          <h1>Доступ ограничен</h1>
          <p>Эта консоль доступна только участникам команды GraphLMS.</p>
          <Link className="quiet-action" href={user ? "/account" : "/auth"}>{user ? "Вернуться в кабинет" : "Войти"}</Link>
        </div>
      </div>
    );
  }
  if (state === "error" || !data) {
    return <div className="admin-page"><div className="admin-empty"><h1>Консоль недоступна</h1><p>Не удалось получить данные API. Проверь, что сервер запущен.</p></div></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div><span className="eyebrow">GRAPH / ADMIN</span><h1>Операционный обзор</h1><p>Пользователи, активность и сигнал качества обучения.</p></div>
        <Link href="/" className="quiet-action">На главную ↗</Link>
      </div>

      <div className="admin-stats">
        <Stat value={data.stats.users} label="пользователей" />
        <Stat value={data.stats.activeUsers7d} label="активны за 7 дней" />
        <Stat value={data.stats.solved} label="решений всего" />
      </div>

      <section className="admin-quality" aria-label="Воронка обучения">
        <div className="admin-quality-head"><div><span className="eyebrow">LEARNING FUNNEL</span><h2>Здоровье петли</h2></div><span className="admin-quality-window">последние 7 дней</span></div>
        <div className="admin-quality-grid">
          <QualityStat value={`${data.stats.activationRate}%`} label="дошли до первой активности" detail={`${data.stats.usersWithProgress} из ${data.stats.users}`} />
          <QualityStat value={data.stats.averageSolvedPerActive.toLocaleString("ru-RU")} label="решений на активного" detail="за всё время" />
          <QualityStat value={data.stats.solvedLast7d} label="решений за 7 дней" detail="по всем курсам" />
          <QualityStat value={data.stats.meaningfulUsers7d} label="завершили цикл" detail={`${data.stats.learningEvents7d} событий за 7 дней`} />
        </div>
      </section>

      <ContentQuality report={contentHealth} />
      <TaskQuality quality={data.taskQuality} report={contentHealth} />

      <section className="admin-table-wrap">
        <div className="admin-table-title"><h2>Последние регистрации</h2><span>{data.users.length} записей</span></div>
        <div className="admin-table">
          <div className="admin-table-row admin-table-header"><span>Пользователь</span><span>Уровень</span><span>Прогресс</span><span>Регистрация</span></div>
          {data.users.map((entry) => (
            <div className="admin-table-row" key={entry.id}>
              <span className="admin-user"><i>{entry.email.slice(0, 1).toUpperCase()}</i><b>{entry.email}</b></span>
              <span>{entry.level ?? "не выбран"}</span><span>{entry._count.progress} items</span><span>{new Date(entry.createdAt).toLocaleDateString("ru-RU")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TaskQuality({ quality, report }: { quality: AdminData["taskQuality"]; report: ContentHealthReport }) {
  const taskByKey = new Map(report.catalog.map((task) => [`${task.courseId}:${task.taskId}`, task]));
  return (
    <section className="admin-task-quality" aria-label="Сигналы качества задач">
      <div className="admin-quality-head"><div><span className="eyebrow">TASK QUALITY</span><h2>Задачи с повышенным FAIL rate</h2></div><span className="admin-quality-window">последние {quality.windowDays} дней</span></div>
      {quality.items.length === 0 ? <p className="admin-content-empty">Недостаточно обратной связи: сигнал появится после трёх проверок задачи.</p> : <div className="admin-task-quality-list">
        {quality.items.map((item) => {
          const task = taskByKey.get(`${item.courseId}:${item.taskId}`);
          const title = task?.title ?? `${item.courseId} · задача ${item.taskId}`;
          const meta = <><span>FAIL {item.failureRate}%</span><span>{item.failed}/{item.feedback} проверок</span><span>вернулись и прошли: {item.recoveredUsers}</span><span>завершили: {item.completedUsers}/{item.startedUsers}</span></>;
          return task ? <Link className="admin-task-quality-row" href={task.href} key={`${item.courseId}:${item.taskId}`}><strong>{title}</strong><small>{item.courseId} · {item.taskId}</small><div>{meta}</div></Link> : <div className="admin-task-quality-row" key={`${item.courseId}:${item.taskId}`}><strong>{title}</strong><small>{item.courseId} · {item.taskId}</small><div>{meta}</div></div>;
        })}
      </div>}
    </section>
  );
}

function ContentQuality({ report }: { report: ContentHealthReport }) {
  const percentage = (count: number) => report.tasks ? `${Math.round((count / report.tasks) * 100)}%` : "0%";
  return (
    <section className="admin-content-quality" aria-label="Здоровье контента">
      <div className="admin-quality-head"><div><span className="eyebrow">CONTENT HEALTH</span><h2>Здоровье контента</h2></div><span className="admin-quality-window">{report.tasks} задач</span></div>
      <div className="admin-content-metrics">
        <ContentMetric value={report.withTheory} label="теория" percent={percentage(report.withTheory)} />
        <ContentMetric value={report.withSolution} label="решение" percent={percentage(report.withSolution)} />
        <ContentMetric value={report.withHints} label="подсказки" percent={percentage(report.withHints)} />
        <ContentMetric value={report.withEditorial} label="editorial notes" percent={percentage(report.withEditorial)} />
        <ContentMetric value={report.withNextStep} label="есть следующий шаг" percent={percentage(report.withNextStep)} />
        <ContentMetric value={report.brokenLinks} label="битых ссылок" percent={`${report.linksChecked} проверено`} />
      </div>
      <div className="admin-content-attention">
        <div className="admin-content-attention-head"><strong>Требуют внимания</strong><span>{report.needsAttention}</span></div>
        {report.attention.length === 0 ? <p className="admin-content-empty">Все задачи покрыты всеми слоями контента.</p> : report.attention.map((task) => (
          <Link className="admin-content-row" href={task.href} key={`${task.courseId}:${task.taskId}`}>
            <span><b>{task.title}</b><small>{task.courseId} · {task.taskId}</small></span>
            <em>{task.missing.join(" · ")}</em>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ContentMetric({ value, label, percent }: { value: number; label: string; percent: string }) {
  return <div className="admin-content-metric"><strong>{value}</strong><span>{label}</span><small>{percent}</small></div>;
}

function Stat({ value, label }: { value: number; label: string }) { return <div className="admin-stat"><strong>{value.toLocaleString("ru-RU")}</strong><span>{label}</span></div>; }
function QualityStat({ value, label, detail }: { value: string | number; label: string; detail: string }) { return <div className="admin-quality-stat"><strong>{typeof value === "number" ? value.toLocaleString("ru-RU") : value}</strong><span>{label}</span><small>{detail}</small></div>; }
