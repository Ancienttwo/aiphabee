import React from 'react';

/**
 * AiphaBee ComparePanel — head-to-head "PK" view presided over by the
 * compare worker-bee. Weighs two candidates metric-by-metric, highlights
 * the winning cell, and delivers the bee's verdict in a navy footer.
 * @startingPoint section="Mascot" subtitle="Head-to-head PK / compare view" viewport="760x460"
 */

export interface CompareSide {
  /** Candidate name (e.g. company). */
  name: React.ReactNode;
  /** Ticker / code, mono-styled. */
  ticker?: React.ReactNode;
  /** Hexagon accent dot color (CSS color or token). */
  color?: string;
}

export interface CompareMetric {
  /** Row label (e.g. "超额认购"). */
  label: React.ReactNode;
  /** Left candidate's value (string or node — e.g. a Badge/pill). */
  left: React.ReactNode;
  /** Right candidate's value. */
  right: React.ReactNode;
  /** Which side wins this row — highlights that cell honey-green. */
  winner?: 'left' | 'right' | null;
}

export interface ComparePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Mascot pose filename (without extension) under basePath. */
  pose?: 'compare';
  /** Folder holding the mascot PNGs, relative to the page. */
  basePath?: string;
  /** Explicit image URL — overrides pose/basePath. */
  src?: string;
  /** Uppercase eyebrow above the title. */
  eyebrow?: React.ReactNode;
  /** Header title. */
  title?: React.ReactNode;
  /** Optional header subtitle. */
  subtitle?: React.ReactNode;
  /** Left candidate. */
  left?: CompareSide;
  /** Right candidate. */
  right?: CompareSide;
  /** Rows weighed across both candidates. */
  metrics?: CompareMetric[];
  /** The bee's conclusion, shown in the navy footer. */
  verdict?: React.ReactNode;
  /** Hero mascot width in px (default 120 — keep Hero-scale). */
  mascotSize?: number;
}

export function ComparePanel(props: ComparePanelProps): JSX.Element;
