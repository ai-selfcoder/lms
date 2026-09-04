import React from 'react';

export type BadgeVariant = 'status' | 'difficulty' | 'neutral' | 'count';
export type BadgeTone = 'pass' | 'fail' | 'timeout' | 'info' | 'neutral' | 'easy' | 'medium' | 'hard';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  tone?: BadgeTone;
  /** Force the leading status dot on/off. */
  dot?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Compact status / difficulty / meta pill.
 * @dsCard group="Components"
 */
export function Badge(props: BadgeProps): JSX.Element;
export default Badge;
