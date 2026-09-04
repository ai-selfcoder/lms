import React from 'react';

/* Colorize a `go test -race` line by its leading token. */
function renderLine(line, idx) {
  let color = 'var(--code-text)';
  const t = line.trimStart();
  if (/^(ok|PASS|--- PASS|=== RUN)/.test(t)) color = 'var(--success-fg)';
  else if (/^(FAIL|--- FAIL|panic:|.*\.go:\d+:)/.test(t)) color = 'var(--error-fg)';
  else if (/^(WARNING: DATA RACE|==================)/.test(t)) color = 'var(--warning-fg)';
  else if (/^(Goroutine|Previous|Read|Write|Found|Goexit)/.test(t)) color = 'var(--text-secondary)';
  else if (t.startsWith('$')) color = 'var(--text-tertiary)';
  return <div key={idx} style={{ whiteSpace: 'pre-wrap', color }}>{line === '' ? '\u00a0' : line}</div>;
}

const VERDICTS = {
  idle:    { label: 'Готов к запуску', fg: 'var(--text-tertiary)', dot: 'var(--text-tertiary)', glow: 'none' },
  running: { label: 'Выполняется…',    fg: 'var(--accent-text)',   dot: 'var(--accent)',   glow: 'none' },
  pass:    { label: 'PASS',            fg: 'var(--success-fg)',    dot: 'var(--success)',  glow: 'var(--glow-success)' },
  fail:    { label: 'FAIL',            fg: 'var(--error-fg)',      dot: 'var(--error)',    glow: 'var(--glow-error)' },
  timeout: { label: 'TIMEOUT',         fg: 'var(--warning-fg)',    dot: 'var(--warning)',  glow: 'none' },
  compile: { label: 'Ошибка компиляции', fg: 'var(--error-fg)',    dot: 'var(--error)',    glow: 'var(--glow-error)' },
};

/**
 * Terminal — the `go test -race` console. A first-class element: a verdict
 * header (status pill + duration) over the raw test output.
 * status: 'idle' | 'running' | 'pass' | 'fail' | 'timeout' | 'compile'
 */
export function Terminal({ status = 'idle', output = '', duration, title = 'go test -race ./...', height = 220, style }) {
  const v = VERDICTS[status] || VERDICTS.idle;
  const lines = output ? output.replace(/\n$/, '').split('\n') : [];

  return (
    <div style={{
      background: 'var(--bg-terminal)', border: 'var(--border-width) solid var(--border-default)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: v.glow, ...style,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
        borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.015)', flexShrink: 0,
      }}>
        <span style={{ display: 'flex', gap: 6 }}>
          <i style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--grey-700)' }} />
          <i style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--grey-700)' }} />
          <i style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--grey-700)' }} />
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--code-sm)', color: 'var(--text-tertiary)' }}>{title}</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {status === 'running' ? (
            <span style={{ width: 9, height: 9, borderRadius: '50%', border: '1.5px solid var(--accent)', borderTopColor: 'transparent', animation: 'goro-spin 0.7s linear infinite' }} />
          ) : (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.dot, boxShadow: status === 'pass' || status === 'fail' ? `0 0 8px ${v.dot}` : 'none' }} />
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm)', fontWeight: 'var(--fw-medium)', color: v.fg, letterSpacing: '0.04em' }}>{v.label}</span>
          {duration && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--label-xs)', color: 'var(--text-tertiary)' }}>{duration}</span>}
        </span>
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: lines.length ? '12px 14px' : 0, fontFamily: 'var(--font-mono)', fontSize: 'var(--code-md)', lineHeight: 'var(--code-md-lh)', height }}>
        {lines.length ? lines.map(renderLine) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--code-sm)' }}>
            Запусти тесты, чтобы увидеть вывод
          </div>
        )}
      </div>
      <style>{`@keyframes goro-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default Terminal;
