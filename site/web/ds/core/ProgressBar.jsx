import React from 'react';

/** ProgressBar — determinate track. tone tints the fill. */
export function ProgressBar({ value = 0, max = 100, tone = 'accent', size = 'md', showLabel = false, label, style }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = {
    accent: 'var(--accent)', success: 'var(--success)', warning: 'var(--warning)', neutral: 'var(--text-secondary)',
  }[tone];
  const h = size === 'sm' ? 4 : size === 'lg' ? 10 : 6;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', ...style }}>
      <div style={{ flex: 1, height: h, background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: fill, borderRadius: 'var(--radius-pill)',
          transition: 'width var(--dur-slow) var(--ease-out)',
        }} />
      </div>
      {showLabel && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', minWidth: 36, textAlign: 'right' }}>
          {label ?? `${Math.round(pct)}%`}
        </span>
      )}
    </div>
  );
}

export default ProgressBar;
