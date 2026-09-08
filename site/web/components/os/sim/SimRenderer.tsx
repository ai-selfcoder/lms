"use client";

import { CpuScheduler } from "./CpuScheduler";
import { AddressTranslation } from "./AddressTranslation";
import { PageReplacement } from "./PageReplacement";
import { DiskScheduler } from "./DiskScheduler";
import { LockContention } from "./LockContention";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { recordLearningEvent } from "@/lib/progress";
import { cpuScheduler } from "@/lib/os/sim/cpuScheduler";
import { pageReplacement } from "@/lib/os/sim/pageReplacement";
import { diskScheduler } from "@/lib/os/sim/diskScheduler";
import type { Job, Policy } from "@/lib/os/sim/cpuScheduler";
import type { AddrMode } from "@/lib/os/sim/addressTranslation";
import type { ReplPolicy } from "@/lib/os/sim/pageReplacement";
import type { DiskPolicy } from "@/lib/os/sim/diskScheduler";
import type { LockThread } from "@/lib/os/sim/lockContention";

/**
 * Maps a sim manifest (`kind` + free-form `defaults`) to the concrete widget.
 * One place to register simulator kinds; unknown kinds render nothing so a
 * chapter never crashes on a typo or a not-yet-built sim.
 */
export function SimRenderer({
  kind,
  defaults,
  compact = true,
  simId,
  urlState = false,
}: {
  kind: string;
  defaults?: Record<string, unknown>;
  compact?: boolean;
  simId?: string;
  /** Persist sandbox controls in ?state=... (standalone labs only). */
  urlState?: boolean;
}) {
  const d = useMemo(() => defaults ?? {}, [defaults]);
  const [urlOverrides, setUrlOverrides] = useState<Record<string, unknown> | null>(urlState ? null : {});
  const [currentState, setCurrentState] = useState<Record<string, unknown>>(d);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!urlState || typeof window === "undefined") return;
    const raw = new URL(window.location.href).searchParams.get("state");
    if (!raw) {
      setUrlOverrides({});
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      setUrlOverrides(parsed && typeof parsed === "object" ? parsed : {});
    } catch {
      setUrlOverrides({});
    }
  }, [urlState]);
  const merged = useMemo(() => ({ ...d, ...(urlOverrides ?? {}) }), [d, urlOverrides]);
  useEffect(() => setCurrentState(merged), [merged]);
  const updateUrl = useCallback((state: Record<string, unknown>) => {
    if (!urlState || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("state", JSON.stringify(state));
    window.history.replaceState({}, "", url);
  }, [urlState]);
  const handleStateChange = useCallback((state: Record<string, unknown>) => {
    setCurrentState(state);
    updateUrl(state);
  }, [updateUrl]);
  useEffect(() => {
    if (simId) recordLearningEvent("started", `os:lab:${simId}`, { courseId: "os", eventId: `started:os:lab:${simId}` });
  }, [simId]);

  if (urlState && urlOverrides === null) return <div style={{ minHeight: 120, display: "grid", placeItems: "center", color: "var(--text-tertiary)", font: "12px var(--font-mono)" }}>загрузка состояния…</div>;
  const share = async () => {
    if (typeof window === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  const controls = (child: ReactNode) => urlState ? <>
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><button type="button" onClick={share} aria-live="polite" style={{ height: 30, padding: "0 10px", color: copied ? "var(--success)" : "var(--text-secondary)", border: "1px solid var(--border-default)", borderRadius: 4, background: "var(--bg-canvas)", font: "11px var(--font-mono)", cursor: "pointer" }}>{copied ? "Ссылка скопирована" : "Скопировать ссылку"}</button></div>
    {child}
  </> : child;
  const compare = (kind === "cpu-scheduler" || kind === "page-replacement" || kind === "disk-scheduler") && urlState
    ? <Comparison kind={kind} state={currentState} />
    : null;

  if (kind === "cpu-scheduler") {
    return <>{controls(<CpuScheduler initialJobs={Array.isArray(merged.jobs) ? (merged.jobs as Job[]) : undefined} initialPolicy={typeof merged.policy === "string" ? (merged.policy as Policy) : undefined} initialQuantum={typeof merged.quantum === "number" ? merged.quantum : undefined} onStateChange={handleStateChange} compact={compact} />)}{compare}</>;
  }

  if (kind === "address-translation") {
    return controls(<AddressTranslation initialMode={typeof merged.mode === "string" ? (merged.mode as AddrMode) : undefined} vaBits={typeof merged.vaBits === "number" ? merged.vaBits : undefined} pageBits={typeof merged.pageBits === "number" ? merged.pageBits : undefined} base={typeof merged.base === "number" ? merged.base : undefined} bound={typeof merged.bound === "number" ? merged.bound : undefined} table={Array.isArray(merged.table) ? (merged.table as number[]) : undefined} tlb={Array.isArray(merged.tlb) ? (merged.tlb as number[]) : undefined} levelBits={Array.isArray(merged.levelBits) ? (merged.levelBits as number[]) : undefined} multi={Array.isArray(merged.multi) ? (merged.multi as (number[] | null)[]) : undefined} initialVa={typeof merged.va === "number" ? merged.va : undefined} onStateChange={handleStateChange} compact={compact} />);
  }

  if (kind === "page-replacement") {
    return <>{controls(<PageReplacement initialRefs={Array.isArray(merged.refs) ? (merged.refs as number[]) : undefined} initialCapacity={typeof merged.capacity === "number" ? merged.capacity : undefined} initialPolicy={typeof merged.policy === "string" ? (merged.policy as ReplPolicy) : undefined} onStateChange={handleStateChange} compact={compact} />)}{compare}</>;
  }

  if (kind === "disk-scheduler") {
    return <>{controls(<DiskScheduler start={typeof merged.start === "number" ? (merged.start as number) : undefined} requests={Array.isArray(merged.requests) ? (merged.requests as number[]) : undefined} policy={typeof merged.policy === "string" ? (merged.policy as DiskPolicy) : undefined} onStateChange={handleStateChange} compact={compact} />)}{compare}</>;
  }

  if (kind === "lock-contention") {
    return controls(<LockContention
      threads={Array.isArray(merged.threads) ? (merged.threads as LockThread[]) : undefined}
      onStateChange={handleStateChange}
      compact={compact}
    />);
  }

  return null;
}

function Comparison({ kind, state }: { kind: string; state: Record<string, unknown> }) {
  const policy = typeof state.policy === "string" ? state.policy : "";
  const rows: { policy: string; primary: string; secondary?: string }[] = [];
  if (kind === "cpu-scheduler") {
    const jobs = Array.isArray(state.jobs) ? (state.jobs as Job[]) : [];
    const quantum = typeof state.quantum === "number" ? state.quantum : 2;
    for (const candidate of ["FIFO", "SJF", "STCF", "RR", "MLFQ"] as Policy[]) {
      const trace = cpuScheduler({ jobs, policy: candidate, quantum });
      rows.push({ policy: candidate, primary: `wait ${trace.averages.wait.toFixed(2)}`, secondary: `turnaround ${trace.averages.turnaround.toFixed(2)}` });
    }
  } else if (kind === "page-replacement") {
    const refs = Array.isArray(state.refs) ? (state.refs as number[]) : [];
    const capacity = typeof state.capacity === "number" ? state.capacity : 3;
    for (const candidate of ["FIFO", "LRU", "CLOCK", "OPT"] as ReplPolicy[]) {
      const trace = pageReplacement({ refs, capacity, policy: candidate });
      rows.push({ policy: candidate, primary: `${trace.misses} промахов`, secondary: `hit rate ${(trace.hitRate * 100).toFixed(0)}%` });
    }
  } else {
    const start = typeof state.start === "number" ? state.start : 53;
    const requests = Array.isArray(state.requests) ? (state.requests as number[]) : [];
    for (const candidate of ["FIFO", "SSTF", "SCAN"] as DiskPolicy[]) {
      const trace = diskScheduler({ start, requests, policy: candidate });
      rows.push({ policy: candidate, primary: `${trace.total} цилиндров` });
    }
  }
  return (
    <section style={{ marginTop: 14, border: "var(--border-width) solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: 16, background: "var(--bg-elevated)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <strong style={{ fontSize: 13, color: "var(--text-primary)" }}>Сравнение алгоритмов</strong>
        <span style={{ font: "11px var(--font-mono)", color: "var(--text-tertiary)" }}>текущий: {policy || "—"}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        {rows.map((row) => (
          <div key={row.policy} style={{ border: "var(--border-width) solid var(--border-subtle)", borderRadius: 4, padding: "9px 10px", background: row.policy === policy ? "var(--bg-canvas)" : "transparent" }}>
            <div style={{ font: "12px var(--font-mono)", color: "var(--text-primary)", marginBottom: 5 }}>{row.policy}</div>
            <div style={{ font: "12px var(--font-mono)", color: "var(--accent-text)" }}>{row.primary}</div>
            {row.secondary && <div style={{ marginTop: 3, font: "11px var(--font-mono)", color: "var(--text-tertiary)" }}>{row.secondary}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

export default SimRenderer;
