import React from 'react';

/**
 * Dashboard quick-stat tile.
 * @startingPoint section="Data" subtitle="Dashboard KPI tile" viewport="700x160"
 */
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Caption above the value. */
  label: React.ReactNode;
  /** The headline number / value. */
  value: React.ReactNode;
  /** Icon node shown in the tinted chip. */
  icon?: React.ReactNode;
  /** Icon-chip tint. */
  tone?: 'honey' | 'navy' | 'green' | 'violet' | 'blue' | 'red';
  /** Optional change indicator, e.g. "+12.4%". */
  delta?: React.ReactNode;
  deltaDirection?: 'up' | 'down' | 'flat';
}

/**
 * Dashboard quick-stat tile: big tabular number, caption, tinted
 * icon chip and an optional delta.
 *
 * @startingPoint section="Data" subtitle="Dashboard KPI tile" viewport="700x160"
 */
export function StatCard(props: StatCardProps): JSX.Element;
