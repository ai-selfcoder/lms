import type { Metadata } from "next";
import Link from "next/link";
import { getAllSims } from "@/lib/content";

export const metadata: Metadata = {
  title: "OS-лаборатории — GraphLMS",
  description: "Галерея управляемых экспериментов по планированию, памяти, дискам и конкурентности.",
};

export default function OsLabsPage() {
  const sims = getAllSims("os");
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "48px 28px 84px" }} className="labs-page">
      <div style={{ marginBottom: 32 }}>
        <span style={{ font: "11px var(--font-mono)", letterSpacing: ".1em", color: "var(--text-tertiary)" }}>OS / LABS</span>
        <h1 style={{ margin: "10px 0 8px", fontSize: 36, letterSpacing: "-.03em", color: "var(--text-primary)" }}>Галерея экспериментов</h1>
        <p style={{ margin: 0, maxWidth: 640, color: "var(--text-secondary)", lineHeight: 1.6 }}>Сломай интуицию управляемым сценарием: измени политику или параметры и сравни результат. Каждый эксперимент можно открыть отдельно или найти в главе курса.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }} className="labs-grid">
        {sims.map((sim, index) => (
          <Link key={sim.id} href={`/os/sim/${sim.id}`} style={{ display: "flex", flexDirection: "column", minHeight: 170, padding: "18px 20px", border: "1px solid var(--border-default)", borderRadius: 7, background: "var(--bg-elevated)", textDecoration: "none", transition: ".16s ease" }} className="lab-card">
            <span style={{ font: "11px var(--font-mono)", color: "var(--text-tertiary)" }}>{String(index + 1).padStart(2, "0")} · {sim.kind}</span>
            <strong style={{ marginTop: 24, color: "var(--text-primary)", fontSize: 17 }}>{sim.title}</strong>
            <span style={{ marginTop: "auto", paddingTop: 12, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.45 }}>{sim.explain ?? "Открой параметры и посмотри, как меняется поведение системы."}</span>
            <span style={{ marginTop: 14, color: "var(--accent-text)", font: "12px var(--font-mono)" }}>Открыть лабораторию →</span>
          </Link>
        ))}
      </div>
      <style>{`.lab-card:hover{border-color:var(--accent);background:var(--bg-hover)}@media(max-width:640px){.labs-page{padding:34px 16px 60px!important}.labs-page h1{font-size:30px!important}.labs-grid{grid-template-columns:1fr!important}}`}</style>
    </main>
  );
}
