import React from 'react';

/** Card — flat elevated surface with hairline border. */
export function Card({ children, interactive = false, padding = 20, as = 'div', style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const Tag = as;
  return (
    <Tag
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      style={{
        background: 'var(--bg-elevated)',
        border: `var(--border-width) solid ${hover ? 'var(--border-strong)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: typeof padding === 'number' ? `${padding}px` : padding,
        transition: 'border-color var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out), background var(--dur-base)',
        transform: interactive && hover ? 'translateY(-2px)' : 'translateY(0)',
        cursor: interactive ? 'pointer' : 'default',
        boxShadow: interactive && hover ? 'var(--shadow-md)' : 'none',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Card;
