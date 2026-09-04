import React from 'react';

/**
 * Button — primary action control for the Goroutine system.
 * Hierarchies: accent (filled blue), primary (filled neutral/white-on-dark),
 * secondary (outlined), ghost (text), danger (destructive).
 */
export function Button({
  children,
  hierarchy = 'accent',
  size = 'md',
  iconLeft,
  iconRight,
  iconOnly = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  style,
  ...rest
}) {
  const sizes = {
    sm: { h: 32, px: 12, font: 'var(--label-md)', gap: 6, icon: 15, radius: 'var(--radius-sm)' },
    md: { h: 40, px: 16, font: 'var(--label-lg)', gap: 8, icon: 17, radius: 'var(--radius-md)' },
    lg: { h: 48, px: 22, font: 'var(--body-md)', gap: 8, icon: 19, radius: 'var(--radius-md)' },
  }[size];

  const palettes = {
    accent:    { bg: 'var(--accent)', fg: 'var(--accent-fg)', bd: 'transparent', bgHover: 'var(--accent-hover)', bgActive: 'var(--accent-pressed)' },
    primary:   { bg: 'var(--text-primary)', fg: 'var(--text-inverse)', bd: 'transparent', bgHover: '#ffffff', bgActive: 'var(--grey-200)' },
    secondary: { bg: 'transparent', fg: 'var(--text-primary)', bd: 'var(--border-strong)', bgHover: 'var(--bg-hover)', bgActive: 'var(--bg-active)' },
    ghost:     { bg: 'transparent', fg: 'var(--text-secondary)', bd: 'transparent', bgHover: 'var(--bg-hover)', bgActive: 'var(--bg-active)' },
    danger:    { bg: 'var(--error)', fg: '#1a0e10', bd: 'transparent', bgHover: 'var(--red-300)', bgActive: 'var(--red-500)' },
  }[hierarchy];

  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const isDisabled = disabled || loading;

  const bg = isDisabled ? (hierarchy === 'secondary' || hierarchy === 'ghost' ? 'transparent' : 'var(--grey-800)')
    : active ? palettes.bgActive : hover ? palettes.bgHover : palettes.bg;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: sizes.gap,
        height: sizes.h, minWidth: iconOnly ? sizes.h : undefined,
        padding: iconOnly ? 0 : `0 ${sizes.px}px`,
        width: fullWidth ? '100%' : undefined,
        font: undefined, fontFamily: 'var(--font-sans)', fontSize: sizes.font,
        fontWeight: 'var(--fw-medium)', letterSpacing: '-0.002em',
        color: isDisabled ? 'var(--text-disabled)' : palettes.fg,
        background: bg,
        border: `var(--border-width) solid ${isDisabled ? 'var(--border-default)' : palettes.bd}`,
        borderRadius: sizes.radius,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: `background var(--dur-fast) var(--ease-out), border-color var(--dur-fast), transform var(--dur-fast)`,
        transform: active && !isDisabled ? 'scale(0.98)' : 'scale(1)',
        whiteSpace: 'nowrap', userSelect: 'none', position: 'relative',
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span style={{
          width: sizes.icon, height: sizes.icon, borderRadius: '50%',
          border: '2px solid currentColor', borderTopColor: 'transparent',
          opacity: 0.9, animation: 'goro-spin 0.7s linear infinite', display: 'inline-block',
        }} />
      )}
      {!loading && iconLeft && <span style={{ display: 'inline-flex', width: sizes.icon, height: sizes.icon }}>{iconLeft}</span>}
      {!iconOnly && !loading && children}
      {!iconOnly && loading && (children ? <span style={{ opacity: 0.85 }}>{children}</span> : null)}
      {iconOnly && !loading && children}
      {!loading && iconRight && <span style={{ display: 'inline-flex', width: sizes.icon, height: sizes.icon }}>{iconRight}</span>}
      <style>{`@keyframes goro-spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}

export default Button;
