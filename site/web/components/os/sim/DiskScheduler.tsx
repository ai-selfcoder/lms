"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/ds";
import { diskScheduler, type DiskPolicy } from "@/lib/os/sim/diskScheduler";

/**
 * Interactive disk-scheduling visualiser. Drives the pure `diskScheduler`
 * engine and draws the head's path across cylinders (time flows downward) so
 * the cost of FIFO vs SSTF vs SCAN is visible. Used inline via <Sim>.
 */

export interface DiskSchedulerProps {
  start?: number;
  requests?: number[];
  policy?: DiskPolicy;
  compact?: boolean;
}

const POLICIES: { value: DiskPolicy; label: string }[] = [
  { value: "FIFO", label: "FIFO" },
  { value: "SSTF", label: "SSTF" },
  { value: "SCAN", label: "SCAN (лифт)" },
];

const ACCENT = "#46c79a";

export function DiskScheduler({
  start = 53,
  requests = [98, 183, 37, 122, 14, 124, 65, 67],
  policy = "SSTF",
  compact = true,
}: DiskSchedulerProps) {
  const [head, setHead] = useState(start);
  const [reqText, setReqText] = useState(requests.join(" "));
  const [pol, setPol] = useState<DiskPolicy>(policy);

  const reqs = useMemo(
    () => reqText.split(/[\s,]+/).map((s) => parseInt(s, 10)).filter(Number.isFinite),
    [reqText]
  );
  const trace = useMemo(() => diskScheduler({ start: head, requests: reqs, policy: pol }), [head, reqs, pol]);

  return (
    <div style={shell(compact)}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
        <SegmentedControl options={POLICIES} value={pol} onChange={(v) => setPol(v as DiskPolicy)} size="sm" />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>головка</span>
          <input
            type="number"
            value={head}
            min={0}
            onChange={(e) => setHead(Math.max(0, parseInt(e.target.value, 10) || 0))}
            style={numInput(64)}
          />
        </div>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={cap}>запросы (номера цилиндров)</span>
        <input value={reqText} onChange={(e) => setReqText(e.target.value)} spellCheck={false} style={textInput} />
      </label>

      <Path trace={trace} />

      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)" }}>
        суммарное перемещение головки: <b style={{ color: ACCENT }}>{trace.total}</b> цилиндров
        <span style={{ color: "var(--text-tertiary)" }}>
          {"  ·  порядок: "}
          {[trace.start, ...trace.order].join(" → ")}
        </span>
      </div>
    </div>
  );
}

function Path({ trace }: { trace: ReturnType<typeof diskScheduler> }) {
  const pts = [trace.start, ...trace.order];
  const maxCyl = Math.max(1, trace.start, ...trace.order);
  const PAD = 36;
  const W = 720;
  const innerW = W - PAD * 2;
  const rowH = 30;
  const H = Math.max(rowH, pts.length * rowH) + 30;
  const x = (c: number) => PAD + (c / maxCyl) * innerW;
  const y = (row: number) => 24 + row * rowH;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Путь головки диска" style={{ display: "block", minWidth: 480 }}>
        {/* axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const c = Math.round(f * maxCyl);
          return (
            <g key={f}>
              <line x1={x(c)} y1={16} x2={x(c)} y2={H - 8} stroke="var(--border-subtle)" strokeDasharray="2 4" />
              <text x={x(c)} y={12} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="var(--text-tertiary)">{c}</text>
            </g>
          );
        })}

        {/* path polyline */}
        <polyline
          points={pts.map((c, i) => `${x(c)},${y(i)}`).join(" ")}
          fill="none"
          stroke={ACCENT}
          strokeWidth={2}
          opacity={0.7}
        />

        {/* points */}
        {pts.map((c, i) => (
          <g key={i}>
            <circle cx={x(c)} cy={y(i)} r={i === 0 ? 6 : 5} fill={i === 0 ? "var(--text-primary)" : ACCENT} />
            <text x={x(c)} y={y(i) + 4} dx={10} fontSize={11.5} fontFamily="var(--font-mono)" fill="var(--text-secondary)">
              {c}{i === 0 ? " (старт)" : ""}
            </text>
          </g>
        ))}
      </svg>
    </div>
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

const cap: React.CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" };
const textInput: React.CSSProperties = { width: "100%", height: 34, padding: "0 10px", background: "var(--bg-canvas)", border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: 14 };
const numInput = (w: number): React.CSSProperties => ({ width: w, height: 30, padding: "0 8px", background: "var(--bg-canvas)", border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: 13 });

export default DiskScheduler;
