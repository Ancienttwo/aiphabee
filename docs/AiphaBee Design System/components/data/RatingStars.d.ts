import React from 'react';

/**
 * Institution / quality rating on a 5-star scale.
 * @startingPoint section="Data" subtitle="5-star rating" viewport="700x120"
 */
export interface RatingStarsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rating value (0–count, fractional allowed). */
  value: number;
  /** Number of stars (default 5). */
  count?: number;
  /** Star glyph size in px. */
  size?: number;
  /** Show the numeric value beside the stars. */
  showValue?: boolean;
  /** Optional review/sample count shown in parentheses. */
  reviews?: number;
  /** Filled-star colour. */
  color?: string;
  /** Empty-star colour. */
  emptyColor?: string;
}

/**
 * Institution / quality rating on a 5-star scale with honey-filled
 * stars, fractional support, optional numeric value and count.
 *
 * @startingPoint section="Data" subtitle="5-star rating" viewport="700x120"
 */
export function RatingStars(props: RatingStarsProps): JSX.Element;
