import React from 'react';

/**
 * Logo — the GraphLMS wordmark. The mark is a small graph glyph: three nodes
 * connected by edges, white on the accent rounded-square tile.
 */
export function Logo({ size = 22, showWordmark = true, color = 'var(--text-primary)', mark = 'var(--accent)', style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, ...style }}>
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill={mark} />
        <path d="M8.5 9.5 14 14m0 0 5.5-4.5M14 14v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="8.5" cy="9.5" r="2" fill="#fff"/>
        <circle cx="19.5" cy="9.5" r="2" fill="#fff"/>
        <circle cx="14" cy="19" r="2" fill="#fff"/>
      </svg>
      {showWordmark && (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: size * 0.82, fontWeight: 'var(--fw-semibold)', letterSpacing: '-0.02em', color }}>
          Graph<span style={{ color: mark }}>LMS</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
