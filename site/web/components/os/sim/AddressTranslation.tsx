"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/ds";
import {
  translate,
  toBits,
  type AddrMode,
  type AddrParams,
} from "@/lib/os/sim/addressTranslation";

/**
 * Interactive address-translation visualiser. Drives the pure `translate`
 * engine and shows how a virtual address splits into VPN|offset and is mapped
 * through the page table (or relocated via base/bounds). Used inline in book
 * chapters via <Sim>.
 */

export interface AddressTranslationProps {
  initialMode?: AddrMode;
  vaBits?: number;
  pageBits?: number;
  base?: number;
  bound?: number;
  table?: number[];
  tlb?: number[];
  levelBits?: number[];
  multi?: (number[] | null)[];
  initialVa?: number;
  compact?: boolean;
}

const VPN_COLOR = "#5b9dff";
const OFF_COLOR = "#46c79a";
const L2_COLOR = "#e8a13c";

export function AddressTranslation({
  initialMode = "paging",
  vaBits = 8,
  pageBits = 4,
  base = 32768,
  bound = 16384,
  table = [2, -1, 5, 0],
  tlb,
  levelBits = [2, 2],
  multi = [[3, -1, 5, -1], null, [0, 1, -1, 2], null],
  initialVa = 35,
  compact = true,
}: AddressTranslationProps) {
  const [mode, setMode] = useState<AddrMode>(initialMode);
  const maxVa = (1 << vaBits) - 1;
  const [va, setVa] = useState<number>(Math.min(initialVa, maxVa));

  const params: AddrParams = useMemo(
    () => ({ mode, vaBits, pageBits, base, bound, table, tlb, levelBits, multi, va }),
    [mode, vaBits, pageBits, base, bound, table, tlb, levelBits, multi, va]
  );
  const trace = useMemo(() => translate(params), [params]);

  const modeOptions =
    mode === "base-bound"
      ? [{ value: "base-bound", label: "base-and-bounds" }, { value: "paging", label: "Страницы" }]
      : [
          { value: "paging", label: "Страницы" },
          { value: "multi-level", label: "Многоуровневая" },
          { value: "base-bound", label: "base-and-bounds" },
        ];

  return (
    <div style={shell(compact)}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
        <SegmentedControl
          options={modeOptions}
          value={mode}
          onChange={(v) => setMode(v as AddrMode)}
          size="sm"
        />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={mono(12, "var(--text-tertiary)")}>va</span>
          <input
            type="number"
            value={va}
            min={0}
            max={maxVa}
            onChange={(e) => setVa(clamp(parseInt(e.target.value, 10), 0, maxVa))}
            style={numInput(70)}
          />
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={maxVa}
        value={va}
        onChange={(e) => setVa(parseInt(e.target.value, 10))}
        style={{ width: "100%", accentColor: VPN_COLOR }}
        aria-label="Виртуальный адрес"
      />

      {mode === "paging" && (
        <PagingView trace={trace} vaBits={vaBits} pageBits={pageBits} table={table} tlb={tlb} />
      )}
      {mode === "multi-level" && <MultiLevelView trace={trace} vaBits={vaBits} multi={multi} />}
      {mode === "base-bound" && <BaseBoundView trace={trace} base={base} bound={bound} maxVa={maxVa} />}

      <Steps trace={trace} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paging view: VA bits → page table → PA bits
// ---------------------------------------------------------------------------

function PagingView({
  trace,
  vaBits,
  pageBits,
  table,
  tlb,
}: {
  trace: ReturnType<typeof translate>;
  vaBits: number;
  pageBits: number;
  table: number[];
  tlb?: number[];
}) {
  const vpnBits = Math.max(1, vaBits - pageBits);
  const vaStr = toBits(trace.va, vaBits);
  const vpnPart = vaStr.slice(0, vpnBits);
  const offPart = vaStr.slice(vpnBits);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* VA bit decomposition */}
      <div>
        <Caption>Виртуальный адрес = {trace.va} ({vaBits} бит)</Caption>
        <div style={{ display: "flex", gap: 4, fontFamily: "var(--font-mono)", fontSize: 16, flexWrap: "wrap" }}>
          <BitGroup label={`VPN = ${trace.vpn}`} bits={vpnPart} color={VPN_COLOR} />
          <BitGroup label={`offset = ${trace.offset}`} bits={offPart} color={OFF_COLOR} />
        </div>
      </div>

      {/* TLB layer */}
      {tlb && (
        <div>
          <Caption>TLB (кэш трансляций)</Caption>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {tlb.map((v) => {
              const hit = v === trace.vpn && trace.ok;
              return (
                <span
                  key={v}
                  style={{
                    padding: "4px 9px",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12.5,
                    color: hit ? "#0b0d10" : VPN_COLOR,
                    background: hit ? OFF_COLOR : `${VPN_COLOR}1f`,
                    fontWeight: hit ? 700 : 500,
                  }}
                >
                  VPN {v}
                </span>
              );
            })}
            <span style={{ marginLeft: 4, fontSize: 12.5, fontFamily: "var(--font-mono)", color: trace.tlbHit ? OFF_COLOR : "#ff7a85" }}>
              {trace.tlbHit ? "→ TLB hit (таблицу не читаем)" : "→ TLB miss (идём в таблицу)"}
            </span>
          </div>
        </div>
      )}

      {/* page table */}
      <div>
        <Caption>Таблица страниц (VPN → кадр)</Caption>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {table.map((pfn, vpn) => {
            const active = vpn === trace.vpn;
            const invalid = pfn < 0;
            return (
              <div
                key={vpn}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 24px 1fr",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: active ? "var(--bg-canvas)" : "transparent",
                  border: active
                    ? `var(--border-width) solid ${trace.ok ? OFF_COLOR : "#ff7a85"}`
                    : "var(--border-width) solid transparent",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                }}
              >
                <span style={{ color: VPN_COLOR }}>VPN {vpn}</span>
                <span style={{ color: "var(--text-tertiary)" }}>→</span>
                <span style={{ color: invalid ? "#ff7a85" : "var(--text-primary)" }}>
                  {invalid ? "невалидна (не отображена)" : `кадр ${pfn}`}
                  {active && " ←"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* result */}
      <ResultBanner trace={trace}>
        {trace.ok && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 15 }}>
            <span style={{ color: VPN_COLOR }}>PFN {trace.pfn}</span>
            {" · "}
            <span style={{ color: OFF_COLOR }}>offset {trace.offset}</span>
            {" = "}
            <b>pa {trace.pa}</b>
          </span>
        )}
      </ResultBanner>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Base-and-bounds view
// ---------------------------------------------------------------------------

function BaseBoundView({
  trace,
  base,
  bound,
  maxVa,
}: {
  trace: ReturnType<typeof translate>;
  base: number;
  bound: number;
  maxVa: number;
}) {
  const inBounds = trace.ok;
  const frac = maxVa > 0 ? Math.min(1, Math.max(0, trace.va / maxVa)) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontFamily: "var(--font-mono)", fontSize: 13 }}>
        <span><span style={{ color: "var(--text-tertiary)" }}>base</span> = {base}</span>
        <span><span style={{ color: "var(--text-tertiary)" }}>bound</span> = {bound}</span>
        <span><span style={{ color: "var(--text-tertiary)" }}>va</span> = {trace.va}</span>
      </div>
      {/* bounds bar */}
      <div style={{ position: "relative", height: 22, borderRadius: 6, background: "var(--bg-canvas)", border: "var(--border-width) solid var(--border-subtle)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(Math.min(bound, maxVa) / maxVa) * 100}%`, background: `${OFF_COLOR}22` }} />
        <div style={{ position: "absolute", left: `${frac * 100}%`, top: 0, bottom: 0, width: 2, background: inBounds ? OFF_COLOR : "#ff7a85" }} />
      </div>
      <ResultBanner trace={trace}>
        {trace.ok && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 15 }}>
            pa = base + va = {base} + {trace.va} = <b>{trace.pa}</b>
          </span>
        )}
      </ResultBanner>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi-level view: VA → L1 | L2 | offset → outer directory → inner table
