"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Button, Terminal, Kbd, Badge, SegmentedControl, type TerminalStatus } from "@/ds";
import type { RunResult, TestCaseResult } from "./types";
import { MentorPanel } from "./MentorPanel";
import { QueueStatus } from "./QueueStatus";
import { compareTaskAttempts, type TaskAttempt } from "@/lib/progress";

const PlayIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);
const ResetIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const DocIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

/** Map the /api/run result + running flag to the DS Terminal status. */
function statusOf(running: boolean, result: RunResult | null): TerminalStatus {
  if (running) return "running";
  if (!result) return "idle";
  if (result.error) return "fail";
  if (result.timedOut) return "timeout";
  if (result.compileError) return "compile";
  return result.pass ? "pass" : "fail";
}

const EMPTY_TERMINAL = "Запусти тесты, чтобы увидеть вывод · ⌘↵";

// --- structured results: status glyphs -------------------------------------

const PassGlyph = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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
const FailGlyph = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="var(--danger)" opacity="0.16" />
    <path
      d="M8.5 8.5l7 7M15.5 8.5l-7 7"
      stroke="var(--danger)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);
const SkipGlyph = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="var(--text-disabled)" opacity="0.14" />
    <path
      d="M8 12h8"
      stroke="var(--text-tertiary)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

function glyphFor(status: TestCaseResult["status"]) {
  if (status === "pass") return PassGlyph;
  if (status === "fail") return FailGlyph;
  return SkipGlyph;
}

