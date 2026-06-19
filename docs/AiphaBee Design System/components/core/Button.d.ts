import React from 'react';

/**
 * Primary action control.
 * @startingPoint section="Core" subtitle="Honey + navy buttons" viewport="700x180"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'ai' | 'danger';
  /** Control height & padding. */
  size?: 'sm' | 'md' | 'lg';
  /** Leading icon node (e.g. a Lucide icon). */
  icon?: React.ReactNode;
  /** Trailing icon node. */
  iconRight?: React.ReactNode;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Primary action control. Honey-yellow fill for the main call to
 * action, navy `secondary`, and a violet `ai` variant for AI features.
 *
 * @startingPoint section="Core" subtitle="Honey + navy buttons" viewport="700x180"
 */
export function Button(props: ButtonProps): JSX.Element;
