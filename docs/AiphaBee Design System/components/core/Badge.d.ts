import React from 'react';

/**
 * Signal pill for sentiment, status, ratings and tags.
 * @startingPoint section="Core" subtitle="Sentiment & status pills" viewport="700x140"
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic tone — maps to the data-viz tokens. */
  tone?: 'honey' | 'navy' | 'neutral' | 'bullish' | 'bearish' | 'ai' | 'info' | 'warning';
  /** Fill style. */
  variant?: 'soft' | 'solid' | 'outline';
  size?: 'sm' | 'md';
  /** Show a leading status dot. */
  dot?: boolean;
  /** Status-dot shape — hexagon (brand default) or round. */
  dotShape?: 'hex' | 'round';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Signal pill used for sentiment (牛市/熊市), status, ratings and tags.
 * `soft` tinted fill by default.
 *
 * @startingPoint section="Core" subtitle="Sentiment & status pills" viewport="700x140"
 */
export function Badge(props: BadgeProps): JSX.Element;
