"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress";

// ─────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────

interface TopicProp {
  num: number;
  label: string;
  taskCount: number;
  taskIds: string[];
  diff: { e: number; m: number; h: number };
  isReview: boolean;
}

interface ChapterProp {
  slug: string;
  title: string;
  order: number;
}

interface LandingViewProps {
  taskCount: number;
  chapterCount: number;
  firstTaskSlug: string | null;
  topics: TopicProp[];
  chapters: ChapterProp[];
}

const WRAP: React.CSSProperties = { maxWidth: 1080, margin: "0 auto", padding: "0 28px" };

// ─────────────────────────────────────────────────────────────────────────
// Inline icons (Lucide register)
// ─────────────────────────────────────────────────────────────────────────

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const ArrowIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--violet-400)" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const CheckSeal = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="var(--success)" opacity="0.16" />
    <path d="M7.5 12.5l3 3 6-6.5" stroke="var(--success)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Ring = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" stroke="var(--border-strong)" strokeWidth="1.5" />
  </svg>
);

const ActiveDot = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="6" fill="var(--accent)" />
  </svg>
);

const FileIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const WarnIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--warning-fg)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
    <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────

function plural(n: number): string {
  if (n === 1) return "задача";
  if (n >= 2 && n <= 4) return "задачи";
  return "задач";
}

function DiffDots({ diff }: { diff: { e: number; m: number; h: number } }) {
  const dot = (bg: string, key: string) => (
    <span key={key} style={{ width: 7, height: 7, borderRadius: "50%", background: bg, display: "inline-block" }} />
  );
  const out: React.ReactNode[] = [];
  for (let i = 0; i < diff.e; i++) out.push(dot("var(--diff-easy)", `e${i}`));
  for (let i = 0; i < diff.m; i++) out.push(dot("var(--diff-medium)", `m${i}`));
  for (let i = 0; i < diff.h; i++) out.push(dot("var(--diff-hard)", `h${i}`));
  return <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>{out}</span>;
}

