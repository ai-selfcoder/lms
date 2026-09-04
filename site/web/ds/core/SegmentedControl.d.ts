import React from 'react';

export interface SegmentOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  /** Renders a lock glyph and disables the segment (e.g. gated "Решение" tab). */
  locked?: boolean;
  /** Small mono count chip. */
  badge?: string | number;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  style?: React.CSSProperties;
}

/**
 * Tab-like segmented switch (trainer right panel, view toggles).
 * @dsCard group="Components"
 */
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
export default SegmentedControl;
