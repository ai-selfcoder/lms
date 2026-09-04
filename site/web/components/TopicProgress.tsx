"use client";

import { useProgress } from "@/lib/progress";
import type { TaskMeta } from "@/lib/content";

/** Small "n/m решено" mono badge for a topic, driven by localStorage. */
export function TopicProgress({ tasks }: { tasks: TaskMeta[] }) {
  const { isSolved } = useProgress();
  const done = tasks.filter((t) => isSolved(t.id)).length;
  const all = tasks.length > 0 && done === tasks.length;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 22,
        padding: "0 8px",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--label-sm)",
        color: all ? "var(--success-fg)" : "var(--text-tertiary)",
        background: all ? "var(--success-bg)" : "var(--bg-elevated)",
        border: `var(--border-width) solid ${
          all ? "var(--success-border)" : "var(--border-default)"
        }`,
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
      }}
    >
      {done}/{tasks.length} решено
    </span>
  );
}
