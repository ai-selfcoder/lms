import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getBookChapter, getBookChapters, getSim, getQuiz } from "@/lib/content";
import { Mdx } from "@/components/Mdx";
import { parseBlocks } from "@/lib/os/blocks";
import { SimRenderer } from "@/components/os/sim/SimRenderer";
import { Quiz } from "@/components/os/Quiz";

const COURSE = "os";

/** Map a chapter's order to its course block label (see content/os/OUTLINE.md). */
function blockLabel(order: number): string {
  if (order <= 7) return "Виртуализация CPU";
  if (order <= 17) return "Виртуализация памяти";
  if (order <= 24) return "Конкурентность";
  if (order <= 33) return "Persistence";
  return "ОС в проде";
}

export function generateStaticParams() {
  return getBookChapters(COURSE).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getBookChapter(slug, COURSE);
  if (!data) return { title: "Глава не найдена" };
  return { title: `${data.chapter.title} — ОС` };
}

export default async function OsChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getBookChapter(slug, COURSE);
  if (!data) notFound();
  const { chapter, prev, next } = data;

  const all = getBookChapters(COURSE);
  const blocks = parseBlocks(chapter.body);

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 28px", display: "flex", gap: 40 }}>
      {/* chapter list */}
      <aside style={{ width: 220, flexShrink: 0 }} className="os-book-aside">
        <div style={{ position: "sticky", top: 84 }}>
          <Link href="/os" style={{ textDecoration: "none", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)" }}>
            ← Курс ОС
          </Link>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 16 }}>
            {all.map((c, i) => {
              const active = c.slug === chapter.slug;
              return (
                <Link
                  key={c.slug}
                  href={`/os/book/${c.slug}`}
                  style={{
                    textDecoration: "none",
                    fontSize: 13.5,
                    lineHeight: 1.4,
                    padding: "7px 10px",
                    borderRadius: "var(--radius-sm)",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    background: active ? "var(--bg-elevated)" : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", marginRight: 8 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {c.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* chapter body */}
      <article style={{ flex: 1, minWidth: 0, maxWidth: 720 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)", margin: "0 0 8px" }}>
          ОС · {blockLabel(chapter.order)}{chapter.minutes ? ` · ${chapter.minutes} мин` : ""}
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)", margin: "0 0 28px" }}>
          {chapter.title}
        </h1>

        {blocks.map((b, i) => {
          if (b.type === "md") return <Mdx key={i} source={b.content} />;
          if (b.type === "sim") {
            const sim = getSim(b.id, COURSE);
            if (!sim) return null;
            return (
              <figure key={i} style={{ margin: "26px 0" }}>
                <SimRenderer kind={sim.kind} defaults={sim.defaults} />
                {sim.explain && (
                  <figcaption style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 10, lineHeight: 1.5 }}>
                    {sim.explain}
                  </figcaption>
                )}
              </figure>
            );
          }
          if (b.type === "quiz") {
            const quiz = getQuiz(b.id, COURSE);
            if (!quiz) return null;
            return <Quiz key={i} quiz={quiz} />;
          }
          return null;
        })}

        {/* prev / next */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 48, paddingTop: 24, borderTop: "var(--border-width) solid var(--border-subtle)" }}>
          {prev ? (
            <Link href={`/os/book/${prev.slug}`} style={navBtn}>
              ← {prev.title}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/os/book/${next.slug}`} style={{ ...navBtn, textAlign: "right" }}>
              {next.title} →
            </Link>
          ) : <span />}
        </div>
      </article>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  textDecoration: "none",
  fontSize: 14,
  color: "var(--text-secondary)",
  border: "var(--border-width) solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  padding: "10px 14px",
  maxWidth: "48%",
};
