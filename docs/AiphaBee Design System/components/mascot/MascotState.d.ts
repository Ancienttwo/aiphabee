import React from 'react';

/**
 * AiphaBee MascotState — full mascot for empty / success / error / onboarding.
 * @startingPoint section="Mascot" subtitle="Empty / success / onboarding state" viewport="700x340"
 */
export interface MascotStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which mascot pose to show. */
  pose?: 'empty' | 'success' | 'risk' | 'thinking' | 'greeting' | 'forage' | 'insight' | 'compare' | 'honey-finish';
  /** Folder holding the mascot PNGs. */
  basePath?: string;
  /** Explicit image URL — overrides pose/basePath. */
  src?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Mascot size in px. */
  size?: number;
  /** Show the faint honeycomb backdrop behind the bee. */
  comb?: boolean;
  /** Optional action (e.g. a Button). */
  children?: React.ReactNode;
}

export function MascotState(props: MascotStateProps): JSX.Element;
