"use client";

import { useState, useRef, useCallback, lazy, Suspense } from "react";
import { Button, Terminal, type TerminalStatus } from "@/ds";
import { runCode, type RunOutput } from "@/lib/playground/client";

// Monaco is heavy (~1 MB from CDN + a full editor instance). It is mounted ONLY
// after the reader chooses to edit a block — never on page load. A chapter with
// several runnable blocks would otherwise spin up an editor per block on load,
// which is the main cause of slow pages. "Запустить" works without Monaco: it
// runs the current `code` state, so most readers never pay the editor cost.
const MonacoEditor = lazy(() => import("@monaco-editor/react"));

const PlayIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);
const ResetIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

function statusOf(running: boolean, out: RunOutput | null): TerminalStatus {
  if (running) return "running";
  if (!out) return "idle";
  if (out.timedOut) return "timeout";
  if (out.err) return "fail";
  return "pass";
}

function renderOutput(out: RunOutput): string {
  if (out.timedOut) return "⏱ превышен лимит времени (5с)";
  const parts: string[] = [];
  if (out.stdout) parts.push(out.stdout.replace(/\n$/, ""));
  if (out.stderr) parts.push(out.stderr.replace(/\n$/, ""));
  if (out.err) parts.push(out.err);
  return parts.join("\n");
}

const codeFont =
  'var(--font-mono), "SF Mono", ui-monospace, Menlo, monospace';

/** Lightweight read-only view shown until the reader opts into editing. */
function CodeView({ code, onEdit }: { code: string; onEdit: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onFocus={onEdit}
      title="Нажмите, чтобы редактировать"
      style={{
        position: "relative",
        cursor: "text",
        background: "#1e1e1e",
        overflowX: "auto",
      }}
    >
      <pre
        style={{
          margin: 0,
          padding: "10px 14px",
          fontFamily: codeFont,
          fontSize: 13,
          lineHeight: "20px",
          color: "#d4d4d4",
          whiteSpace: "pre",
        }}
      >
        {code}
      </pre>
      <span
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          fontFamily: codeFont,
          fontSize: 10.5,
          color: "var(--text-tertiary)",
          opacity: 0.8,
          pointerEvents: "none",
        }}
      >
        ✎ редактировать
      </span>
    </div>
  );
}

export function Runnable({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [editing, setEditing] = useState(false);
  const [running, setRunning] = useState(false);
  const [out, setOut] = useState<RunOutput | null>(null);
  const [loadingRuntime, setLoadingRuntime] = useState(false);
  const firstRun = useRef(true);

  const onRun = useCallback(async () => {
    setRunning(true);
    if (firstRun.current) setLoadingRuntime(true);
    try {
      const r = await runCode(code);
      setOut(r);
    } finally {
      firstRun.current = false;
      setLoadingRuntime(false);
      setRunning(false);
    }
  }, [code]);

  const onReset = useCallback(() => {
    setCode(initialCode);
    setOut(null);
  }, [initialCode]);

  const status = statusOf(running, out);
  const lines = Math.min(20, Math.max(4, code.split("\n").length));

  return (
    <div
      style={{
        border: "1px solid var(--border-default)",
        borderRadius: 10,
        overflow: "hidden",
        margin: "16px 0",
        background: "var(--bg-surface)",
      }}
    >
      <div style={{ display: "flex", gap: 8, padding: "8px 10px", borderBottom: "1px solid var(--border-subtle)" }}>
        <Button hierarchy="accent" size="sm" onClick={onRun} disabled={running} loading={running} iconLeft={running ? undefined : PlayIcon}>
          {running ? "Выполняется" : "Запустить"}
        </Button>
        <Button hierarchy="secondary" size="sm" onClick={onReset} disabled={running} iconLeft={ResetIcon}>
          Сбросить
        </Button>
      </div>

      {editing ? (
        <Suspense fallback={<CodeView code={code} onEdit={() => {}} />}>
          <MonacoEditor
            height={`${lines * 20 + 24}px`}
            defaultLanguage="go"
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? "")}
            onMount={(editor) => editor.focus()}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: 4,
              insertSpaces: false,
              lineNumbers: "off",
              folding: false,
              padding: { top: 10, bottom: 10 },
              automaticLayout: true,
            }}
          />
        </Suspense>
      ) : (
        <CodeView code={code} onEdit={() => setEditing(true)} />
      )}

      {(out || running) && (
        <Terminal
          status={status}
          title="go run ."
          output={loadingRuntime ? "Загрузка среды Go… (один раз)" : out ? renderOutput(out) : ""}
          height={140}
          style={{ borderRadius: 0, border: "none", borderTop: "1px solid var(--border-default)" }}
        />
      )}
    </div>
  );
}
