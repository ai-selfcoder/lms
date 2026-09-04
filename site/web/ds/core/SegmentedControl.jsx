import React from 'react';

/**
 * SegmentedControl — tab-like switch. Used for the trainer's
 * "Условие · Теория · Решение" panel and for compact view toggles.
 * options: [{ value, label, icon?, locked?, badge? }]
 */
export function SegmentedControl({ options = [], value, onChange, size = 'md', fullWidth = false, style }) {
  const sz = size === 'sm'
    ? { h: 30, px: 10, font: 'var(--label-md)', gap: 6 }
    : { h: 36, px: 14, font: 'var(--label-lg)', gap: 7 };

  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex', gap: 2, padding: 3,
        width: fullWidth ? '100%' : undefined,
        background: 'var(--bg-inset)',
        border: 'var(--border-width) solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        ...style,
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        const locked = opt.locked;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={selected}
            disabled={locked}
            onClick={() => !locked && onChange && onChange(opt.value)}
            style={{
              flex: fullWidth ? 1 : undefined,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: sz.gap,
              height: sz.h, padding: `0 ${sz.px}px`,
              fontFamily: 'var(--font-sans)', fontSize: sz.font, fontWeight: 'var(--fw-medium)',
              color: locked ? 'var(--text-disabled)' : selected ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: selected ? 'var(--bg-elevated)' : 'transparent',
              border: `var(--border-width) solid ${selected ? 'var(--border-strong)' : 'transparent'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: locked ? 'not-allowed' : 'pointer',
              boxShadow: selected ? 'var(--shadow-xs)' : 'none',
              transition: 'all var(--dur-fast) var(--ease-out)',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.icon && <span style={{ display: 'inline-flex', width: 15, height: 15, opacity: locked ? 0.6 : 1 }}>{opt.icon}</span>}
            {opt.label}
            {locked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.7 }}>
                <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            )}
            {opt.badge != null && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 'var(--label-xs)', color: 'var(--text-tertiary)',
                background: 'var(--bg-inset)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xs)', padding: '0 5px', lineHeight: '15px',
              }}>{opt.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
