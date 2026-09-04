import React from 'react';

/** Kbd — keyboard shortcut chip. Pass keys as children, e.g. "⌘" "↵". */
export function Kbd({ children, style }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 20, height: 20, padding: '0 5px',
      fontFamily: 'var(--font-mono)', fontSize: 'var(--label-xs)', fontWeight: 'var(--fw-medium)',
      color: 'var(--text-secondary)', background: 'var(--bg-inset)',
      border: '1px solid var(--border-strong)', borderBottomWidth: 2,
      borderRadius: 'var(--radius-xs)', lineHeight: 1, ...style,
    }}>{children}</kbd>
  );
}

export default Kbd;
