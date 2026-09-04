"use client";

import { useMemo, useState } from "react";
import { lockContention, type LockThread } from "@/lib/os/sim/lockContention";

/**
 * Interactive lock-contention visualiser. Drives the pure `lockContention`
 * engine and draws a timeline where threads serialise on one lock: solid bars
 * are critical-section work, faded bars are time wasted waiting for the lock.
 * Used inline via <Sim>.
 */

export interface LockContentionProps {
  threads?: LockThread[];
  compact?: boolean;
}

const COLORS = ["#5b9dff", "#46c79a", "#e8a13c", "#c77dff", "#ff7a85", "#4dd0e1"];

const DEFAULT: LockThread[] = [
  { name: "T1", arrival: 0, work: 3 },
  { name: "T2", arrival: 1, work: 3 },
  { name: "T3", arrival: 2, work: 3 },
];

export function LockContention({ threads = DEFAULT, compact = true }: LockContentionProps) {
  const [ts, setTs] = useState<LockThread[]>(threads);
  const trace = useMemo(() => lockContention(ts), [ts]);
  const colorOf = (i: number) => COLORS[i % COLORS.length];

  const update = (i: number, patch: Partial<LockThread>) =>
    setTs((p) => p.map((t, k) => (k === i ? { ...t, ...patch } : t)));
  const add = () => setTs((p) => [...p, { name: `T${p.length + 1}`, arrival: p.length, work: 3 }]);
  const remove = (i: number) => setTs((p) => (p.length > 1 ? p.filter((_, k) => k !== i) : p));

  return (
    <div style={shell(compact)}>
      <Timeline trace={trace} threads={ts} colorOf={colorOf} />

      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 18, flexWrap: "wrap" }}>
        <span>завершение: <b>{trace.finish}</b></span>
        <span style={{ color: "#ff7a85" }}>суммарное ожидание лока: <b>{trace.totalWait}</b></span>
      </div>

      <div>
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 28px", gap: 8, fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", padding: "0 2px", marginBottom: 6 }}>
          <span /><span>хочет лок (t)</span><span>работа в крит. секции</span><span />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ts.map((t, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 28px", gap: 8, alignItems: "center" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: colorOf(i), display: "inline-block" }} title={t.name} />
              <NumInput value={t.arrival} min={0} onChange={(v) => update(i, { arrival: v })} />
              <NumInput value={t.work} min={1} onChange={(v) => update(i, { work: v })} />
              <button type="button" onClick={() => remove(i)} aria-label="Удалить поток" style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>
        <GhostBtn onClick={add} style={{ marginTop: 10 }}>+ поток</GhostBtn>
      </div>
    </div>
  );
}

function Timeline({
  trace,
  threads,
  colorOf,
}: {
  trace: ReturnType<typeof lockContention>;
  threads: LockThread[];
  colorOf: (i: number) => string;
}) {
  const PAD = 44;
  const W = 720;
  const innerW = W - PAD * 2;
  const rowH = 30;
  const total = Math.max(1, trace.finish);
  const H = threads.length * rowH + 34;
  const x = (t: number) => PAD + (t / total) * innerW;
  const idxOf = (name: string) => threads.findIndex((t) => t.name === name);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Таймлайн борьбы за лок" style={{ display: "block", minWidth: 480 }}>
        {/* row labels + baselines */}
        {threads.map((t, i) => (
          <g key={t.name}>
            <text x={6} y={18 + i * rowH + 14} fontSize={12} fontFamily="var(--font-mono)" fill="var(--text-secondary)">{t.name}</text>
            <line x1={PAD} y1={18 + i * rowH + rowH / 2} x2={W - PAD} y2={18 + i * rowH + rowH / 2} stroke="var(--border-subtle)" />
          </g>
        ))}

        {/* segments */}
        {trace.segments.map((s, k) => {
          const i = idxOf(s.name);
          const y = 18 + i * rowH + 5;
          const w = Math.max(1, (s.end - s.start) * (innerW / total));
          const hold = s.kind === "hold";
          return (
            <g key={k}>
              <rect
                x={x(s.start)}
                y={y}
                width={w}
                height={rowH - 12}
                rx={3}
                fill={colorOf(i)}
                opacity={hold ? 0.92 : 0.18}
                stroke={hold ? "none" : colorOf(i)}
                strokeDasharray={hold ? undefined : "3 3"}
              />
              {hold && w > 22 && (
                <text x={x((s.start + s.end) / 2)} y={y + (rowH - 12) / 2 + 4} textAnchor="middle" fontSize={10.5} fontFamily="var(--font-mono)" fill="#0b0d10">крит.</text>
              )}
            </g>
          );
        })}

        {/* time axis */}
        {Array.from({ length: total + 1 }).map((_, t) => (
          <text key={t} x={x(t)} y={H - 4} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="var(--text-tertiary)">{t}</text>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
        <span>▮ держит лок (крит. секция)</span>
        <span>▯ ждёт лок</span>
      </div>
    </div>
  );
}

function NumInput({ value, min, onChange }: { value: number; min: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        onChange(Number.isFinite(v) ? Math.max(min, v) : min);
      }}
      style={{ width: "100%", height: 30, padding: "0 8px", background: "var(--bg-canvas)", border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: 13 }}
    />
  );
}

function GhostBtn({ children, onClick, style }: { children: React.ReactNode; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button type="button" onClick={onClick} style={{ height: 30, padding: "0 12px", background: "transparent", border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: 13, cursor: "pointer", ...style }}>
      {children}
    </button>
  );
}

const shell = (compact: boolean): React.CSSProperties => ({
  border: "var(--border-width) solid var(--border-default)",
  borderRadius: "var(--radius-lg)",
  background: "var(--bg-elevated)",
  padding: compact ? 16 : 22,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  margin: compact ? "20px 0" : 0,
});

export default LockContention;
