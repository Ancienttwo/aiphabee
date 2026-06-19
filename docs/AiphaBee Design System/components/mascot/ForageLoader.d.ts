import React from 'react';

/**
 * AiphaBee ForageLoader — diligent "foraging" loading state.
 * @startingPoint section="Mascot" subtitle="Foraging loader" viewport="700x140"
 */
export interface ForageLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Status label while foraging. */
  label?: React.ReactNode;
  /** Label shown once `done` — the "撒蜜收尾" completion frame. */
  doneLabel?: React.ReactNode;
  /** Completion tail frame: bee swaps to honey-finish, bar locks full. Hold briefly, then route on. */
  done?: boolean;
  /** Compact navy pill, or a centered full-panel block. */
  variant?: 'pill' | 'block';
  /** Folder holding the mascot PNGs. */
  basePath?: string;
  /** Explicit image URL — overrides basePath/forage.png. */
  src?: string;
}

export function ForageLoader(props: ForageLoaderProps): JSX.Element;
