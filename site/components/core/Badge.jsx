import React from 'react';

/**
 * Badge — compact status / difficulty / meta pill.
 * variant: 'status' (with dot) | 'difficulty' | 'neutral' | 'count'
 * tone:   'pass' | 'fail' | 'timeout' | 'info' | 'neutral' | 'easy' | 'medium' | 'hard'
 */
export function Badge({ children, variant = 'neutral', tone = 'neutral', dot, size = 'md', style, ...rest }) {
  const toneMap = {
    pass:    { fg: 'var(--success-fg)', bg: 'var(--success-bg)', bd: 'var(--success-border)', dot: 'var(--success)' },
    fail:    { fg: 'var(--error-fg)',   bg: 'var(--error-bg)',   bd: 'var(--error-border)',   dot: 'var(--error)' },
    timeout: { fg: 'var(--warning-fg)', bg: 'var(--warning-bg)', bd: 'var(--warning-border)', dot: 'var(--warning)' },
    info:    { fg: 'var(--accent-text)', bg: 'var(--info-bg)',   bd: 'var(--info-border)',    dot: 'var(--accent)' },
    easy:    { fg: 'var(--diff-easy)',   bg: 'var(--success-bg)', bd: 'var(--success-border)', dot: 'var(--diff-easy)' },
    medium:  { fg: 'var(--diff-medium)', bg: 'var(--warning-bg)', bd: 'var(--warning-border)', dot: 'var(--diff-medium)' },
    hard:    { fg: 'var(--diff-hard)',   bg: 'var(--error-bg)',   bd: 'var(--error-border)',   dot: 'var(--diff-hard)' },
    neutral: { fg: 'var(--text-secondary)', bg: 'var(--bg-elevated)', bd: 'var(--border-default)', dot: 'var(--text-tertiary)' },
  }[tone];

  const sz = size === 'sm'
    ? { h: 18, px: 6, font: 'var(--label-xs)', gap: 5, dot: 5 }
    : { h: 22, px: 8, font: 'var(--label-sm)', gap: 6, dot: 6 };

  const showDot = dot ?? (variant === 'status' || variant === 'difficulty');
  const mono = variant === 'count';

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: sz.gap,
        height: sz.h, padding: `0 ${sz.px}px`,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        fontSize: sz.font, fontWeight: 'var(--fw-medium)', letterSpacing: '0.01em',
        color: toneMap.fg, background: toneMap.bg,
        border: `var(--border-width) solid ${toneMap.bd}`,
        borderRadius: variant === 'count' ? 'var(--radius-sm)' : 'var(--radius-pill)',
        whiteSpace: 'nowrap', textTransform: variant === 'difficulty' ? 'capitalize' : 'none',
        ...style,
      }}
      {...rest}
    >
      {showDot && <span style={{ width: sz.dot, height: sz.dot, borderRadius: '50%', background: toneMap.dot, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

export default Badge;