// ---------------------------------------------------------------------------

function MultiLevelView({
  trace,
  vaBits,
  multi,
}: {
  trace: ReturnType<typeof translate>;
  vaBits: number;
  multi: (number[] | null)[];
}) {
  const [l1Bits, l2Bits] = trace.levelBits ?? [2, 2];
  const vaStr = toBits(trace.va, vaBits);
  const l1Part = vaStr.slice(0, l1Bits);
  const l2Part = vaStr.slice(l1Bits, l1Bits + l2Bits);
  const offPart = vaStr.slice(l1Bits + l2Bits);
  const inner = trace.l1 != null && trace.l1 < multi.length ? multi[trace.l1] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Caption>Виртуальный адрес = {trace.va} ({vaBits} бит)</Caption>
        <div style={{ display: "flex", gap: 4, fontFamily: "var(--font-mono)", fontSize: 16, flexWrap: "wrap" }}>
          <BitGroup label={`L1 = ${trace.l1}`} bits={l1Part} color={VPN_COLOR} />
          <BitGroup label={`L2 = ${trace.l2}`} bits={l2Part} color={L2_COLOR} />
          <BitGroup label={`offset = ${trace.offset}`} bits={offPart} color={OFF_COLOR} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* outer directory */}
        <div>
          <Caption>Внешний каталог (L1)</Caption>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {multi.map((sub, i) => {
              const active = i === trace.l1;
              const absent = sub == null;
              return (
                <div key={i} style={rowStyle(active, absent ? "#ff7a85" : VPN_COLOR)}>
                  <span style={{ color: VPN_COLOR }}>[{i}]</span>
                  <span style={{ color: "var(--text-tertiary)" }}>→</span>
                  <span style={{ color: absent ? "#ff7a85" : "var(--text-primary)" }}>
                    {absent ? "не выделена" : "подтаблица"}{active && " ←"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* inner table */}
        <div>
          <Caption>Подтаблица (L2)</Caption>
          {inner == null ? (
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", padding: "6px 0" }}>
              — (каталог[{trace.l1}] пуст)
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {inner.map((pfn, i) => {
                const active = i === trace.l2;
                const invalid = pfn < 0;
                return (
                  <div key={i} style={rowStyle(active, invalid ? "#ff7a85" : L2_COLOR)}>
                    <span style={{ color: L2_COLOR }}>[{i}]</span>
                    <span style={{ color: "var(--text-tertiary)" }}>→</span>
                    <span style={{ color: invalid ? "#ff7a85" : "var(--text-primary)" }}>
                      {invalid ? "невалидна" : `кадр ${pfn}`}{active && " ←"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ResultBanner trace={trace}>
        {trace.ok && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 15 }}>
            <span style={{ color: VPN_COLOR }}>PFN {trace.pfn}</span>
            {" · "}
            <span style={{ color: OFF_COLOR }}>offset {trace.offset}</span>
            {" = "}
            <b>pa {trace.pa}</b>
          </span>
        )}
      </ResultBanner>
    </div>
  );
}

function rowStyle(active: boolean, accent: string): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "36px 18px 1fr",
    alignItems: "center",
    gap: 6,
    padding: "5px 8px",
    borderRadius: "var(--radius-sm)",
    background: active ? "var(--bg-canvas)" : "transparent",
    border: active ? `var(--border-width) solid ${accent}` : "var(--border-width) solid transparent",
    fontFamily: "var(--font-mono)",
    fontSize: 13,
  };
}

// ---------------------------------------------------------------------------
// Shared atoms
// ---------------------------------------------------------------------------

function BitGroup({ label, bits, color }: { label: string; bits: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {bits.split("").map((b, i) => (
          <span
            key={i}
            style={{
              width: 20,
              height: 26,
              display: "grid",
              placeItems: "center",
              borderRadius: 4,
              background: `${color}22`,
              color,
              fontWeight: 600,
            }}
          >
            {b}
          </span>
        ))}
      </div>
      <span style={{ fontSize: 11, color, fontFamily: "var(--font-mono)" }}>{label}</span>
    </div>
  );
}

function ResultBanner({ trace, children }: { trace: ReturnType<typeof translate>; children?: React.ReactNode }) {
  const ok = trace.ok;
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "var(--radius-md)",
        background: ok ? `${OFF_COLOR}18` : "#ff7a8518",
        border: `var(--border-width) solid ${ok ? OFF_COLOR : "#ff7a85"}`,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: ok ? OFF_COLOR : "#ff7a85" }}>
        {ok ? "✓ трансляция успешна" : "✗ page fault / выход за границы"}
      </span>
      {children}
      <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{trace.reason}</span>
    </div>
  );
}

function Steps({ trace }: { trace: ReturnType<typeof translate> }) {
  return (
    <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
      {trace.steps.map((s, i) => (
        <li key={i} style={{ fontSize: 12.5, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
          {s}
        </li>
      ))}
    </ol>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
      {children}
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

const mono = (size: number, color: string): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontSize: size,
  color,
});

const numInput = (w: number): React.CSSProperties => ({
  width: w,
  height: 30,
  padding: "0 8px",
  background: "var(--bg-canvas)",
  border: "var(--border-width) solid var(--border-default)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
});

function clamp(n: number, lo: number, hi: number) {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

export default AddressTranslation;
