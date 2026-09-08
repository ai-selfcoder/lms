import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSims, getBookChapter, getSim } from "@/lib/content";
import { SimRenderer } from "@/components/os/sim/SimRenderer";

export function generateStaticParams() {
  return getAllSims("os").map((sim) => ({ id: sim.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const sim = getSim(id, "os");
  return sim ? { title: `${sim.title} — OS-лаборатория` } : { title: "Лаборатория не найдена" };
}

export default async function OsSimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sim = getSim(id, "os");
  if (!sim) notFound();
  const chapter = sim.chapterSlug ? getBookChapter(sim.chapterSlug, "os")?.chapter : null;
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "44px 28px 84px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <Link href="/os/labs" style={{ color: "var(--text-tertiary)", textDecoration: "none", font: "12px var(--font-mono)" }}>← Все лаборатории</Link>
        {chapter && <Link href={`/os/book/${chapter.slug}`} style={{ color: "var(--accent-text)", textDecoration: "none", font: "12px var(--font-mono)" }}>Объяснение в главе: {chapter.title} →</Link>}
      </div>
      <p style={{ margin: "28px 0 8px", font: "11px var(--font-mono)", letterSpacing: ".1em", color: "var(--text-tertiary)" }}>OS / LAB</p>
      <h1 style={{ margin: "0 0 10px", fontSize: 32, color: "var(--text-primary)" }}>{sim.title}</h1>
      {sim.explain && <p style={{ margin: "0 0 28px", maxWidth: 680, color: "var(--text-secondary)", lineHeight: 1.6 }}>{sim.explain}</p>}
      <SimRenderer kind={sim.kind} defaults={sim.defaults} simId={sim.id} compact={false} urlState />
    </main>
  );
}
