import React from 'react';

/**
 * TaskListItem — a single task row in the trainer's left navigator.
 * Shows index, title, difficulty dot, solved check, active state.
 * status: 'solved' | 'attempted' | 'todo'
 */
export function TaskListItem({ index, title, difficulty = 'medium', status = 'todo', active = false, type = 'functional', collapsed = false, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const diffColor = { easy: 'var(--diff-easy)', medium: 'var(--diff-medium)', hard: 'var(--diff-hard)' }[difficulty];

  const marker = status === 'solved'
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="var(--success)" opacity="0.16"/><path d="M7.5 12.5l3 3 6-6.5" stroke="var(--success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : status === 'attempted'
      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--warning)" strokeWidth="2" strokeDasharray="3 3"/></svg>
      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="var(--border-strong)" strokeWidth="1.5"/></svg>;

  if (collapsed) {
    return (
      <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} title={`${index}. ${title}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 'none',
          background: active ? 'var(--accent-subtle)' : hover ? 'var(--bg-hover)' : 'transparent',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer', position: 'relative', ...style }}>
        {marker}
        {active && <span style={{ position: 'absolute', left: -3, top: 8, bottom: 8, width: 2, background: 'var(--accent)', borderRadius: 2 }} />}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        padding: '8px 10px 8px 12px', border: 'none', position: 'relative',
        background: active ? 'var(--accent-subtle)' : hover ? 'var(--bg-hover)' : 'transparent',
        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
        transition: 'background var(--dur-fast)', ...style,
      }}
    >
      {active && <span style={{ position: 'absolute', left: 0, top: 7, bottom: 7, width: 2.5, background: 'var(--accent)', borderRadius: 2 }} />}
      <span style={{ flexShrink: 0, display: 'inline-flex' }}>{marker}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--label-sm)', color: 'var(--text-tertiary)', flexShrink: 0, width: 18 }}>{String(index).padStart(2, '0')}</span>
      <span style={{
        flex: 1, minWidth: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--label-md)',
        fontWeight: active ? 'var(--fw-medium)' : 'var(--fw-regular)',
        color: active ? 'var(--text-primary)' : status === 'solved' ? 'var(--text-secondary)' : 'var(--text-primary)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{title}</span>
      {type === 'review' && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--violet-400)" strokeWidth="2" title="Code review"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      )}
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: diffColor, flexShrink: 0 }} title={difficulty} />
    </button>
  );
}

export default TaskListItem;
