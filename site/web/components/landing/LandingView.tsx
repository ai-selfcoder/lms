"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLearningEvents, useProgress } from "@/lib/progress";
import { getDiagnosticRecommendation, type DiagnosticAnswers } from "@/lib/diagnostic";
import OnboardingDiagnostic from "./OnboardingDiagnostic";

interface TopicProp { num: number; label: string; taskCount: number; taskIds: string[]; diff: { e: number; m: number; h: number }; isReview: boolean }
interface ChapterProp { slug: string; title: string; order: number }
interface CourseProp { id: string; slug: string; title: string; short: string; description: string; accent: string; chapters: number; tasks: number; href: string }

function Arrow() { return <span aria-hidden="true" className="dash-arrow">↗</span>; }
function Difficulty({ diff }: { diff: TopicProp["diff"] }) { return <span className="dash-difficulty" aria-label={`${diff.e} лёгких, ${diff.m} средних, ${diff.h} сложных`}><i className="easy" />{diff.e}<i className="medium" />{diff.m}<i className="hard" />{diff.h}</span>; }

export default function LandingView({ taskCount, chapterCount, firstTaskSlug, topics, chapters, courses }: { taskCount: number; chapterCount: number; firstTaskSlug: string | null; topics: TopicProp[]; chapters: ChapterProp[]; courses: CourseProp[] }) {
  const { count, isSolved } = useProgress(taskCount, "go");
  const events = useLearningEvents();
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState("go");
  const [diagnosticRoute, setDiagnosticRoute] = useState<string | null>(null);
  useEffect(() => {
    try {
      setGoal(window.localStorage.getItem("graphlms.goal.v1") ?? "go");
      const raw = window.localStorage.getItem("graphlms.diagnostic.v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { answers?: DiagnosticAnswers };
        setDiagnosticRoute(getDiagnosticRecommendation(parsed.answers ?? {})?.route ?? null);
      }
    } catch { /* private mode */ }
  }, []);
  const chooseGoal = (value: string) => {
    setGoal(value);
    try { window.localStorage.setItem("graphlms.goal.v1", value); } catch { /* private mode */ }
  };
  const percent = taskCount ? Math.round((count / taskCount) * 100) : 0;
  const filtered = useMemo(() => topics.filter((t) => t.label.toLowerCase().includes(query.toLowerCase())), [topics, query]);
  const nextTopic = topics.find((t) => t.taskIds.some((id) => !isSolved(id, "go"))) ?? topics[0];
  const nextTask = nextTopic?.taskIds.find((id) => !isSolved(id, "go")) ?? nextTopic?.taskIds[0] ?? firstTaskSlug ?? "01";
  const recentAction = useMemo(() => {
    const started = [...events]
      .filter((event) => event.type === "started" && event.itemId !== "onboarding:diagnostic")
      .sort((a, b) => b.at.localeCompare(a.at));
    for (const event of started) {
      if (event.itemId.startsWith("os:lab:")) return { href: `/os/sim/${event.itemId.slice("os:lab:".length)}`, label: "Продолжить лабораторию" };
      if (event.itemId.startsWith("os:chapter:")) return { href: `/os/book/${event.itemId.slice("os:chapter:".length)}`, label: "Продолжить главу ОС" };
      if (event.itemId.startsWith("go-basics:chapter:")) return { href: `/go-basics/book/${event.itemId.slice("go-basics:chapter:".length)}`, label: "Продолжить основы Go" };
      if ((!event.courseId || event.courseId === "go") && /^\d+$/.test(event.itemId) && !isSolved(event.itemId, "go")) return { href: `/go/tasks/${event.itemId}`, label: "Продолжить задачу" };
    }
    return null;
  }, [events, isSolved]);
  const diagnosticHref = diagnosticRoute === "os" ? "/os/book/process" : diagnosticRoute === "go-basics" ? "/go-basics/book/hello" : diagnosticRoute === "interview" ? "/go/interview" : diagnosticRoute === "go" ? `/go/tasks/${nextTask}` : null;
  const trainerHref = recentAction?.href ?? diagnosticHref ?? (goal === "os" ? "/os/book/process" : goal === "basics" ? "/go-basics/book/hello" : goal === "interview" ? "/go/practice" : `/go/tasks/${nextTask}`);
  const trainerLabel = recentAction?.label ?? (count ? "Продолжить трек" : "Начать с первой задачи");

  return <div className="workspace-home">
    <section className="workspace-hero">
      <div className="hero-intro"><div className="eyebrow"><span className="live-dot" /> GO / CONCURRENCY</div><h1>Практика, которая<br /><span>остаётся в руках.</span></h1><p>Короткая теория, задачи из реального кода и проверка через <code>go test -race</code>. Двигайся в своём темпе.</p><div className="hero-links"><Link className="primary-action" href={trainerHref}>{trainerLabel}<Arrow /></Link><Link className="quiet-action" href="/go/book">Смотреть учебник <Arrow /></Link></div></div>
      <div className="code-card" aria-label="Пример задания"><div className="code-card-head"><span className="traffic"><i /><i /><i /></span><span>worker_pool.go</span><b>RUNNING</b></div><pre><code><em>func</em> <strong>fanIn</strong>(sources ...&lt;-chan Job) &lt;-chan Result {'{'}
  out := <em>make</em>(<strong>chan</strong> Result)
  <em>for</em> _, source := <em>range</em> sources {'{'}
    <em>go</em> forward(source, out)
  {'}'}
  <em>return</em> out
{'}'}</code></pre><div className="code-card-foot"><span><i className="live-dot" /> 4 теста пройдено</span><span>12ms</span></div></div>
    </section>

    <section className="goal-picker" aria-labelledby="goal-title"><div><div className="eyebrow">00 / START HERE</div><h2 id="goal-title">Выбери ближайшую цель</h2><p>Маршрут можно изменить в любой момент. Мы сохраним прогресс и покажем следующий конкретный шаг.</p></div><div className="goal-options">{[{ id: "go", label: "Освоить Go", href: "/go/tasks/01" }, { id: "concurrency", label: "Улучшить конкурентность", href: `/go/tasks/${nextTask}` }, { id: "os", label: "Понять ОС", href: "/os/book/process" }, { id: "interview", label: "Подготовиться к интервью", href: "/go/practice" }, { id: "basics", label: "Начать с основ Go", href: "/go-basics/book/hello" }].map((item) => <Link key={item.id} href={item.href} className={`goal-option${goal === item.id ? " selected" : ""}`} onClick={() => chooseGoal(item.id)}><span>{item.label}</span><Arrow /></Link>)}</div></section>

    <OnboardingDiagnostic nextTask={nextTask} />

    <section className="overview-grid" aria-label="Прогресс"><div className="overview-progress surface-panel"><div className="panel-label"><span>ТЕКУЩИЙ ПРОГРЕСС</span><Link href="/account">Открыть профиль <Arrow /></Link></div><div className="progress-number"><strong>{count}</strong><span>из {taskCount} задач</span><b>{percent}%</b></div><div className="progress-line"><i style={{ width: `${percent}%` }} /></div><div className="progress-meta"><span>{count ? `Следующая: ${nextTopic?.label ?? "задача"}` : "Начни с первой задачи и собери серию"}</span><span>{count * 12} XP</span></div></div>
      <Link className="next-task surface-panel" href={trainerHref}><div className="panel-label"><span>СЛЕДУЮЩИЙ ШАГ</span><Arrow /></div><div className="next-index">{String(nextTopic?.num ?? 1).padStart(2, "0")} / TOPIC</div><strong>{nextTopic?.label ?? "Каналы и select"}</strong><span>{count ? "Продолжить с места, где остановился" : "Напиши первый worker pool"}</span></Link>
      <div className="overview-stat surface-panel"><span className="stat-big">{chapterCount}</span><span>глав в учебнике</span><Link href="/go/book">Читать главы <Arrow /></Link></div></section>

    <section className="courses-block"><div className="section-head"><div><div className="eyebrow">01 / LEARNING PATHS</div><h2>Три слоя одной системы</h2><p>Выбери точку входа или пройди путь целиком.</p></div></div><div className="course-grid">{courses.map((course, index) => <Link className="course-tile" href={course.href} key={course.id} style={{ "--course-accent": course.accent } as React.CSSProperties}><div className="course-tile-top"><span>{String(index + 1).padStart(2, "0")}</span><span>{course.short}</span></div><strong>{course.title}</strong><p>{course.description}</p><div className="course-tile-meta"><span>{course.chapters} глав</span>{course.tasks > 0 && <span>{course.tasks} задач</span>}<Arrow /></div></Link>)}</div></section>

    <section className="catalog-block"><div className="section-head"><div><div className="eyebrow">02 / PRACTICE</div><h2>Карта трека Go</h2><p>От первых горутин до production-паттернов.</p></div><label className="search-field"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти топик" /></label></div><div className="topic-table"><div className="topic-table-head"><span>#</span><span>Топик</span><span>Прогресс</span><span>Сложность</span></div>{filtered.map((topic) => { const solved = topic.taskIds.filter((id) => isSolved(id, "go")).length; const first = topic.taskIds.find((id) => !isSolved(id, "go")) ?? topic.taskIds[0] ?? "01"; return <Link className="topic-table-row" key={topic.num} href={`/go/tasks/${first}`}><span className="topic-no">{String(topic.num).padStart(2, "0")}</span><span className="topic-name"><strong>{topic.label}</strong><small>{topic.taskCount} задач {topic.isReview ? "· code review" : "· практика"}</small></span><span className="topic-progress-cell"><span className="mini-progress"><i style={{ width: `${topic.taskCount ? (solved / topic.taskCount) * 100 : 0}%` }} /></span><small>{solved}/{topic.taskCount}</small></span><span className="topic-difficulty"><Difficulty diff={topic.diff} /><Arrow /></span></Link>; })}</div></section>

    <section className="chapters-block"><div className="section-head"><div><div className="eyebrow">03 / THEORY</div><h2>Учебник по конкурентности</h2><p>Справочник, к которому возвращаются.</p></div><Link className="quiet-action" href="/go/book">Все главы <Arrow /></Link></div><div className="chapter-grid">{chapters.slice(0, 6).map((chapter, i) => <Link className="chapter-tile" href={`/go/book/${chapter.slug}`} key={chapter.slug}><span>{String(i + 1).padStart(2, "0")}</span><strong>{chapter.title}</strong><small>Глава {i + 1} · 12 мин</small></Link>)}</div></section>
  </div>;
}
