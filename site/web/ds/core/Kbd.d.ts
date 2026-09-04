import React from 'react';

export interface KbdProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Keyboard shortcut chip.
 * @dsCard group="Components"
 */
export function Kbd(props: KbdProps): JSX.Element;
export default Kbd;
