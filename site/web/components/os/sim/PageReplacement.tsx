"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/ds";
import {
  pageReplacement,
  type ReplPolicy,
} from "@/lib/os/sim/pageReplacement";

/**
 * Interactive page-replacement visualiser. Drives the pure `pageReplacement`
 * engine and renders the per-access frame grid (hit/miss/eviction) plus totals.
 * Used inline in book chapters via <Sim>.
 */

export interface PageReplacementProps {
  initialRefs?: number[];
  initialCapacity?: number;
  initialPolicy?: ReplPolicy;
  compact?: boolean;
}

const HIT = "#46c79a";
const MISS = "#ff7a85";

const POLICIES: { value: ReplPolicy; label: string }[] = [
  { value: "FIFO", label: "FIFO" },
  { value: "LRU", label: "LRU" },
  { value: "CLOCK", label: "Clock" },
  { value: "OPT", label: "OPT" },
];

export function PageReplacement({
  initialRefs = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
  initialCapacity = 3,
  initialPolicy = "LRU",
  compact = true,
}: PageReplacementProps) {
  const [refsText, setRefsText] = useState(initialRefs.join(" "));
  const [capacity, setCapacity] = useState(initialCapacity);
  const [policy, setPolicy] = useState<ReplPolicy>(initialPolicy);

  const refs = useMemo(
    () => refsText.split(/[\s,]+/).map((s) => parseInt(s, 10)).filter((n) => Number.isFinite(n)),
    [refsText]
  );
  const trace = useMemo(
    () => pageReplacement({ refs, capacity, policy }),
    [refs, capacity, policy]
  );

  return (
    <div style={shell(compact)}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
        <SegmentedControl
          options={POLICIES}
          value={policy}
          onChange={(v) => setPolicy(v as ReplPolicy)}
          size="sm"
        />
        <Stepper label="кадры" value={capacity} min={1} max={6} onChange={setCapacity} />
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
          поток обращений
        </span>
        <input
          value={refsText}
          onChange={(e) => setRefsText(e.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            height: 34,
            padding: "0 10px",
            background: "var(--bg-canvas)",
            border: "var(--border-width) solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
            fontSize: 14,
          }}
        />
      </label>

      <Grid trace={trace} capacity={capacity} />

      <Totals trace={trace} />
    </div>
  );
}

function Grid({ trace, capacity }: { trace: ReturnType<typeof pageReplacement>; capacity: number }) {
  const { steps } = trace;
  if (steps.length === 0) return null;
  const colW = 30;

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "inline-flex", flexDirection: "column", gap: 4, minWidth: "100%" }}>
        {/* reference row */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <RowLabel>обращение</RowLabel>
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                width: colW,
                height: 26,
                display: "grid",
                placeItems: "center",
                borderRadius: 4,
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 600,
                color: s.hit ? HIT : MISS,
                background: s.hit ? `${HIT}1f` : `${MISS}1f`,
              }}
              title={s.hit ? "попадание (hit)" : "промах (miss)"}
            >
              {s.ref}
            </div>
          ))}
        </div>

        {/* frame rows */}
        {Array.from({ length: Math.max(1, capacity) }).map((_, row) => (
          <div key={row} style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <RowLabel>кадр {row}</RowLabel>
            {steps.map((s, i) => {
              const val = s.frames[row];
              const justPlaced = s.slot === row && !s.hit;
              const evicted = s.victim != null && s.slot === row;
              return (
                <div
                  key={i}
                  style={{
                    width: colW,
                    height: 28,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 4,
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: val == null ? "var(--text-tertiary)" : "var(--text-primary)",
                    background: justPlaced ? `${MISS}26` : "var(--bg-canvas)",
                    border: evicted
                      ? `var(--border-width) solid ${MISS}`
                      : "var(--border-width) solid var(--border-subtle)",
                  }}
                  title={evicted ? `вытеснена страница ${s.victim}` : undefined}
                >
                  {val == null ? "·" : val}
                </div>
              );
            })}
          </div>
        ))}

        {/* hit/miss row */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <RowLabel> </RowLabel>
          {steps.map((s, i) => (
            <div key={i} style={{ width: colW, textAlign: "center", fontSize: 11, fontFamily: "var(--font-mono)", color: s.hit ? HIT : MISS }}>
              {s.hit ? "✓" : "✗"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Totals({ trace }: { trace: ReturnType<typeof pageReplacement> }) {
  const pct = (trace.hitRate * 100).toFixed(0);
  return (
    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontFamily: "var(--font-mono)", fontSize: 13 }}>
      <span style={{ color: MISS }}>промахи (page faults): <b>{trace.misses}</b></span>
      <span style={{ color: HIT }}>попадания: <b>{trace.hits}</b></span>
      <span style={{ color: "var(--text-secondary)" }}>hit rate: <b>{pct}%</b></span>
    </div>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 64, flexShrink: 0, fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textAlign: "right", paddingRight: 4 }}>
      {children}
    </div>
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
    <button type="button" onClick={onClick} style={{ width: 26, height: 30, background: "var(--bg-canvas)", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 15 }}>
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

export default PageReplacement;
