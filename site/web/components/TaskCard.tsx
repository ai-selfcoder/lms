"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/ds";
import type { TaskMeta } from "@/lib/content";
import { useProgress } from "@/lib/progress";

type DiffTone = "easy" | "medium" | "hard";

const DIFFICULTY: Record<string, DiffTone> = {
  easy: "easy",
  легко: "easy",
  medium: "medium",
  средне: "medium",
  hard: "hard",
  сложно: "hard",
};

function diffTone(difficulty?: string): DiffTone | null {
  if (!difficulty) return null;
  return DIFFICULTY[difficulty.toLowerCase().trim()] ?? null;
}

/** Solved seal — filled tint circle + check. */
function CheckMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="var(--success)" opacity="0.16" />
      <path
        d="M7.5 12.5l3 3 6-6.5"
        stroke="var(--success)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Todo seal — hairline ring. */
function TodoMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="var(--border-strong)" strokeWidth="1.5" />
    </svg>
  );
}

export function DifficultyTag({ difficulty }: { difficulty?: string }) {
  const tone = diffTone(difficulty);
  if (!tone) return null;
  return (
    <Badge variant="difficulty" tone={tone} size="sm">
      {tone}
    </Badge>
  );
}

export function TaskCard({ task }: { task: TaskMeta }) {
  const { isSolved } = useProgress();
  const solved = isSolved(task.id);
  const tone = diffTone(task.difficulty);
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={`/go/tasks/${task.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        minHeight: 56,
        padding: "14px 16px",
        textDecoration: "none",
        background: "var(--bg-elevated)",
        border: `var(--border-width) solid ${
          hover ? "var(--border-strong)" : "var(--border-default)"
        }`,
        borderRadius: "var(--radius-lg)",
        transition:
          "border-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <span style={{ flexShrink: 0, display: "inline-flex" }}>
        {solved ? <CheckMark /> : <TodoMark />}
      </span>
      <span
        className="mono"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--text-tertiary)",
          width: 22,
          flexShrink: 0,
        }}
      >
        {String(task.num).padStart(2, "0")}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--body-md)",
            fontWeight: "var(--fw-medium)",
            color: "var(--text-primary)",
          }}
        >
          {task.title}
        </span>
        {task.type && (
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--label-xs)",
              color: "var(--text-tertiary)",
            }}
          >
            {task.type}
          </span>
        )}
      </span>
      {tone && (
        <Badge variant="difficulty" tone={tone} size="sm">
          {tone}
        </Badge>
      )}
    </Link>
  );
}
