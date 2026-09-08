import type { Metadata } from "next";
import Link from "next/link";
import { getChangelog, type ChangelogType } from "@/lib/changelog";
import { getCourses } from "@/lib/courses";

export const metadata: Metadata = {
  title: "История изменений",
  description: "Версии учебников, задач, лабораторий и инструментов GraphLMS.",
  alternates: { canonical: "/changelog" },
};

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const TYPE_LABEL: Record<ChangelogType, string> = {
  release: "Релиз",
  feature: "Функции",
  content: "Контент",
  fix: "Исправления",
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return year && month && day ? `${day} ${MONTHS[month - 1]} ${year}` : iso;
}

export default function ChangelogPage() {
  const entries = getChangelog();
  const courseTitles = new Map(getCourses().map((course) => [course.id, course.short]));
  return (
    <div className="changelog-page">
      <div className="changelog-wrap">
        <header className="changelog-head">
          <div>
            <span className="eyebrow">GRAPH / CHANGELOG</span>
            <h1>История изменений</h1>
            <p>Что появилось в учебниках, задачах и лабораториях. Версия контента важна, когда решение должно оставаться воспроизводимым.</p>
          </div>
          <Link className="quiet-action" href="/">На главную ↗</Link>
        </header>
        <main className="changelog-list">
          {entries.map((entry) => (
            <article className="changelog-entry" id={`v${entry.version}`} key={`${entry.version}-${entry.date}`}>
              <div className="changelog-meta">
                <span className="changelog-version">v{entry.version}</span>
                <time dateTime={entry.date}>{formatDate(entry.date)}</time>
              </div>
              <div className="changelog-copy">
                <span className={`changelog-type changelog-type-${entry.type}`}>{TYPE_LABEL[entry.type]}</span>
                <h2>{entry.title}</h2>
                <p>{entry.summary}</p>
                {entry.courses.length > 0 && <div className="changelog-courses" aria-label="Затронутые программы">
                  {entry.courses.map((courseId) => <span key={courseId}>{courseTitles.get(courseId) ?? courseId}</span>)}
                </div>}
                {entry.links.length > 0 && <nav className="changelog-links" aria-label={`Ссылки для версии ${entry.version}`}>
                  {entry.links.map((link) => <Link key={link.href} href={link.href}>{link.label} <span aria-hidden="true">↗</span></Link>)}
                </nav>}
              </div>
            </article>
          ))}
          {entries.length === 0 && <p className="changelog-empty">История изменений пока пуста.</p>}
        </main>
      </div>
      <style>{`
        .changelog-page { min-height: 100%; color: #e9edf2; }
        .changelog-wrap { max-width: 900px; margin: 0 auto; padding: 56px 28px 96px; }
        .changelog-head { display:flex; align-items:flex-end; justify-content:space-between; gap:28px; padding-bottom:32px; border-bottom:1px solid #2a3039; }
        .eyebrow { color:#788392; font:600 11px var(--font-mono); letter-spacing:.1em; }
        .changelog-head h1 { margin:12px 0 8px; color:#f2f5f8; font-size:40px; letter-spacing:-.035em; }
        .changelog-head p { max-width:620px; margin:0; color:#8d97a5; font-size:15px; line-height:1.55; }
        .changelog-list { padding-top:8px; }
        .changelog-entry { display:grid; grid-template-columns:150px minmax(0,1fr); gap:32px; padding:32px 0; border-bottom:1px solid #242932; }
        .changelog-meta { display:flex; flex-direction:column; gap:7px; padding-top:3px; color:#788392; font:12px var(--font-mono); }
        .changelog-version { color:#78a9ff; font-weight:600; }
        .changelog-copy { min-width:0; }
        .changelog-type { display:inline-flex; padding:4px 7px; border:1px solid #33415a; border-radius:4px; color:#9dbdff; font:10px var(--font-mono); letter-spacing:.06em; text-transform:uppercase; }
        .changelog-type-content { color:#8ce0bc; border-color:#285642; }.changelog-type-fix { color:#ffc078; border-color:#674a24; }.changelog-type-release { color:#d5b8ff; border-color:#513a70; }
        .changelog-copy h2 { margin:12px 0 7px; color:#f2f5f8; font-size:22px; letter-spacing:-.02em; }
        .changelog-copy p { margin:0; color:#aab3bf; font-size:14px; line-height:1.6; }
        .changelog-courses { display:flex; flex-wrap:wrap; gap:7px; margin-top:13px; }
        .changelog-courses span { padding:3px 7px; border:1px solid #303945; border-radius:4px; color:#9ba7b7; font:10px var(--font-mono); text-transform:uppercase; letter-spacing:.05em; }
        .changelog-links { display:flex; flex-wrap:wrap; gap:14px; margin-top:16px; }
        .changelog-links a { color:#78a9ff; font-size:13px; text-decoration:none; }.changelog-links a:hover { color:#b3cbff; text-decoration:underline; text-underline-offset:3px; }
        .changelog-empty { padding:48px 0; color:#8d97a5; }
        @media(max-width:680px) { .changelog-wrap { padding:40px 16px 70px; }.changelog-head { align-items:flex-start; flex-direction:column; gap:18px; }.changelog-head h1 { font-size:32px; }.changelog-entry { grid-template-columns:1fr; gap:12px; padding:26px 0; }.changelog-meta { flex-direction:row; align-items:center; gap:12px; } }
      `}</style>
    </div>
  );
}
