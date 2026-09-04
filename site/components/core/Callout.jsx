import React from 'react';

const TONES = {
  note:    { fg: 'var(--accent-text)',  bg: 'var(--info-bg)',    bd: 'var(--info-border)',    label: 'Заметка' },
  tip:     { fg: 'var(--success-fg)',   bg: 'var(--success-bg)', bd: 'var(--success-border)', label: 'Совет' },
  warning: { fg: 'var(--warning-fg)',   bg: 'var(--warning-bg)', bd: 'var(--warning-border)', label: 'Внимание' },
  danger:  { fg: 'var(--error-fg)',     bg: 'var(--error-bg)',   bd: 'var(--error-border)',   label: 'Грабли' },
};

function icon(tone) {
  const c = 'currentColor';
  if (tone === 'warning' || tone === 'danger')
    return <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  if (tone === 'tip')
    return <><path d="M9 18h6M10 22h4" stroke={c} strokeWidth="2" strokeLinecap="round"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" stroke={c} strokeWidth="2" fill="none"/></>;
  return <><circle cx="12" cy="12" r="9.5" stroke={c} strokeWidth="2" fill="none"/><path d="M12 11v6M12 7h.01" stroke={c} strokeWidth="2" strokeLinecap="round"/></>;
}

/** Callout — note / tip / warning / danger врезка for the textbook. */
export function Callout({ children, tone = 'note', title, style }) {
  const t = TONES[tone] || TONES.note;
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '14px 16px',
      background: t.bg, border: `var(--border-width) solid ${t.bd}`,
      borderRadius: 'var(--radius-md)', ...style,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" style={{ color: t.fg, flexShrink: 0, marginTop: 2 }}>{icon(tone)}</svg>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--label-md)', fontWeight: 'var(--fw-semibold)', color: t.fg, marginBottom: children ? 4 : 0, letterSpacing: '0.01em' }}>
          {title || t.label}
        </div>
        {children && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--body-md)', lineHeight: 'var(--body-md-lh)', color: 'var(--text-secondary)' }}>{children}</div>}
      </div>
    </div>
  );
}

export default Callout;
