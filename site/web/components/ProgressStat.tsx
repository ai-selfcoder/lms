"use client";

import { ProgressBar } from "@/ds";
import { useProgress } from "@/lib/progress";

/** Overall progress, driven by localStorage. `total` supplied by the server. */
export function ProgressStat({ total }: { total: number }) {
  const { count, percent } = useProgress(total);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--label-sm)",
          color: "var(--text-tertiary)",
          whiteSpace: "nowrap",
        }}
      >
        решено {count}/{total}
      </span>
      <div style={{ flex: 1 }}>
        <ProgressBar value={count} max={total || 1} tone="accent" />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--label-sm)",
          color: "var(--accent-text)",
          minWidth: 38,
          textAlign: "right",
        }}
      >
        {percent}%
      </span>
    </div>
  );
}