function fmtElapsed(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.max(0, Math.round(ms))}ms`;
}

type ResultsTab = "tests" | "log";

/** The verdict word for the summary header. */
function verdictOf(result: RunResult): { label: string; color: string } {
  if (result.error) return { label: "ОШИБКА", color: "var(--danger)" };
  if (result.timedOut) return { label: "TIMEOUT", color: "var(--warning)" };
  if (result.compileError) return { label: "COMPILE", color: "var(--warning)" };
  return result.pass
    ? { label: "PASS", color: "var(--success)" }
    : { label: "FAIL", color: "var(--danger)" };
}

function StructuredResults({
  result,
  height,
}: {
  result: RunResult;
  height: number;
}) {
  const verdict = verdictOf(result);
  const summary = result.summary;
  const passed = summary?.passed ?? 0;
  const failed = summary?.failed ?? 0;
  const duration = result.durationMs
    ? `${(result.durationMs / 1000).toFixed(2)}s`
    : null;

  // Failed tests first, then the rest in original order.
  const tests = useMemo(() => {
    const list = result.tests ?? [];
    return [...list].sort((a, b) => {
      const rank = (s: TestCaseResult["status"]) =>
        s === "fail" ? 0 : s === "skip" ? 2 : 1;
      return rank(a.status) - rank(b.status);
    });
  }, [result.tests]);

  return (
    <div
      style={{
        height,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-terminal)",
        borderTop: "1px solid var(--border-default)",
      }}
    >
      {/* summary header */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--label-sm)",
            fontWeight: "var(--fw-bold)",
            letterSpacing: "0.04em",
            color: verdict.color,
          }}
        >
          {verdict.label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--code-sm)",
            color: "var(--text-secondary)",
          }}
        >
          {passed} прошло · {failed} упало
        </span>
        {result.race && (
          <Badge variant="status" tone="timeout" dot size="sm">
            race
          </Badge>
        )}
        {duration && (
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--code-sm)",
              color: "var(--text-tertiary)",
            }}
          >
            {duration}
          </span>
        )}
      </div>

      {/* test rows */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 0" }}>
        {tests.map((t, i) => {
          const isFail = t.status === "fail";
          return (
            <div
              key={`${t.name}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "5px 14px",
                background: isFail ? "var(--danger-bg, rgba(239,68,68,0.06))" : "transparent",
              }}
            >
              <span style={{ display: "inline-flex", flexShrink: 0 }}>
                {glyphFor(t.status)}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--code-sm)",
                  color:
                    t.status === "skip"
                      ? "var(--text-tertiary)"
                      : "var(--text-primary)",
                  fontWeight: isFail ? "var(--fw-semibold)" : "var(--fw-regular)",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t.name || "(без имени)"}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  flexShrink: 0,
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--code-sm)",
                  color: "var(--text-tertiary)",
                }}
              >
                {fmtElapsed(t.elapsedMs)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EditorPanel({
  code,
  onChange,
  onRun,
  onReset,
  running,
  result,
  taskId,
  taskTitle,
  taskType,
  queue,
  attempts = [],
  onRestoreCode,
}: {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  running: boolean;
  result: RunResult | null;
  taskId: string;
  taskTitle?: string;
  taskType?: string;
  queue?: { position: number; queueLength: number } | null;
  attempts?: TaskAttempt[];
  onRestoreCode?: (code: string) => void;
}) {
  const runRef = useRef(onRun);
  runRef.current = onRun;

  const [termH, setTermH] = useState(208);
  const [resultsTab, setResultsTab] = useState<ResultsTab>("tests");

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runRef.current();
    });
  }, []);

  // Global ⌘↵ fallback even when editor isn't focused.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        runRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onDrag = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = termH;
      const move = (ev: PointerEvent) =>
        setTermH(Math.max(64, Math.min(460, startH + (startY - ev.clientY))));
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [termH]
  );

  const status = statusOf(running, result);
  const output = running ? "" : result ? result.output : "";
  const duration =
    !running && result && result.durationMs
      ? `${(result.durationMs / 1000).toFixed(2)}s`
      : undefined;

  const hasTests = !running && !!result && (result.tests?.length ?? 0) > 0;

  // Default back to «Тесты» whenever a fresh structured result arrives.
  useEffect(() => {
    if (hasTests) setResultsTab("tests");
  }, [hasTests, result]);

  const showStructured = hasTests && resultsTab === "tests";

  return (
    <div
      style={{
        display: "flex",
        minHeight: 0,
        flex: "1 1 auto",
        flexDirection: "column",
        background: "var(--bg-canvas)",
      }}
    >
      {/* toolbar */}
      <div
        style={{
          height: 48,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
        }}
      >
        <Button
          hierarchy="accent"
          size="sm"
          onClick={onRun}
          disabled={running}
          loading={running}
          iconLeft={running ? undefined : PlayIcon}
        >
          {running ? (queue ? "В очереди" : "Выполняется") : "Запустить тесты"}
          {!running && (
            <Kbd
              style={{
                marginLeft: 2,
                color: "var(--accent-fg)",
                background: "rgba(255,255,255,0.16)",
                border: "none",
              }}
            >
              ⌘↵
            </Kbd>
          )}
        </Button>
        <Button
          hierarchy="secondary"
          size="sm"
          onClick={onReset}
          disabled={running}
          iconLeft={ResetIcon}
        >
          Сбросить
        </Button>
        {queue ? (
          <span style={{ marginLeft: "auto" }}>
            <QueueStatus position={queue.position} queueLength={queue.queueLength} />
          </span>
        ) : (
          <span
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "var(--label-sm)",
              color: "var(--text-tertiary)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--success)",
              }}
            />
            <span style={{ fontFamily: "var(--font-mono)" }}>go test -race</span>
          </span>
        )}
      </div>

      {/* file tab + editor */}
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-inset)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0 16px",
              height: 38,
              borderRight: "1px solid var(--border-subtle)",
              borderBottom: "2px solid var(--accent)",
              background: "var(--bg-inset)",
            }}
          >
            {DocIcon}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--code-sm)",
                color: "var(--text-primary)",
              }}
            >
              solution.go
            </span>
          </div>
        </div>

        <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "hidden" }}>
          <Editor
            height="100%"
            defaultLanguage="go"
            theme="vs-dark"
            value={code}
            onChange={(v) => onChange(v ?? "")}
            onMount={handleMount}
            loading={
              <div
                style={{
                  display: "flex",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--code-sm)",
                }}
              >
                Загрузка редактора…
              </div>
            }
            options={{
              fontSize: 13,
              fontFamily:
                'var(--font-mono), "SF Mono", ui-monospace, Menlo, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: 4,
              insertSpaces: false,
              renderWhitespace: "selection",
              smoothScrolling: true,
              padding: { top: 12, bottom: 12 },
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      {/* drag handle */}
      <div
        onPointerDown={onDrag}
        style={{
          height: 6,
          flexShrink: 0,
          cursor: "ns-resize",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            width: 34,
            height: 3,
            borderRadius: 2,
            background: "var(--border-strong)",
          }}
        />
      </div>

      {/* results toggle bar — only when structured tests exist */}
      {hasTests && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            padding: "8px 14px",
            background: "var(--bg-surface)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <SegmentedControl
            size="sm"
            value={resultsTab}
            onChange={(v) => setResultsTab(v as ResultsTab)}
            options={[
              { value: "tests", label: "Тесты", badge: result?.tests?.length },
              { value: "log", label: "Лог" },
            ]}
          />
        </div>
      )}

      {/* results body: structured view or raw terminal */}
      {showStructured && result ? (
        <StructuredResults result={result} height={termH} />
      ) : (
        <div style={{ position: "relative", flexShrink: 0 }}>
        <Terminal
          status={status}
          output={output}
          duration={duration}
          height={termH}
          style={{ borderRadius: 0, border: "none", borderTop: "1px solid var(--border-default)" }}
        />
        {!output && status !== "running" && (
          // Exact empty-state microcopy from the spec (DS empty copy lacks "· ⌘↵").
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: termH,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--code-sm)",
              background: "var(--bg-terminal)",
              pointerEvents: "none",
            }}
          >
            {EMPTY_TERMINAL}
          </div>
        )}
        </div>
      )}

      {attempts.length > 0 && onRestoreCode && (
        <AttemptHistory attempts={attempts} onRestoreCode={onRestoreCode} />
      )}

      {/* AI mentor — visually subordinate to the test results. Self-hides
          when the backend has no Anthropic key configured. */}
      <MentorPanel
        taskId={taskId}
        code={code}
        title={taskTitle}
        type={taskType}
        testOutput={!running && result ? result.output : undefined}
      />
    </div>
  );
}

