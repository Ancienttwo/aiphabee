import React from 'react';

/**
 * AiphaBee BeeNote — worker-bee AI insight block.
 * @startingPoint section="Mascot" subtitle="Worker-bee insight block" viewport="700x180"
 */
export interface BeeNoteProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Mascot pose filename (without extension) under basePath. */
  pose?: 'insight' | 'thinking' | 'success' | 'risk' | 'greeting' | 'forage' | 'empty' | 'avatar';
  /** Folder holding the mascot PNGs, relative to the page. */
  basePath?: string;
  /** Explicit image URL — overrides pose/basePath. */
  src?: string;
  /** Eyebrow title (a 🐝 is prefixed automatically). */
  title?: React.ReactNode;
  /** Light honey surface or dark navy surface. */
  tone?: 'honey' | 'navy';
  /** Hexagon mascot size in px. */
  mascotSize?: number;
  /** Optional action row under the body (e.g. a Button). */
  action?: React.ReactNode;
  /** The insight copy. */
  children?: React.ReactNode;
}

export function BeeNote(props: BeeNoteProps): JSX.Element;
