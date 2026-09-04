import type { Metadata } from "next";
import Link from "next/link";
import { getCourse } from "@/lib/courses";
import { getBookChapters } from "@/lib/content";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, absUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Основы Go с нуля — бесплатный интерактивный учебник для джунов",
  description:
    "Учебник по языку Go с нуля: синтаксис, типы, срезы и карты, структуры, интерфейсы, ошибки, дженерики и первое знакомство с горутинами. Примеры запускаются прямо в браузере — меняй код и смотри результат.",
  keywords: [
    "go с нуля",
    "учебник go",
    "golang для начинающих",
    "основы go",
    "go для джунов",
    "интерфейсы go",
    "горутины",
    "go playground",
    "бесплатный курс go",
  ],
  alternates: { canonical: "/go-basics" },
  openGraph: {
    title: "Основы Go — интерактивный учебник для джунов",
    description:
      "Go с нуля: синтаксис, типы, структуры, интерфейсы, ошибки, дженерики, горутины. С запуском примеров прямо в браузере. Бесплатно.",
    url: "/go-basics",
    type: "website",
  },
};

const ACCENT = "#8b5cf6";
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

export default function GoBasicsProgramPage() {
  const course = getCourse("go-basics");
  const accent = course?.accent ?? ACCENT;
  const chapters = getBookChapters("go-basics").slice().sort((a, b) => a.order - b.order);

  const totalMin = chapters.reduce((s, c) => s + (c.minutes ?? 0), 0);
  const hours = Math.max(1, Math.round(totalMin / 60));
  const firstSlug = chapters[0]?.slug ?? "hello";

  const stats = [
    { value: String(chapters.length), label: "глав" },
    { value: `≈${hours}`, label: "часов" },
    { value: "100+", label: "примеров", accent: true },
    { value: "0₽", label: "стоимость" },
  ];

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Основы Go",
    description:
      "Интерактивный учебник по языку Go с нуля для джунов: синтаксис, типы, структуры, интерфейсы, ошибки, дженерики и горутины. Примеры запускаются прямо в браузере.",
    url: absUrl("/go-basics"),
    inLanguage: "ru-RU",
    isAccessibleForFree: true,
    teaches: ["синтаксис Go", "типы и срезы", "структуры и методы", "интерфейсы", "обработка ошибок", "дженерики", "горутины"],
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
        .gb-cta { transition: filter var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out); }
        .gb-cta-solid:hover { filter: brightness(1.08); }
        .gb-cta-ghost:hover { border-color: var(--text-tertiary); background: var(--bg-hover); }
      `}</style>

      {/* ── MASTHEAD ───────────────────────────────────────────────────── */}
      <section style={{ borderBottom: "var(--border-width) solid var(--border-subtle)" }}>
        <div style={{ ...WRAP, padding: "52px 28px 38px" }}>
          <p className="rise" style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: accent, margin: "0 0 14px" }}>
            // курс · язык Go с нуля
          </p>
          <h1 className="rise" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "clamp(32px, 4.6vw, 44px)", lineHeight: 1.06, letterSpacing: "-.025em", margin: 0, maxWidth: "16ch", animationDelay: "50ms" }}>
            Основы Go
          </h1>
          <p className="rise" style={{ fontSize: 16.5, lineHeight: "27px", color: "var(--text-secondary)", maxWidth: 620, margin: "16px 0 0", animationDelay: "100ms" }}>
            Учебник для тех, кто берётся за Go впервые. Без воды и заумных формулировок: синтаксис, типы,
            структуры, интерфейсы, ошибки и первые горутины — с примерами, которые запускаются прямо в
            браузере. Меняй код и сразу смотри, что вышло.
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
            <Link href={`/go-basics/book/${firstSlug}`} className="gb-cta gb-cta-solid" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: "var(--radius-md)", fontSize: 15, fontWeight: 500, background: accent, color: "#fff" }}>
              <PlayIcon /> Начать с первой главы
            </Link>
            <Link href="/go/book/goroutines" className="gb-cta gb-cta-ghost" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 18px", borderRadius: "var(--radius-md)", fontSize: 15, fontWeight: 500, border: "var(--border-width) solid var(--border-strong)", color: "var(--text-primary)" }}>
              Дальше: конкурентность
            </Link>
          </div>

          <p className="rise" style={{ fontSize: 13, color: "var(--text-tertiary)", margin: "20px 0 0", animationDelay: "250ms" }}>
            Чтение и запуск примеров в браузере — бесплатно. Никакой установки Go не нужно, чтобы начать.
          </p>
        </div>
      </section>

      {/* ── PROGRAM (linear chapter list) ──────────────────────────────── */}
      <section>
        <div style={{ ...WRAP, padding: "44px 28px 72px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-tertiary)", margin: 0 }}>
              Программа · {chapters.length} {plural(chapters.length, "глава", "главы", "глав")}
            </h2>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-tertiary)" }}>≈{totalMin} мин чтения</span>
          </div>

          <div style={{ border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {chapters.map((ch, i) => (
              <Link
                key={ch.slug}
                href={`/go-basics/book/${ch.slug}`}
                className="ch-row"
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  borderTop: i ? "var(--border-width) solid var(--border-subtle)" : "none",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: accent, width: 24, flexShrink: 0 }}>
                  {String(ch.order).padStart(2, "0")}
                </span>
                <span className="ch-title" style={{ flex: 1, minWidth: 0, fontSize: 15, color: "var(--text-secondary)" }}>{ch.title}</span>
                {ch.minutes ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)", flexShrink: 0 }}>{ch.minutes} мин</span>
                ) : null}
                <span style={{ color: "var(--text-tertiary)", display: "inline-flex", flexShrink: 0 }}>
                  <ArrowIcon size={13} />
                </span>
              </Link>
            ))}
          </div>

          {/* tail CTA */}
          <div style={{ borderTop: "var(--border-width) solid var(--border-subtle)", marginTop: 28, paddingTop: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <p style={{ fontSize: 14.5, color: "var(--text-secondary)", margin: 0, maxWidth: 460 }}>
              Главы идут по нарастающей, но связаны перекрёстными ссылками — можно начать с любой темы.
            </p>
            <Link href={`/go-basics/book/${firstSlug}`} className="gb-cta gb-cta-solid" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: "var(--radius-md)", fontSize: 15, fontWeight: 500, background: accent, color: "#fff", flexShrink: 0 }}>
              Открыть главу 01 <ArrowIcon size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