function SectionEyebrow({ index, title }: { index: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent-text)" }}>{index}</span>
      <h2
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: ".1em",
          color: "var(--text-tertiary)",
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

const linkBtn = (accent: boolean): React.CSSProperties => ({
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 44,
  padding: "0 20px",
  borderRadius: "var(--radius-md)",
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  fontWeight: 500,
  whiteSpace: "nowrap",
  border: accent ? "var(--border-width) solid transparent" : "var(--border-width) solid var(--border-strong)",
  background: accent ? "var(--accent)" : "transparent",
  color: accent ? "var(--accent-fg)" : "var(--text-primary)",
  transition: "background var(--dur-fast) var(--ease-out)",
});

// ─────────────────────────────────────────────────────────────────────────
// Hero code (pool.go) — syntax-highlighted via DS --code-* tokens
// ─────────────────────────────────────────────────────────────────────────

const K = "var(--code-keyword)";
const F = "var(--code-func)";
const T = "var(--code-type)";
const B = "var(--code-builtin)";
const N = "var(--code-number)";

function HeroCode() {
  const lineNum = (n: number) => (
    <span style={{ color: "var(--text-tertiary)", opacity: 0.5, display: "inline-block", width: 34, textAlign: "right", paddingRight: 14 }}>{n}</span>
  );
  const line = (n: number, content: React.ReactNode) => (
    <span style={{ display: "block", whiteSpace: "pre" }}>
      {lineNum(n)}
      {content}
    </span>
  );
  return (
    <pre style={{ fontFamily: "var(--font-mono)", margin: 0, padding: "14px 0", fontSize: 12.5, lineHeight: "20px", overflow: "hidden", flex: 1 }}>
      <code>
        {line(1, <><span style={{ color: K }}>func</span> <span style={{ color: F }}>WorkerPool</span>(jobs []<span style={{ color: T }}>int</span>, limit <span style={{ color: T }}>int</span>,</>)}
        {line(2, <>{"    "}fn <span style={{ color: K }}>func</span>(<span style={{ color: T }}>int</span>) <span style={{ color: T }}>int</span>) []<span style={{ color: T }}>int</span> {"{"}</>)}
        {line(3, <>{"    "}res := <span style={{ color: B }}>make</span>([]<span style={{ color: T }}>int</span>, <span style={{ color: B }}>len</span>(jobs))</>)}
        {line(4, <>{"    "}sem := <span style={{ color: B }}>make</span>(<span style={{ color: K }}>chan</span> <span style={{ color: K }}>struct</span>{"{}"}, limit)</>)}
        {line(5, <>{"    "}<span style={{ color: K }}>var</span> wg <span style={{ color: T }}>sync</span>.WaitGroup</>)}
        {line(6, <>{"    "}<span style={{ color: K }}>for</span> i, j := <span style={{ color: K }}>range</span> jobs {"{"}</>)}
        {line(7, <>{"        "}wg.<span style={{ color: F }}>Add</span>(<span style={{ color: N }}>1</span>)</>)}
        {line(8, <>{"        "}sem {"<-"} <span style={{ color: K }}>struct</span>{"{}{}"}</>)}
        {line(9, <>{"        "}<span style={{ color: K }}>go</span> <span style={{ color: K }}>func</span>(i, j <span style={{ color: T }}>int</span>) {"{"}</>)}
        {line(10, <>{"            "}<span style={{ color: K }}>defer</span> wg.<span style={{ color: F }}>Done</span>()</>)}
        {line(11, <>{"            "}<span style={{ color: K }}>defer</span> <span style={{ color: K }}>func</span>() {"{"} {"<-sem"} {"}"}()</>)}
        {line(12, <>{"            "}res[i] = <span style={{ color: F }}>fn</span>(j)</>)}
        {line(13, <>{"        "}{"}"}(i, j)</>)}
        {line(14, <>{"    "}{"}"}</>)}
        {line(15, <>{"    "}wg.<span style={{ color: F }}>Wait</span>(); <span style={{ color: K }}>return</span> res</>)}
        {line(16, <>{"}"}</>)}
      </code>
    </pre>
  );
}

// hero mini sidebar
const MINI: Array<[number, string, "solved" | "active" | "todo"]> = [
  [23, "Простой воркер-пул", "solved"],
  [24, "Пул с результатами", "solved"],
  [25, "Пул с ограничением", "active"],
  [26, "Конвейер из 3 стадий", "todo"],
  [27, "Graceful shutdown", "todo"],
  [28, "Динамическое масштабир.", "todo"],
];

// ─────────────────────────────────────────────────────────────────────────
// View
// ─────────────────────────────────────────────────────────────────────────

export default function LandingView({ taskCount, chapterCount, firstTaskSlug, topics, chapters }: LandingViewProps) {
  const { isSolved, count } = useProgress(taskCount);
  const trainerHref = firstTaskSlug ? `/go/tasks/${firstTaskSlug}` : "/go/tasks/01";

  const teaser = chapters.slice(0, 7);
  const remainingChapters = Math.max(0, chapterCount - teaser.length);

  return (
    <div style={{ background: "transparent", color: "var(--text-primary)" }}>
      {/* HERO */}
      <section style={{ borderBottom: "var(--border-width) solid var(--border-subtle)", position: "relative", overflow: "hidden" }}>
        {/* structural vertical rules, fading down — editorial, not glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
            backgroundSize: "120px 100%",
            backgroundPosition: "calc(50% + 0.5px) 0",
            maskImage: "linear-gradient(180deg, #000 0%, transparent 78%)",
            WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 78%)",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        />
        <div style={{ ...WRAP, padding: "84px 28px 0", position: "relative" }}>
          {/* headline */}
          <h1
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "clamp(40px, 6vw, 66px)",
              lineHeight: 1.02,
              letterSpacing: "-.03em",
              margin: "0",
              color: "var(--text-primary)",
              maxWidth: "16ch",
            }}
          >
            Учебник по Go, который{" "}
            <span style={{ color: "var(--accent)" }}>проверяется кодом</span>.
          </h1>

          {/* subhead */}
          <p style={{ fontSize: 18, lineHeight: "29px", color: "var(--text-secondary)", maxWidth: 560, margin: "22px 0 0" }}>
            Каждая глава заканчивается задачей, а задача — прогоном через{" "}
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>go&nbsp;test&nbsp;-race</span>.
            Теория, практика и эталонный разбор — без воды. Сейчас в фокусе:
            конкурентность — горутины, каналы,{" "}
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>sync</span>,{" "}
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>context</span>.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
            <Link href={trainerHref} style={linkBtn(true)}>
              <PlayIcon /> Начать тренажёр
            </Link>
            <Link href="/go/book" style={linkBtn(false)}>
              Читать учебник
            </Link>
          </div>

          {/* spec strip — hairline data row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              marginTop: 44,
              border: "var(--border-width) solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {[
              { value: String(taskCount), label: "задач" },
              { value: String(chapterCount), label: "глав" },
              { value: String(topics.length), label: "топиков" },
              { value: `${count}/${taskCount}`, label: "решено", accent: true },
            ].map((c, i) => (
              <div
                key={c.label}
                style={{
                  flex: "1 0 132px",
                  padding: "14px 20px",
                  borderLeft: i ? "var(--border-width) solid var(--border-subtle)" : "none",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 600, lineHeight: 1, color: c.accent ? "var(--accent-text)" : "var(--text-primary)" }}>
                  {c.value}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-tertiary)", marginTop: 7 }}>
                  {c.label}
                </div>
              </div>
            ))}
          </div>

          {/* BIG PRODUCT WINDOW */}
          <div
            style={{
              margin: "48px 0 -1px",
              border: "var(--border-width) solid var(--border-default)",
              borderBottom: "none",
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
              overflow: "hidden",
              boxShadow: "var(--shadow-lg)",
              background: "var(--bg-surface)",
            }}
          >
            {/* window bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "var(--border-width) solid var(--border-subtle)", background: "var(--bg-surface)" }}>
              <span style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <i key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--grey-700)", display: "block" }} />
                ))}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)", marginLeft: 6 }}>
                GraphLMS — 25 · Пул с ограничением параллелизма
              </span>
              <span style={{ fontFamily: "var(--font-mono)", marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--success-fg)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 7px var(--success)" }} />
                PASS · 1.84s
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "236px 1fr 300px", minHeight: 380 }}>
              {/* mini sidebar */}
              <div style={{ borderRight: "var(--border-width) solid var(--border-subtle)", background: "var(--bg-surface)", padding: "12px 8px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)", padding: "4px 8px 8px" }}>
                  Топик 07 · Воркер-пулы
                </div>
                {MINI.map(([id, title, st]) => {
                  const active = st === "active";
                  return (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: active ? "var(--accent-subtle)" : "transparent",
                      }}
                    >
                      <span style={{ flexShrink: 0, display: "inline-flex" }}>
                        {st === "solved" ? <CheckSeal size={14} /> : st === "active" ? <ActiveDot size={14} /> : <Ring size={14} />}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", width: 16 }}>{id}</span>
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 12.5,
                          color: active ? "var(--text-primary)" : "var(--text-secondary)",
                          fontWeight: active ? 500 : 400,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* editor */}
              <div style={{ background: "var(--bg-inset)", display: "flex", flexDirection: "column", minWidth: 0 }}>
                <div style={{ display: "flex", borderBottom: "var(--border-width) solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "0 14px",
                      height: 36,
                      fontSize: 12,
                      color: "var(--text-primary)",
                      borderBottom: "2px solid var(--accent)",
                      background: "var(--bg-inset)",
                    }}
                  >
                    <FileIcon />
                    pool.go
                  </span>
                </div>
                <HeroCode />
              </div>

              {/* right: theory teaser */}
              <div style={{ borderLeft: "var(--border-width) solid var(--border-subtle)", background: "var(--bg-surface)", display: "flex", flexDirection: "column", minWidth: 0 }}>
                <div style={{ display: "flex", gap: 2, padding: "9px 12px", borderBottom: "var(--border-width) solid var(--border-subtle)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "5px 10px", borderRadius: 5, color: "var(--text-tertiary)" }}>Условие</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      padding: "5px 10px",
                      borderRadius: 5,
                      color: "var(--text-primary)",
                      background: "var(--bg-elevated)",
                      border: "var(--border-width) solid var(--border-strong)",
                    }}
                  >
                    Теория
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "5px 10px", borderRadius: 5, color: "var(--text-disabled)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    Решение <LockIcon />
                  </span>
                </div>
                <div style={{ padding: "16px" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Ограничение параллелизма</div>
                  <p style={{ fontSize: 13, lineHeight: "21px", color: "var(--text-secondary)", margin: "0 0 14px" }}>
                    Счётный семафор на буферизованном канале. Ёмкость = максимум одновременных горутин: запись блокируется, когда слотов нет.
                  </p>
                  <div style={{ display: "flex", gap: 9, padding: "11px 12px", background: "var(--warning-bg)", border: "var(--border-width) solid var(--warning-border)", borderRadius: 8 }}>
                    <WarnIcon />
                    <div style={{ fontSize: 12.5, lineHeight: "19px", color: "var(--text-secondary)" }}>
                      Захватывай <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>i, j</span> параметрами горутины — иначе гонка.
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "auto", borderTop: "var(--border-width) solid var(--border-subtle)", background: "var(--bg-terminal)", padding: "11px 14px" }}>
                  <pre style={{ fontFamily: "var(--font-mono)", margin: 0, fontSize: 11.5, lineHeight: "17px" }}>
                    <span style={{ color: "var(--success-fg)" }}>--- PASS: TestWorkerPool (0.42s)</span>
                    {"\n"}
                    <span style={{ color: "var(--success-fg)" }}>ok</span>
                    <span style={{ color: "var(--text-tertiary)" }}>{"  concurrency/workerpool 1.84s"}</span>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ borderBottom: "var(--border-width) solid var(--border-subtle)" }}>
        <div style={{ ...WRAP, padding: "64px 28px" }}>
          <div style={{ marginBottom: 34 }}>
            <SectionEyebrow index="01" title="Как работает тренажёр по Go" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {[
              { tag: "читай", title: "Теория к задаче", body: "Идиомы, грабли и подсказки — без спойлера ответа.", accent: true },
              { tag: "решай", title: "Код в редакторе", body: "Monaco с подсветкой Go, по готовой сигнатуре функции." },
              { tag: "прогоняй", title: "go test -race", body: "Настоящий прогон в песочнице. Вердикт и полный вывод." },
              { tag: "разбирай", title: "Эталонный разбор", body: "Решение по шагам, альтернативы и вопросы интервьюера." },
            ].map((s) => (
              <div key={s.tag} style={{ borderTop: `2px solid ${s.accent ? "var(--accent)" : "var(--border-strong)"}`, paddingTop: 16 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)", marginBottom: 10 }}>{s.tag}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{s.title}</div>
                <p style={{ fontSize: 14, lineHeight: "21px", color: "var(--text-secondary)", margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOPICS */}
      <section id="topics" style={{ borderBottom: "var(--border-width) solid var(--border-subtle)" }}>
        <div style={{ ...WRAP, padding: "64px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
            <SectionEyebrow index="02" title={`Программа курса по Go · ${topics.length} топиков · ${taskCount} задач`} />
            <Link
              href="/go/topics"
              style={{ textDecoration: "none", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              все задачи <ArrowIcon />
            </Link>
          </div>
          <div style={{ border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                display: "grid",
                gridTemplateColumns: "34px 1fr 96px 110px 150px",
                gap: 16,
                padding: "10px 16px",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                color: "var(--text-tertiary)",
                background: "var(--bg-surface)",
              }}
            >
              <span>#</span>
              <span>топик</span>
              <span>задачи</span>
              <span>сложность</span>
              <span>прогресс</span>
            </div>
            {topics.map((t) => {
              const solvedCount = t.taskIds.filter((id) => isSolved(id)).length;
              const prog = t.taskCount > 0 ? Math.round((solvedCount / t.taskCount) * 100) : 0;
              const full = prog === 100;
              const pc = full ? "var(--success-fg)" : prog === 0 ? "var(--text-tertiary)" : "var(--accent-text)";
              const barc = full ? "var(--success)" : "var(--accent)";
              return (
                <Link
                  key={t.num}
                  href={`/go/topics/${t.num}`}
                  style={{
                    textDecoration: "none",
                    display: "grid",
                    gridTemplateColumns: "34px 1fr 96px 110px 150px",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 16px",
                    borderTop: "var(--border-width) solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-tertiary)" }}>
                    {String(t.num).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    {t.label}
                    {t.isReview && <SearchIcon />}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)" }}>
                    {t.taskCount} {plural(t.taskCount)}
                  </span>
                  <DiffDots diff={t.diff} />
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ flex: 1, height: 4, background: "var(--bg-inset)", borderRadius: 999, overflow: "hidden" }}>
                      <span style={{ display: "block", width: `${prog}%`, height: "100%", background: barc }} />
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: pc, width: 32, textAlign: "right" }}>{prog}%</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHAT'S INSIDE */}
      <section style={{ borderBottom: "var(--border-width) solid var(--border-subtle)" }}>
        <div style={{ ...WRAP, padding: "64px 28px" }}>
          <div style={{ marginBottom: 34 }}>
            <SectionEyebrow index="03" title="Что внутри курса по конкурентности Go" />
          </div>
          <div style={{ border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {[
              { tag: "// sandbox", title: "Реальные go test -race", body: "Код исполняется в изолированной песочнице с детектором гонок. Видишь PASS/FAIL, упавшие проверки и полный вывод — как в настоящем CI.", kbd: false },
              { tag: "// editor", title: "Песочница-редактор", body: "", kbd: true },
              { tag: "// theory", title: "Теория до и после", body: "Перед задачей — идиомы и грабли без спойлеров. После прохождения открывается эталонный разбор и follow-up вопросы интервьюера.", kbd: false },
              { tag: "// progress", title: "Прогресс без регистрации", body: "Решённые задачи и последний код хранятся локально. Аккаунт и синхронизация — когда понадобятся, без обязательного входа.", kbd: false },
            ].map((c, i) => (
              <div
                key={c.tag}
                style={{
                  padding: "26px 24px",
                  borderRight: i % 2 === 0 ? "var(--border-width) solid var(--border-subtle)" : "none",
                  borderBottom: i < 2 ? "var(--border-width) solid var(--border-subtle)" : "none",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent-text)", marginBottom: 12 }}>{c.tag}</div>
                <div style={{ fontSize: 19, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{c.title}</div>
                <p style={{ fontSize: 14.5, lineHeight: "23px", color: "var(--text-secondary)", margin: 0 }}>
                  {c.kbd ? (
                    <>
                      Monaco с подсветкой Go и номерами строк. Хоткей{" "}
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>⌘↵</span> запускает тесты, не отрывая рук от клавиатуры.
                    </>
                  ) : (
                    c.body
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEXTBOOK CTA */}
      <section style={{ borderBottom: "var(--border-width) solid var(--border-subtle)" }}>
        <div style={{ ...WRAP, padding: "64px 28px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ marginBottom: 20 }}>
              <SectionEyebrow index="04" title="Учебник по конкурентности Go" />
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 28, letterSpacing: "-.018em", color: "var(--text-primary)", marginBottom: 12 }}>
              {chapterCount} глав-основ по конкурентности
            </div>
            <p style={{ fontSize: 16, lineHeight: "25px", color: "var(--text-secondary)", maxWidth: 440, margin: "0 0 24px" }}>
              Горутины, модель памяти, каналы, select, sync, atomic, context, паттерны, утечки и гонки, планировщик. Линейное чтение с перекрёстными
              ссылками на задачи тренажёра.
            </p>
            <Link href="/go/book" style={linkBtn(false)}>
              Читать учебник
            </Link>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden", fontSize: 13 }}>
            {teaser.map((ch, i) => (
              <Link
                key={ch.slug}
                href={`/go/book/${ch.slug}`}
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 14px",
                  borderTop: i > 0 ? "var(--border-width) solid var(--border-subtle)" : "none",
                }}
              >
                <span style={{ flexShrink: 0, display: "inline-flex" }}>{i < 5 ? <CheckSeal /> : <Ring />}</span>
                <span style={{ color: "var(--text-tertiary)", width: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ flex: 1, color: "var(--text-secondary)" }}>{ch.title}</span>
              </Link>
            ))}
            {remainingChapters > 0 && (
              <div style={{ padding: "9px 14px", borderTop: "var(--border-width) solid var(--border-subtle)", color: "var(--text-tertiary)" }}>
                + ещё {remainingChapters} глав…
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`@keyframes goro-blink{50%{opacity:0;}}`}</style>
    </div>
  );
}
