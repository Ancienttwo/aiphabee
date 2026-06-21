/**
 * Numeric / financial formatting helpers. Numbers are rendered in the mono,
 * tabular face per the design system; these centralize the formatting the UI
 * kit previously inlined.
 */

export function formatHKD(value: number): string {
  return `HK$${value.toFixed(2)}`;
}

export function formatMultiple(value: number): string {
  return `${value}×`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatScore(value: number, max = 100): string {
  return `${value} / ${max}`;
}

/** UI-kit listings render the date without the year suffix. */
export function formatListingDate(listing: string): string {
  return listing.replace(", 2026", "");
}

/**
 * Oversubscription demand colour: hot (>=50x) green, cold (<5x) muted,
 * otherwise default ink. Mirrors the UI kit's inline logic.
 */
export function demandColor(sub: number): string {
  if (sub >= 50) return "var(--green-600)";
  if (sub < 5) return "var(--neutral-500)";
  return "var(--text-primary)";
}
