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
 * Formats a wire HKEX instrument code for display, following the market's
 * minimum-4-digit main-board convention: codes below 10000 drop the leading
 * zero down to 4 digits ("00700" -> "0700", "00001" -> "0001"); codes at or
 * above 10000 (derivative warrant/CBBC codes, e.g. "14662") are already >= 4
 * digits and render unchanged. Presentation-only -- entity ids and every
 * promoted payload.code/symbol field stay 5-digit; only the rendered string
 * changes. Non-numeric input (should not occur for a wire code) passes
 * through unchanged rather than producing "0NaN".
 */
export function formatHkCode(code: string | number): string {
  const raw = String(code).trim();
  if (!/^\d+$/u.test(raw)) return raw;
  return String(Number.parseInt(raw, 10)).padStart(4, "0");
}

/**
 * Formats a wire "<5-digit-code>.HK" symbol (e.g. "00700.HK" -> "0700.HK")
 * by applying {@link formatHkCode} to the code segment and preserving the
 * suffix as-is.
 */
export function formatHkSymbol(symbol: string): string {
  const dotIndex = symbol.indexOf(".");
  if (dotIndex === -1) return formatHkCode(symbol);
  return formatHkCode(symbol.slice(0, dotIndex)) + symbol.slice(dotIndex);
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
