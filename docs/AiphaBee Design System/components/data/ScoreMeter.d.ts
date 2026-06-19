import React from 'react';

/**
 * The signature 0–100 signal gauge for sentiment & analysis scores.
 * @startingPoint section="Data" subtitle="0–100 score gauge" viewport="700x160"
 */
export interface ScoreMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current score. */
  value: number;
  /** Scale maximum (default 100). */
  max?: number;
  /** Caption shown on the left. */
  label?: React.ReactNode;
  /** Colour of the fill + number. */
  tone?: 'bullish' | 'cautious' | 'neutral' | 'bearish' | 'honey' | 'ai';
  /** End labels under the track, e.g. ["极度悲观","中性","极度乐观"]. */
  labels?: string[];
  /** Show the big number + "/ max". */
  showValue?: boolean;
}

/**
 * The signature 0–100 signal gauge for sentiment & analysis scores:
 * big number, coloured fill track, optional scale labels.
 *
 * @startingPoint section="Data" subtitle="0–100 score gauge" viewport="700x160"
 */
export function ScoreMeter(props: ScoreMeterProps): JSX.Element;
