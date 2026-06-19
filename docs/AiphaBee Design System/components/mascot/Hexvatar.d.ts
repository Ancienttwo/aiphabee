import React from 'react';

/**
 * AiphaBee Hexvatar — honeycomb-hexagon avatar / icon chip.
 * @startingPoint section="Mascot" subtitle="Hexagon avatar & icon chip" viewport="700x140"
 */
export interface HexvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image URL (e.g. a mascot pose or user photo). */
  imgSrc?: string;
  alt?: string;
  /** Icon node instead of an image (e.g. a Lucide icon). */
  icon?: React.ReactNode;
  /** Pixel size of the hexagon. */
  size?: number;
  /** Colour tone for fill/border. */
  tone?: 'honey' | 'navy' | 'green' | 'violet' | 'red' | 'neutral';
  /** fill = solid, soft = tinted (default), outline = border only. */
  variant?: 'fill' | 'soft' | 'outline';
  /** Clip the image to the hexagon (use for photos, not transparent mascots). */
  clip?: boolean;
  children?: React.ReactNode;
}

export function Hexvatar(props: HexvatarProps): JSX.Element;
