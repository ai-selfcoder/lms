import React from 'react';

export interface ProgressBarProps {
  value?: number;
  max?: number;
  tone?: 'accent' | 'success' | 'warning' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  /** Custom label text, e.g. "12/32". Falls back to percentage. */
  label?: string;
  style?: React.CSSProperties;
}

/**
 * Determinate progress track.
 * @dsCard group="Components"
 */
export function ProgressBar(props: ProgressBarProps): JSX.Element;
export default ProgressBar;
