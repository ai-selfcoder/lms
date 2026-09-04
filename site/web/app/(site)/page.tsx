import type { Metadata } from "next";
import Link from "next/link";
import { getCourses } from "@/lib/courses";
import { getAllTaskMeta, getBookChapters } from "@/lib/content";
import { getAnnouncements, getRecentChapters } from "@/lib/news";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, absUrl, organizationLd, websiteLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Бесплатные курсы и учебники по Go (Golang) и операционным системам онлайн",
  description:
    "Открытые интерактивные учебники по системному программированию: курс по конкурентности Go (Golang) — горутины, каналы, sync, context — и курс по операционным системам. Теория, симуляторы, квизы и тренажёр с автопроверкой через go test -race — бесплатно. AI-разбор решений — Pro.",
  keywords: [
    "курсы по Go",
    "курсы по Golang",
    "учебник по Go",
    "Go с нуля",
    "конкурентность Go",
    "тренажёр по Go",
    "задачи по программированию",
    "операционные системы курс",
    "бесплатные курсы программирования онлайн",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Бесплатные курсы и учебники по Go (Golang) и операционным системам",
    description:
      "Интерактивные учебники по Go и операционным системам: теория, симуляторы, квизы и тренажёр с автопроверкой — бесплатно.",
    url: "/",
    type: "website",
  },
};

