import React from 'react';

export type ButtonHierarchy = 'accent' | 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. Default 'accent'. */
  hierarchy?: ButtonHierarchy;
  /** Default 'md'. */
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Square icon-only button; pass the icon as children. */
  iconOnly?: boolean;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Primary action control.
 * @dsCard group="Components"
 */
export function Button(props: ButtonProps): JSX.Element;
export default Button;
