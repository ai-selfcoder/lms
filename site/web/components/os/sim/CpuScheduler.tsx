"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { SegmentedControl } from "@/ds";
import {
  cpuScheduler,
  type Job,
  type Policy,
  type SchedulerParams,
} from "@/lib/os/sim/cpuScheduler";

/**
 * Interactive CPU-scheduling visualiser. Pure client component: it drives the
 * deterministic `cpuScheduler` engine and renders a Gantt chart + metrics. Used
 * both inline in book chapters (<Sim>) and on the full-screen sandbox page.
 */

const POLICIES: { value: Policy; label: string }[] = [
  { value: "FIFO", label: "FIFO" },
  { value: "SJF", label: "SJF" },
  { value: "STCF", label: "STCF" },
  { value: "RR", label: "RR" },
  { value: "MLFQ", label: "MLFQ" },
];

// Distinct, legible colours per job (cycled if more jobs than colours).
const JOB_COLORS = [
  "#5b9dff",
  "#46c79a",
  "#e8a13c",
  "#c77dff",
  "#ff7a85",
  "#4dd0e1",
  "#f06292",
  "#9ccc65",
];

const needsQuantum = (p: Policy) => p === "RR" || p === "MLFQ";

export interface CpuSchedulerProps {
  initialJobs?: Job[];
  initialPolicy?: Policy;
  initialQuantum?: number;
  /** Compact embed (inside a chapter) vs. full sandbox. */
  compact?: boolean;
}

const DEFAULT_JOBS: Job[] = [
  { name: "A", arrival: 0, burst: 6 },
  { name: "B", arrival: 0, burst: 3 },
  { name: "C", arrival: 0, burst: 1 },
];

export function CpuScheduler({
  initialJobs,
  initialPolicy = "FIFO",
  initialQuantum = 2,
  compact = false,
}: CpuSchedulerProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs ?? DEFAULT_JOBS);
  const [policy, setPolicy] = useState<Policy>(initialPolicy);
  const [quantum, setQuantum] = useState<number>(initialQuantum);

  const params: SchedulerParams = useMemo(
    () => ({ policy, jobs, quantum }),
    [policy, jobs, quantum]
  );
  const trace = useMemo(() => cpuScheduler(params), [params]);

  const totalTime = trace.segments.reduce((max, s) => Math.max(max, s.end), 0);

  // ---- animation playhead ------------------------------------------------
  const [cursor, setCursor] = useState<number | null>(null); // null = show all
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset the playhead whenever the schedule changes.
    setCursor(null);
    setPlaying(false);
  }, [trace]);

  useEffect(() => {
    if (!playing) return;
    let start: number | null = null;
    const SPEED = 1.4; // time units per second
    const from = cursor ?? 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = from + ((ts - start) / 1000) * SPEED;
      if (t >= totalTime) {
        setCursor(totalTime);
        setPlaying(false);
        return;
      }
      setCursor(t);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, totalTime]);

  const colorOf = (name: string) => {
    const idx = jobs.findIndex((j) => j.name === name);
    return JOB_COLORS[(idx < 0 ? 0 : idx) % JOB_COLORS.length];
  };

  // ---- job editing -------------------------------------------------------
  const updateJob = (i: number, patch: Partial<Job>) =>
    setJobs((prev) => prev.map((j, k) => (k === i ? { ...j, ...patch } : j)));
  const addJob = () =>
    setJobs((prev) => [
      ...prev,
      {
        name: String.fromCharCode(65 + prev.length),
        arrival: 0,
        burst: 3,
      },
    ]);
  const removeJob = (i: number) =>
    setJobs((prev) => (prev.length > 1 ? prev.filter((_, k) => k !== i) : prev));

  return (
    <div
      style={{
        border: "var(--border-width) solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-elevated)",
        padding: compact ? 16 : 22,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        margin: compact ? "20px 0" : 0,
      }}
    >
      {/* controls row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
        <SegmentedControl
          options={POLICIES}
          value={policy}
          onChange={(v) => setPolicy(v as Policy)}
          size="sm"
        />
        {needsQuantum(policy) && (
          <Stepper label="Квант" value={quantum} min={1} max={9} onChange={setQuantum} />
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <PlayButton
            playing={playing}
            onClick={() => {
              if (cursor === totalTime) setCursor(0);
              setPlaying((p) => !p);
            }}
          />
          <GhostBtn onClick={() => { setPlaying(false); setCursor(null); }}>Сброс</GhostBtn>
        </div>
      </div>

      {/* gantt chart */}
      <Gantt
        segments={trace.segments}
        jobs={jobs}
        totalTime={totalTime}
        cursor={cursor}
        colorOf={colorOf}
      />

      {/* metrics + editor */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : "1fr 1fr",
          gap: 18,
        }}
      >
        <JobEditor
          jobs={jobs}
          colorOf={colorOf}
          onUpdate={updateJob}
          onAdd={addJob}
          onRemove={removeJob}
        />
        <Metrics trace={trace} colorOf={colorOf} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gantt chart (SVG)
