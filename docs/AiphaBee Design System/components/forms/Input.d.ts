import React from 'react';

/**
 * Labelled text field with a honey focus ring and adornments.
 * @startingPoint section="Forms" subtitle="Text field" viewport="700x150"
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
  /** Field label rendered above the control. */
  label?: React.ReactNode;
  /** Leading icon node. */
  icon?: React.ReactNode;
  /** Inline prefix adornment, e.g. a currency code. */
  prefix?: React.ReactNode;
  /** Inline suffix adornment, e.g. a unit. */
  suffix?: React.ReactNode;
  /** Helper text below the field. */
  helper?: React.ReactNode;
  /** Error message — turns the field red and replaces helper text. */
  error?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Labelled text field with a honey focus ring and optional
 * icon / prefix / suffix adornments and error state.
 *
 * @startingPoint section="Forms" subtitle="Text field" viewport="700x150"
 */
export function Input(props: InputProps): JSX.Element;