const WRAP: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "0 28px" };

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]}`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

const ArrowIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-tertiary)", margin: "0 0 16px" }}>
      {children}
    </h2>
  );
}

// per-course quick links into the most useful entry points
const QUICK: Record<string, Array<{ label: string; href: string }>> = {
  "go-basics": [
    { label: "Учебник", href: "/go-basics/book" },
  ],
  go: [
    { label: "Учебник", href: "/go/book" },
    { label: "Топики", href: "/go/topics" },
    { label: "Тренажёр", href: "/go/tasks/01" },
  ],
  os: [
    { label: "Программа", href: "/os" },
    { label: "Симулятор", href: "/os/sim/scheduler" },
    { label: "Главы", href: "/os/book/process" },
  ],
};

export default function HomePage() {
  const courses = getCourses().map((c) => ({
    ...c,
    tasks: getAllTaskMeta(c.id).length,
    chapters: getBookChapters(c.id).length,
  }));
  const announcements = getAnnouncements();
  const recent = getRecentChapters(6);

  // Structured data: brand + a catalog of courses so search engines can render
  // rich results and understand the site as an educational platform.
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      websiteLd(),
      organizationLd(),
      {
        "@type": "ItemList",
        name: "Курсы и учебники GraphLMS",
        itemListElement: courses.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Course",
            name: c.title,
            description: c.description,
            url: absUrl(`/${c.slug}`),
            inLanguage: "ru-RU",
            isAccessibleForFree: true,
            provider: { "@id": `${SITE_URL}/#organization` },
          },
        })),
      },
    ],
  };

  return (
    <div style={{ color: "var(--text-primary)" }}>
      <JsonLd data={structuredData} />
      <style>{`
        @keyframes riseIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .rise { opacity: 0; animation: riseIn .5s var(--ease-out) forwards; }
        .qlink { transition: color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out); }
        .qlink:hover { border-color: var(--border-strong); color: var(--text-primary); }
        .course-row { transition: border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out); }
        .course-row:hover { border-color: var(--border-strong); }
        .news-item { transition: background var(--dur-fast) var(--ease-out); }
        .news-item:hover { background: var(--bg-hover); }
        .news-item:hover .news-arrow { transform: translateX(3px); }
        .news-arrow { transition: transform var(--dur-fast) var(--ease-out); }
        .home-grid { display: grid; grid-template-columns: 1.55fr 1fr; gap: 40px; align-items: start; }
        .course-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 860px) {
          .home-grid { grid-template-columns: 1fr; gap: 32px; }
          .course-cards { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── MASTHEAD — about the project ───────────────────────────────── */}
      <section style={{ borderBottom: "var(--border-width) solid var(--border-subtle)" }}>
        <div style={{ ...WRAP, padding: "56px 28px 40px" }}>
          <p className="rise" style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-tertiary)", margin: "0 0 16px" }}>
            // бесплатные курсы по Go (Golang) и операционным системам
          </p>
          <h1 className="rise" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "clamp(30px, 4.4vw, 42px)", lineHeight: 1.08, letterSpacing: "-.025em", margin: 0, maxWidth: "20ch", animationDelay: "50ms" }}>
            Учебники по Go и операционным системам, которые можно <span style={{ color: "var(--accent)" }}>запускать</span>
          </h1>
          <p className="rise" style={{ fontSize: 17, lineHeight: "27px", color: "var(--text-secondary)", maxWidth: 600, margin: "18px 0 0", animationDelay: "100ms" }}>
            Читаешь теорию, тут же крутишь симуляторы и проверяешь себя квизами. Без регистрации и без воды —
            сквозные интерактивные курсы по конкурентности Go (Golang) и операционным системам, с задачами и автопроверкой.
          </p>

          {/* primary CTAs — promo-banner conversion (текст отличается от «Начать» в шапке) */}
          <div className="rise" style={{ display: "flex", gap: 11, flexWrap: "wrap", marginTop: 24, animationDelay: "120ms" }}>
            <Link
              href="/go/tasks/01"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 44,
                padding: "0 20px",
                borderRadius: "var(--radius-md)",
                fontSize: 15,
                fontWeight: 500,
                background: "var(--accent)",
                color: "var(--accent-fg)",
              }}
            >
              Открыть тренажёр по Go <ArrowIcon size={15} />
            </Link>
            <Link
              href="/go/book"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 44,
                padding: "0 18px",
                borderRadius: "var(--radius-md)",
                fontSize: 15,
                fontWeight: 500,
                border: "var(--border-width) solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
            >
              Читать учебник по Go
            </Link>
          </div>

          {/* modest free / Pro note */}
          <div className="rise" style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 24, padding: "9px 14px", border: "var(--border-width) solid var(--border-subtle)", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", animationDelay: "150ms" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
              Учебник, симуляторы, квизы и тренажёр с автопроверкой — <span style={{ color: "var(--text-primary)" }}>бесплатно</span>. AI-разбор решений —{" "}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--accent-text)" }}>Pro</span>{" "}
              <span style={{ color: "var(--text-tertiary)" }}>(скоро)</span>.
            </span>
          </div>
        </div>
      </section>

      {/* ── QUICK ACCESS — courses ─────────────────────────────────────── */}
      <section style={{ borderBottom: "var(--border-width) solid var(--border-subtle)" }}>
        <div style={{ ...WRAP, padding: "40px 28px 44px" }}>
          <Eyebrow>Курсы по программированию: Go (Golang) и операционные системы · {courses.length}</Eyebrow>
          <div className="course-cards">
            {courses.map((c) => {
              const quick = QUICK[c.id] ?? [];
              return (
                <div key={c.id} className="course-row" style={{ border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--bg-elevated)", display: "flex", flexDirection: "column" }}>
                  <span style={{ display: "block", height: 3, background: c.accent }} />
                  <div style={{ padding: "18px 20px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <Link href={`/${c.slug}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: c.accent, marginBottom: 9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.accent }} />
                        {c.short}
                        <span style={{ color: "var(--text-tertiary)" }}>
                          · {c.chapters} {plural(c.chapters, "глава", "главы", "глав")}
                          {c.tasks > 0 ? ` · ${c.tasks} ${plural(c.tasks, "задача", "задачи", "задач")}` : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.015em", color: "var(--text-primary)", marginBottom: 7 }}>{c.title}</div>
                      <p style={{ fontSize: 14, lineHeight: "22px", color: "var(--text-secondary)", margin: "0 0 16px" }}>{c.description}</p>
                    </Link>
                    <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {quick.map((q, i) => (
                        <Link
                          key={q.href}
                          href={q.href}
                          className="qlink"
                          style={{
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontFamily: "var(--font-mono)",
                            fontSize: 12.5,
                            padding: "5px 11px",
                            borderRadius: "var(--radius-sm)",
                            border: "var(--border-width) solid var(--border-default)",
                            color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)",
                          }}
                        >
                          {q.label}
                          {i === 0 && <ArrowIcon size={12} />}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHAT'S NEW + RECENT ────────────────────────────────────────── */}
      <section>
        <div style={{ ...WRAP, padding: "44px 28px 72px" }}>
          <div className="home-grid">
            {/* main — announcements */}
            <div>
              <Eyebrow>Что нового в курсах по Go и ОС</Eyebrow>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {announcements.map((a, i) => (
                  <Link
                    key={`${a.date}-${i}`}
                    href={a.href}
                    className="news-item"
                    style={{
                      textDecoration: "none",
                      display: "block",
                      padding: "18px 16px",
                      margin: "0 -16px",
                      borderRadius: "var(--radius-md)",
                      borderTop: i ? "var(--border-width) solid var(--border-subtle)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-tertiary)" }}>{fmtDate(a.date)}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "2px 8px", borderRadius: "var(--radius-pill)", color: "var(--text-secondary)", border: "var(--border-width) solid var(--border-default)" }}>
                        {a.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.012em", color: "var(--text-primary)", marginBottom: 6, display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {a.title}
                      <span className="news-arrow" style={{ color: "var(--text-tertiary)", display: "inline-flex" }}>
                        <ArrowIcon size={14} />
                      </span>
                    </div>
                    <p style={{ fontSize: 14.5, lineHeight: "23px", color: "var(--text-secondary)", margin: 0 }}>{a.body}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* aside — recently added (auto) */}
            <aside>
              <Eyebrow>Недавно добавленные главы и задачи</Eyebrow>
              <div style={{ border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--bg-elevated)" }}>
                {recent.map((r, i) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="news-item"
                    style={{
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "11px 14px",
                      borderTop: i ? "var(--border-width) solid var(--border-subtle)" : "none",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.accent, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.title}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", flexShrink: 0 }}>{r.course}</span>
                  </Link>
                ))}
              </div>

              {/* about the project — compact */}
              <div style={{ marginTop: 28 }}>
                <Eyebrow>О проекте — бесплатные учебники по Go и ОС</Eyebrow>
                <p style={{ fontSize: 13.5, lineHeight: "22px", color: "var(--text-secondary)", margin: 0 }}>
                  Самиздат-учебники для инженеров: глубокая теория плюс интерактив — симуляторы, квизы и
                  задачи с автопроверкой. Весь учебник и тренажёр открыты и бесплатны; платными остаются
                  только AI-функции — разбор решений и подсказки от ИИ.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
