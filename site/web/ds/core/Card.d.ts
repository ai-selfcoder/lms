import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Adds hover lift + pointer; use for clickable cards. */
  interactive?: boolean;
  /** px or CSS string. Default 20. */
  padding?: number | string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Flat elevated surface with hairline border.
 * @dsCard group="Components"
 */
export function Card(props: CardProps): JSX.Element;
export default Card;
