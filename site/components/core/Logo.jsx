import React from 'react';

/**
 * Logo — the Goroutine wordmark. The mark is two offset arrows forming a
 * "concurrent paths" glyph (channels), in the accent colour.
 */
export function Logo({ size = 22, showWordmark = true, color = 'var(--text-primary)', mark = 'var(--accent)', style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, ...style }}>
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill={mark} />
        <path d="M8 10.5h7.5a3.5 3.5 0 0 1 0 7H10l2.4-2.4M8 17.5h-.5" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="8" cy="10.5" r="1.4" fill="#fff"/>
      </svg>
      {showWordmark && (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: size * 0.82, fontWeight: 'var(--fw-semibold)', letterSpacing: '-0.02em', color }}>
          goroutine<span style={{ color: mark }}>.</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
