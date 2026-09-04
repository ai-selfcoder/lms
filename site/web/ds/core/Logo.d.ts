import React from 'react';

export interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  color?: string;
  mark?: string;
  style?: React.CSSProperties;
}

/**
 * The Goroutine wordmark + channel-arrow mark.
 * @dsCard group="Components"
 */
export function Logo(props: LogoProps): JSX.Element;
export default Logo;
