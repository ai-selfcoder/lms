"use client";

import { CpuScheduler } from "./CpuScheduler";
import { AddressTranslation } from "./AddressTranslation";
import { PageReplacement } from "./PageReplacement";
import { DiskScheduler } from "./DiskScheduler";
import { LockContention } from "./LockContention";
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
}: {
  kind: string;
  defaults?: Record<string, unknown>;
  compact?: boolean;
}) {
  const d = defaults ?? {};

  if (kind === "cpu-scheduler") {
    return (
      <CpuScheduler
        initialJobs={Array.isArray(d.jobs) ? (d.jobs as Job[]) : undefined}
        initialPolicy={typeof d.policy === "string" ? (d.policy as Policy) : undefined}
        initialQuantum={typeof d.quantum === "number" ? d.quantum : undefined}
        compact={compact}
      />
    );
  }

  if (kind === "address-translation") {
    return (
      <AddressTranslation
        initialMode={typeof d.mode === "string" ? (d.mode as AddrMode) : undefined}
        vaBits={typeof d.vaBits === "number" ? d.vaBits : undefined}
        pageBits={typeof d.pageBits === "number" ? d.pageBits : undefined}
        base={typeof d.base === "number" ? d.base : undefined}
        bound={typeof d.bound === "number" ? d.bound : undefined}
        table={Array.isArray(d.table) ? (d.table as number[]) : undefined}
        tlb={Array.isArray(d.tlb) ? (d.tlb as number[]) : undefined}
        levelBits={Array.isArray(d.levelBits) ? (d.levelBits as number[]) : undefined}
        multi={Array.isArray(d.multi) ? (d.multi as (number[] | null)[]) : undefined}
        initialVa={typeof d.va === "number" ? d.va : undefined}
        compact={compact}
      />
    );
  }

  if (kind === "page-replacement") {
    return (
      <PageReplacement
        initialRefs={Array.isArray(d.refs) ? (d.refs as number[]) : undefined}
        initialCapacity={typeof d.capacity === "number" ? d.capacity : undefined}
        initialPolicy={typeof d.policy === "string" ? (d.policy as ReplPolicy) : undefined}
        compact={compact}
      />
    );
  }

  if (kind === "disk-scheduler") {
    return (
      <DiskScheduler
        start={typeof d.start === "number" ? d.start : undefined}
        requests={Array.isArray(d.requests) ? (d.requests as number[]) : undefined}
        policy={typeof d.policy === "string" ? (d.policy as DiskPolicy) : undefined}
        compact={compact}
      />
    );
  }

  if (kind === "lock-contention") {
    return (
      <LockContention
        threads={Array.isArray(d.threads) ? (d.threads as LockThread[]) : undefined}
        compact={compact}
      />
    );
  }

  return null;
}

export default SimRenderer;