// ---------------------------------------------------------------------------

function Gantt({
  segments,
  jobs,
  totalTime,
  cursor,
  colorOf,
}: {
  segments: { job: string; start: number; end: number; queueLevel: number }[];
  jobs: Job[];
  totalTime: number;
  cursor: number | null;
  colorOf: (name: string) => string;
}) {
  const PAD = 28;
  const H = 60;
  const width = 720;
  const innerW = width - PAD * 2;
  const unit = totalTime > 0 ? innerW / totalTime : innerW;

  const x = (t: number) => PAD + t * unit;

  // Tick marks every 1 unit (sparser if long).
  const stepEvery = totalTime > 24 ? 5 : totalTime > 12 ? 2 : 1;
  const ticks: number[] = [];
  for (let t = 0; t <= totalTime; t += stepEvery) ticks.push(t);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${width} ${H + 46}`}
        width="100%"
        role="img"
        aria-label="Диаграмма Ганта планировщика"
        style={{ display: "block", minWidth: 480 }}
      >
        {/* baseline track */}
        <rect
          x={PAD}
          y={20}
          width={innerW}
          height={H}
          rx={6}
          fill="var(--bg-canvas)"
          stroke="var(--border-subtle)"
        />

        {/* segments */}
        {segments.map((s, i) => {
          const dimmed = cursor !== null && s.start >= cursor;
          const clip = cursor !== null ? Math.max(s.start, Math.min(s.end, cursor)) : s.end;
          const w = Math.max(0, (clip - s.start) * unit);
          return (
            <g key={i}>
              {/* faint full block so the layout is visible before the playhead */}
              <rect
                x={x(s.start)}
                y={22}
                width={Math.max(0, (s.end - s.start) * unit)}
                height={H - 4}
                rx={4}
                fill={colorOf(s.job)}
                opacity={dimmed ? 0.14 : 0.22}
              />
              {/* filled (played) portion */}
              <rect
                x={x(s.start)}
                y={22}
                width={w}
                height={H - 4}
                rx={4}
                fill={colorOf(s.job)}
                opacity={0.92}
              />
              {(s.end - s.start) * unit > 16 && (
                <text
                  x={x((s.start + s.end) / 2)}
                  y={22 + (H - 4) / 2 + 4}
                  textAnchor="middle"
                  fontSize={13}
                  fontFamily="var(--font-mono)"
                  fill="#0b0d10"
                  fontWeight={600}
                >
                  {s.job}
                </text>
              )}
            </g>
          );
        })}

        {/* arrival markers */}
        {jobs.map((j, i) => (
          <g key={`a${i}`}>
            <line
              x1={x(j.arrival)}
              y1={14}
              x2={x(j.arrival)}
              y2={20}
              stroke={colorOf(j.name)}
              strokeWidth={2}
            />
            <polygon
              points={`${x(j.arrival) - 3},14 ${x(j.arrival) + 3},14 ${x(j.arrival)},19`}
              fill={colorOf(j.name)}
            />
          </g>
        ))}

        {/* playhead */}
        {cursor !== null && cursor > 0 && (
          <line
            x1={x(cursor)}
            y1={16}
            x2={x(cursor)}
            y2={H + 24}
            stroke="var(--text-primary)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        )}

        {/* time axis */}
        {ticks.map((t) => (
          <g key={`t${t}`}>
            <line x1={x(t)} y1={H + 20} x2={x(t)} y2={H + 25} stroke="var(--border-strong)" />
            <text
              x={x(t)}
              y={H + 40}
              textAnchor="middle"
              fontSize={11}
              fontFamily="var(--font-mono)"
              fill="var(--text-tertiary)"
            >
              {t}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Job editor
// ---------------------------------------------------------------------------

function JobEditor({
  jobs,
  colorOf,
  onUpdate,
  onAdd,
  onRemove,
}: {
  jobs: Job[];
  colorOf: (name: string) => string;
  onUpdate: (i: number, patch: Partial<Job>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div>
      <Caption>Процессы</Caption>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: "20px 1fr 1fr 28px", gap: 8, fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", padding: "0 2px" }}>
          <span />
          <span>приход</span>
          <span>burst</span>
          <span />
        </div>
        {jobs.map((j, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "20px 1fr 1fr 28px", gap: 8, alignItems: "center" }}>
            <span
              style={{ width: 12, height: 12, borderRadius: 3, background: colorOf(j.name), display: "inline-block" }}
              title={j.name}
            />
            <NumInput value={j.arrival} min={0} onChange={(v) => onUpdate(i, { arrival: v })} />
            <NumInput value={j.burst} min={1} onChange={(v) => onUpdate(i, { burst: v })} />
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label="Удалить процесс"
              style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <GhostBtn onClick={onAdd} style={{ marginTop: 10 }}>+ процесс</GhostBtn>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metrics table
// ---------------------------------------------------------------------------

function Metrics({
  trace,
  colorOf,
}: {
  trace: ReturnType<typeof cpuScheduler>;
  colorOf: (name: string) => string;
}) {
  const cell: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 12.5,
    padding: "3px 6px",
    textAlign: "right",
    color: "var(--text-secondary)",
  };
  const head: React.CSSProperties = { ...cell, color: "var(--text-tertiary)", fontSize: 11 };
  return (
    <div>
      <Caption>Метрики</Caption>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...head, textAlign: "left" }}>job</th>
            <th style={head} title="turnaround = завершение − приход">оборот</th>
            <th style={head} title="response = первый старт − приход">отклик</th>
            <th style={head} title="wait = оборот − burst">ожидание</th>
          </tr>
        </thead>
        <tbody>
          {trace.metrics.map((m) => (
            <tr key={m.name}>
              <td style={{ ...cell, textAlign: "left", color: "var(--text-primary)" }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: colorOf(m.name), marginRight: 6 }} />
                {m.name}
              </td>
              <td style={cell}>{m.turnaround}</td>
              <td style={cell}>{m.response}</td>
              <td style={cell}>{m.wait}</td>
            </tr>
          ))}
          <tr>
            <td style={{ ...cell, textAlign: "left", color: "var(--text-tertiary)", borderTop: "var(--border-width) solid var(--border-subtle)" }}>сред.</td>
            <td style={{ ...cell, borderTop: "var(--border-width) solid var(--border-subtle)", color: "var(--text-primary)" }}>{trace.averages.turnaround.toFixed(2)}</td>
            <td style={{ ...cell, borderTop: "var(--border-width) solid var(--border-subtle)", color: "var(--text-primary)" }}>{trace.averages.response.toFixed(2)}</td>
            <td style={{ ...cell, borderTop: "var(--border-width) solid var(--border-subtle)", color: "var(--text-primary)" }}>{trace.averages.wait.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small UI atoms
// ---------------------------------------------------------------------------

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: 10, fontFamily: "var(--font-mono)" }}>
      {children}
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
      style={{
        width: "100%",
        height: 30,
        padding: "0 8px",
        background: "var(--bg-canvas)",
        border: "var(--border-width) solid var(--border-default)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
      }}
    />
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{label}</span>
      <div style={{ display: "inline-flex", alignItems: "center", border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
        <StepBtn onClick={() => onChange(Math.max(min, value - 1))}>−</StepBtn>
        <span style={{ width: 26, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)" }}>{value}</span>
        <StepBtn onClick={() => onChange(Math.min(max, value + 1))}>+</StepBtn>
      </div>
    </div>
  );
}

function StepBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: 26, height: 30, background: "var(--bg-canvas)", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 15 }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, style }: { children: React.ReactNode; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 30,
        padding: "0 12px",
        background: "transparent",
        border: "var(--border-width) solid var(--border-default)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-secondary)",
        fontFamily: "var(--font-sans)",
        fontSize: 13,
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function PlayButton({ playing, onClick }: { playing: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 30,
        padding: "0 14px",
        background: "var(--accent)",
        border: "none",
        borderRadius: "var(--radius-sm)",
        color: "var(--accent-fg)",
        fontFamily: "var(--font-sans)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {playing ? "⏸ Пауза" : "▶ Играть"}
    </button>
  );
}

export default CpuScheduler;
