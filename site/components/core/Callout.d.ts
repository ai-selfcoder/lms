import React from 'react';

export interface CalloutProps {
  tone?: 'note' | 'tip' | 'warning' | 'danger';
  /** Overrides the default localized title. */
  title?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Note / tip / warning / danger врезка for textbook prose.
 * @dsCard group="Components"
 */
export function Callout(props: CalloutProps): JSX.Element;
export default Callout;