function AttemptHistory({ attempts, onRestoreCode }: { attempts: TaskAttempt[]; onRestoreCode: (code: string) => void }) {
  const [selectedId, setSelectedId] = useState(attempts[0]?.id ?? "");
  const selected = attempts.find((attempt) => attempt.id === selectedId) ?? attempts[0];
  useEffect(() => {
    if (!attempts.some((attempt) => attempt.id === selectedId)) setSelectedId(attempts[0]?.id ?? "");
  }, [attempts, selectedId]);
  if (!selected) return null;
  const visible = attempts.slice(0, 12);
  const comparison = compareTaskAttempts(attempts);
  const formatDelta = (ms: number) => `${ms >= 0 ? "+" : ""}${(ms / 1000).toFixed(2)}s`;
  return (
    <section style={{ flexShrink: 0, borderTop: "1px solid var(--border-default)", background: "var(--bg-surface)", padding: "10px 14px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ font: "11px var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)" }}>История попыток</span>
        <span style={{ font: "11px var(--font-mono)", color: "var(--text-disabled)" }}>{attempts.length}</span>
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {visible.map((attempt, index) => (
          <button key={attempt.id} type="button" onClick={() => setSelectedId(attempt.id)} style={{ flex: "0 0 auto", height: 28, padding: "0 8px", border: `1px solid ${selected.id === attempt.id ? "var(--accent)" : "var(--border-default)"}`, borderRadius: 4, background: selected.id === attempt.id ? "var(--bg-canvas)" : "transparent", color: attempt.passed ? "var(--success)" : "var(--danger)", font: "11px var(--font-mono)", cursor: "pointer" }}>
            {attempts.length - index}{attempt.passed ? " PASS" : " FAIL"}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 7, color: "var(--text-tertiary)", font: "11px var(--font-mono)" }}>
        <span>{new Date(selected.at).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}</span>
        {selected.summary && <span>{selected.summary}</span>}
        <button type="button" onClick={() => onRestoreCode(selected.code)} style={{ marginLeft: "auto", height: 27, padding: "0 9px", border: "1px solid var(--border-default)", borderRadius: 4, background: "transparent", color: "var(--text-secondary)", font: "11px var(--font-mono)", cursor: "pointer" }}>Восстановить код</button>
      </div>
      <pre style={{ maxHeight: 132, overflow: "auto", margin: "8px 0 0", padding: "8px 10px", border: "1px solid var(--border-subtle)", borderRadius: 4, background: "var(--bg-terminal)", color: "var(--text-secondary)", font: "11px/1.45 var(--font-mono)", whiteSpace: "pre-wrap" }}>{selected.code}</pre>
      {comparison && (
        <div style={{ marginTop: 10, borderTop: "1px solid var(--border-subtle)", paddingTop: 9 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ font: "11px var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)" }}>Первая → первая успешная</span>
            <span style={{ font: "11px var(--font-mono)", color: "var(--text-secondary)" }}>{comparison.attemptsBeforeSuccess} попыток · {comparison.changedLines} изменённых строк · время {formatDelta(comparison.durationDeltaMs)}</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button type="button" onClick={() => setSelectedId(comparison.first.id)} style={{ height: 26, padding: "0 8px", border: `1px solid ${selected.id === comparison.first.id ? "var(--accent)" : "var(--border-default)"}`, borderRadius: 4, background: "transparent", color: "var(--text-secondary)", font: "11px var(--font-mono)", cursor: "pointer" }}>Первая</button>
            <button type="button" onClick={() => setSelectedId(comparison.successful.id)} style={{ height: 26, padding: "0 8px", border: `1px solid ${selected.id === comparison.successful.id ? "var(--accent)" : "var(--border-default)"}`, borderRadius: 4, background: "transparent", color: "var(--text-secondary)", font: "11px var(--font-mono)", cursor: "pointer" }}>Успешная</button>
          </div>
          <p style={{ margin: "6px 0 7px", color: "var(--text-tertiary)", fontSize: 11, lineHeight: 1.45 }}>
            Сравнение показывает только наблюдаемые изменения между версиями. Увеличение числа строк не означает улучшение, а длительность отражает только время проверки.
          </p>
          <div style={{ maxHeight: 150, overflow: "auto", border: "1px solid var(--border-subtle)", borderRadius: 4, background: "var(--bg-terminal)", font: "11px/1.45 var(--font-mono)" }}>
            {comparison.diff.map((line, index) => (
              <div key={`${line.kind}-${index}`} style={{ display: "flex", gap: 8, padding: "2px 8px", color: line.kind === "added" ? "var(--success)" : line.kind === "removed" ? "var(--danger)" : "var(--text-tertiary)", background: line.kind === "added" ? "rgba(34,197,94,0.07)" : line.kind === "removed" ? "rgba(239,68,68,0.07)" : "transparent" }}>
                <span style={{ width: 10, flexShrink: 0 }}>{line.kind === "added" ? "+" : line.kind === "removed" ? "-" : " "}</span>
                <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{line.text || " "}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
