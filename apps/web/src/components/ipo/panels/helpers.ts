/**
 * Detail-workbench shared helpers, ported from the design prototype
 * (`docs/AiphaBee Design System/apps/ipo-workbench/{pipeline,data}.jsx`).
 */
import type { IpoTerms } from "../../../lib/api/ipo-types";

/** Offer price range / final, or the caller's localized pending label. */
export function offerText(t: IpoTerms, pending: string): string {
  if (t.finalPrice) return `HK$${t.finalPrice.toFixed(2)}`;
  if (t.priceLow && t.priceHigh)
    return `HK$${t.priceLow.toFixed(2)}–${t.priceHigh.toFixed(2)}`;
  return pending;
}

/** Demand-level colour from the oversubscription multiple (prototype tiers). */
export function demandTone(x: number | null): string {
  if (x == null) return "var(--neutral-400)";
  if (x >= 100) return "var(--demand-extreme)";
  if (x >= 50) return "var(--demand-very-hot)";
  if (x >= 10) return "var(--green-600)";
  if (x >= 5) return "var(--blue-500)";
  return "var(--neutral-500)";
}
