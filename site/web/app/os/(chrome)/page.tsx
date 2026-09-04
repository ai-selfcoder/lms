import type { Metadata } from "next";
import Link from "next/link";
import { getCourse } from "@/lib/courses";
import { getBookChapters } from "@/lib/content";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, absUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Курс по операционным системам онлайн — программа, симуляторы, квизы",
  description:
    "Бесплатный интерактивный курс по операционным системам: 36 глав по мотивам OSTEP, симуляторы планировщика и памяти, квизы и задачи на Go. Виртуализация, конкурентность, персистентность — теория с практикой.",
  keywords: [
    "операционные системы",
    "курс по операционным системам",
    "учебник по ОС",
    "OSTEP на русском",
    "планировщик процессов",
    "виртуальная память",
    "файловые системы",
    "симулятор планировщика",
    "бесплатный курс по ОС",
  ],
  alternates: { canonical: "/os" },
  openGraph: {
    title: "Курс по операционным системам — учебник, симуляторы, квизы",
    description:
      "36 глав по мотивам OSTEP с интерактивными симуляторами и квизами: виртуализация, конкурентность, персистентность. Бесплатно.",
    url: "/os",
    type: "website",
  },
};

const ACCENT = "#46c79a";
const WRAP: React.CSSProperties = { maxWidth: 920, margin: "0 auto", padding: "0 28px" };

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

const ArrowIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

// ── Curriculum structure: the three OSTEP pillars, mapped to chapter orders.
//    Virtualization splits into CPU (1–7) and memory (8–17) sub-sections.
interface Part {
  rom: string;
  title: string;
  tagline: string;
  from: number;
  to: number;
  interactive: string;
  subs?: Array<{ label: string; at: number }>;
}

const PARTS: Part[] = [
  {
    rom: "I",
    title: "Виртуализация",
    tagline: "Как один процессор и одна память притворяются, что их у каждого процесса много.",
    from: 1,
    to: 17,
    interactive: "Симуляторы: RR, MLFQ, конвой, трансляция адресов, TLB, вытеснение LRU",
    subs: [
      { label: "Процессор", at: 1 },
      { label: "Память", at: 8 },
    ],
  },
  {
    rom: "II",
    title: "Конкурентность",
    tagline: "Потоки, локи, условные переменные и семафоры — без гонок и дедлоков.",
    from: 18,
    to: 24,
    interactive: "Симулятор: contention на локах",
  },
  {
    rom: "III",
    title: "Персистентность",
    tagline: "Диски, файловые системы, журналы и durability — где и почему теряются данные.",
    from: 25,
    to: 36,
    interactive: "Симулятор: планирование запросов к диску (SSTF)",
  },
];

