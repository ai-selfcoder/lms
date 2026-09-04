"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { SegmentedControl, Button, Callout } from "@/ds";

type TabKey = "problem" | "theory" | "solution";

const LOCKED_COPY =
  "Эталонный разбор откроется, когда тесты пройдут. Сначала попробуй сам.";

export function DescPanel({
  taskId,
  problemNode,
  theoryNode,
  solutionNode,
  hasSolution,
  solved,
  hints,
}: {
  taskId: string;
  problemNode: ReactNode;
  theoryNode: ReactNode | null;
  solutionNode: ReactNode | null;
  hasSolution: boolean;
  solved: boolean;
  hints: string[];
}) {
  const [activeKey, setActiveKey] = useState<TabKey>("problem");
  const [revealSolution, setRevealSolution] = useState(false);

  const solutionUnlocked = solved || revealSolution;

  const options: { value: TabKey; label: string; locked?: boolean }[] = [
    { value: "problem", label: "Условие" },
  ];
  if (theoryNode) options.push({ value: "theory", label: "Теория" });
  if (hasSolution)
    options.push({
      value: "solution",
      label: "Решение",
      locked: !solutionUnlocked,
    });

  // If the active tab is now hidden/locked, fall back to "Условие".
  const visibleValues = options.map((o) => o.value);
  const effectiveKey = visibleValues.includes(activeKey) ? activeKey : "problem";

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        flexDirection: "column",
        background: "var(--bg-surface)",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: "10px 14px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <SegmentedControl
          options={options}
          value={effectiveKey}
          onChange={(v) => setActiveKey(v as TabKey)}
          size="md"
          fullWidth
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
        {effectiveKey === "problem" && (
          <>
            <div className="mdx">{problemNode}</div>
            <Hints taskId={taskId} hints={hints} />
          </>
        )}

        {effectiveKey === "theory" &&
          (theoryNode ? (
            <div className="mdx">{theoryNode}</div>
          ) : (
            <Empty>Теория ещё готовится.</Empty>
          ))}

        {effectiveKey === "solution" &&
          (solutionUnlocked ? (
            solutionNode ? (
              <div className="mdx">{solutionNode}</div>
            ) : (
              <Empty>Разбор ещё готовится.</Empty>
            )
          ) : (
            <SolutionLock onReveal={() => setRevealSolution(true)} />
          ))}
      </div>
    </div>
  );
}

const HINT_TONES = ["note", "tip", "warning"] as const;

const BulbIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z" />
  </svg>
);

function Hints({ taskId, hints }: { taskId: string; hints: string[] }) {
  const total = hints.length;
  const storageKey = `goroutine.hints.${taskId}`;
  const [revealed, setRevealed] = useState(0);

  // Load persisted reveal-count once per task.
  useEffect(() => {
    if (total === 0) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const n = raw ? parseInt(raw, 10) : 0;
      setRevealed(Number.isFinite(n) ? Math.max(0, Math.min(total, n)) : 0);
    } catch {
      setRevealed(0);
    }
  }, [storageKey, total]);

  const revealNext = useCallback(() => {
    setRevealed((prev) => {
      const next = Math.min(total, prev + 1);
      try {
        window.localStorage.setItem(storageKey, String(next));
      } catch {
        /* ignore quota / privacy-mode failures */
      }
      return next;
    });
  }, [storageKey, total]);

  if (total === 0) return null;

  const allShown = revealed >= total;

  return (
    <div
      style={{
        marginTop: 24,
        paddingTop: 18,
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          color: "var(--text-secondary)",
          marginBottom: 4,
        }}
      >
        <span style={{ display: "inline-flex", color: "var(--text-tertiary)" }}>
          {BulbIcon}
        </span>
        <span
          style={{
            fontSize: "var(--label-md)",
            fontWeight: "var(--fw-semibold)",
            color: "var(--text-primary)",
          }}
        >
          Подсказки
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--label-sm)",
            color: "var(--text-tertiary)",
          }}
        >
          {revealed}/{total}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 14px",
          fontSize: "var(--body-sm)",
          lineHeight: "20px",
          color: "var(--text-tertiary)",
        }}
      >
        Сначала попробуй сам — подсказки не дают готовый ответ.
      </p>

      {hints.slice(0, revealed).map((hint, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <Callout tone={HINT_TONES[Math.min(i, HINT_TONES.length - 1)]} title={`Подсказка ${i + 1}`}>
            {hint}
          </Callout>
        </div>
      ))}

      {!allShown && (
        <Button hierarchy="secondary" size="sm" onClick={revealNext}>
          {revealed === 0
            ? `Показать подсказку 1/${total}`
            : `Ещё подсказка (${revealed + 1}/${total})`}
        </Button>
      )}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        color: "var(--text-tertiary)",
        fontSize: "var(--body-sm)",
      }}
    >
      {children}
    </div>
  );
}

function SolutionLock({ onReveal }: { onReveal: () => void }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-md)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-tertiary)",
          marginBottom: 16,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </div>
      <div
        style={{
          fontSize: "var(--body-md)",
          fontWeight: "var(--fw-semibold)",
          color: "var(--text-primary)",
          marginBottom: 8,
        }}
      >
        Решение заблокировано
      </div>
      <p
        style={{
          fontSize: "var(--body-sm)",
          lineHeight: "22px",
          color: "var(--text-secondary)",
          maxWidth: 260,
          margin: "0 0 20px",
        }}
      >
        {LOCKED_COPY}
      </p>
      <Button hierarchy="secondary" size="sm" onClick={onReveal}>
        Показать всё равно
      </Button>
    </div>
  );
}