export default function OsProgramPage() {
  const course = getCourse("os");
  const accent = course?.accent ?? ACCENT;
  const chapters = getBookChapters("os").slice().sort((a, b) => a.order - b.order);

  const totalMin = chapters.reduce((s, c) => s + (c.minutes ?? 0), 0);
  const hours = Math.max(1, Math.round(totalMin / 60));
  const firstSlug = chapters[0]?.slug ?? "process";

  const stats = [
    { value: String(chapters.length), label: "глав" },
    { value: `≈${hours}`, label: "часов" },
    { value: "12", label: "задач" },
    { value: "35", label: "квизов" },
    { value: "10", label: "симуляторов", accent: true },
  ];

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Операционные системы",
    description:
      "Интерактивный курс по операционным системам по мотивам OSTEP: виртуализация, конкурентность, персистентность. С симуляторами, квизами и задачами на Go.",
    url: absUrl("/os"),
    inLanguage: "ru-RU",
    isAccessibleForFree: true,
    teaches: ["виртуализация", "планирование процессов", "виртуальная память", "конкурентность", "файловые системы", "персистентность"],
    provider: { "@type": "EducationalOrganization", name: "GraphLMS", url: `${SITE_URL}/` },
  };

  return (
    <div style={{ color: "var(--text-primary)" }}>
      <JsonLd data={courseLd} />
      <style>{`
        @keyframes riseIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .rise { opacity: 0; animation: riseIn .5s var(--ease-out) forwards; }
        .ch-row { transition: background var(--dur-fast) var(--ease-out); }
        .ch-row:hover { background: var(--bg-hover); }
        .ch-row:hover .ch-title { color: var(--text-primary); }
        .os-cta { transition: filter var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out); }
        .os-cta-solid:hover { filter: brightness(1.08); }
        .os-cta-ghost:hover { border-color: var(--text-tertiary); background: var(--bg-hover); }
        .part-grid { display: grid; grid-template-columns: 72px 1fr; gap: 0; }
        @media (max-width: 720px) { .part-grid { grid-template-columns: 1fr; } .part-rail { display: none; } }
      `}</style>

      {/* ── MASTHEAD ───────────────────────────────────────────────────── */}
      <section style={{ borderBottom: "var(--border-width) solid var(--border-subtle)" }}>
        <div style={{ ...WRAP, padding: "52px 28px 38px" }}>
          <p className="rise" style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: accent, margin: "0 0 14px" }}>
            // курс · операционные системы
          </p>
          <h1 className="rise" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "clamp(32px, 4.6vw, 44px)", lineHeight: 1.06, letterSpacing: "-.025em", margin: 0, maxWidth: "16ch", animationDelay: "50ms" }}>
            Операционные системы
          </h1>
          <p className="rise" style={{ fontSize: 16.5, lineHeight: "27px", color: "var(--text-secondary)", maxWidth: 620, margin: "16px 0 0", animationDelay: "100ms" }}>
            Бесплатный учебник с интерактивом: крутишь симуляторы, проверяешь себя квизами, пишешь код с
            автопроверкой. Программа — по мотивам OSTEP, переписана по-русски и под современный бэкенд-контекст.
          </p>

          {/* stat strip */}
          <div className="rise" style={{ display: "flex", flexWrap: "wrap", marginTop: 28, border: "var(--border-width) solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden", animationDelay: "150ms" }}>
            {stats.map((s, i) => (
              <div key={s.label} style={{ flex: "1 0 100px", padding: "13px 18px", borderLeft: i ? "var(--border-width) solid var(--border-subtle)" : "none" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600, lineHeight: 1, color: s.accent ? accent : "var(--text-primary)" }}>{s.value}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-tertiary)", marginTop: 7 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="rise" style={{ display: "flex", gap: 11, flexWrap: "wrap", marginTop: 24, animationDelay: "200ms" }}>
            <Link href={`/os/book/${firstSlug}`} className="os-cta os-cta-solid" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: "var(--radius-md)", fontSize: 15, fontWeight: 500, background: accent, color: "#06140f" }}>
              <PlayIcon /> Начать с первой главы
            </Link>
            <Link href="/os/sim/scheduler" className="os-cta os-cta-ghost" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 18px", borderRadius: "var(--radius-md)", fontSize: 15, fontWeight: 500, border: "var(--border-width) solid var(--border-strong)", color: "var(--text-primary)" }}>
              Открыть симулятор
            </Link>
          </div>

          {/* modest free note */}
          <p className="rise" style={{ fontSize: 13, color: "var(--text-tertiary)", margin: "20px 0 0", animationDelay: "250ms" }}>
            Чтение, симуляторы, квизы и прогоны задач в песочнице — бесплатно. AI-разбор решений —{" "}
            <span style={{ fontFamily: "var(--font-mono)", color: accent }}>Pro</span> (скоро).
          </p>
        </div>
      </section>

      {/* ── PROGRAM (syllabus) ─────────────────────────────────────────── */}
      <section>
        <div style={{ ...WRAP, padding: "44px 28px 72px" }}>
          <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-tertiary)", margin: "0 0 28px" }}>
            Программа · 3 части
          </h2>

          {PARTS.map((part) => {
            const list = chapters.filter((c) => c.order >= part.from && c.order <= part.to);
            const partMin = list.reduce((s, c) => s + (c.minutes ?? 0), 0);
            return (
              <div key={part.rom} className="part-grid" style={{ marginBottom: 40 }}>
                {/* rail — roman numeral */}
                <div className="part-rail" style={{ paddingTop: 2 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, color: accent, lineHeight: 1 }}>{part.rom}</div>
                </div>

                {/* content */}
                <div style={{ borderTop: `2px solid ${accent}`, paddingTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.018em", color: "var(--text-primary)", margin: 0 }}>{part.title}</h3>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-tertiary)" }}>
                      {list.length} {plural(list.length, "глава", "главы", "глав")} · ≈{partMin} мин
                    </span>
                  </div>
                  <p style={{ fontSize: 14.5, lineHeight: "23px", color: "var(--text-secondary)", margin: "8px 0 12px", maxWidth: 640 }}>{part.tagline}</p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: accent, marginBottom: 16 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
                    {part.interactive}
                  </div>

                  {/* chapter list */}
                  <div style={{ border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                    {list.map((ch, i) => {
                      const sub = part.subs?.find((s) => s.at === ch.order);
                      return (
                        <div key={ch.slug}>
                          {sub && (
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)", padding: "10px 16px 8px", background: "var(--bg-surface)", borderTop: i ? "var(--border-width) solid var(--border-subtle)" : "none" }}>
                              {sub.label}
                            </div>
                          )}
                          <Link
                            href={`/os/book/${ch.slug}`}
                            className="ch-row"
                            style={{
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: 14,
                              padding: "11px 16px",
                              borderTop: i && !sub ? "var(--border-width) solid var(--border-subtle)" : "none",
                            }}
                          >
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-tertiary)", width: 24, flexShrink: 0 }}>
                              {String(ch.order).padStart(2, "0")}
                            </span>
                            <span className="ch-title" style={{ flex: 1, minWidth: 0, fontSize: 15, color: "var(--text-secondary)" }}>{ch.title}</span>
                            {ch.minutes ? (
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)", flexShrink: 0 }}>{ch.minutes} мин</span>
                            ) : null}
                            <span className="ch-arrow" style={{ color: "var(--text-tertiary)", display: "inline-flex", flexShrink: 0 }}>
                              <ArrowIcon size={13} />
                            </span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* tail CTA */}
          <div style={{ borderTop: "var(--border-width) solid var(--border-subtle)", paddingTop: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <p style={{ fontSize: 14.5, color: "var(--text-secondary)", margin: 0, maxWidth: 460 }}>
              Готов начать? Главы читаются линейно, но можно прыгнуть в любую — они связаны перекрёстными ссылками.
            </p>
            <Link href={`/os/book/${firstSlug}`} className="os-cta os-cta-solid" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: "var(--radius-md)", fontSize: 15, fontWeight: 500, background: accent, color: "#06140f", flexShrink: 0 }}>
              Открыть главу 01 <ArrowIcon size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
