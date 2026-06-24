import type { ReactNode } from "react";
import { Icon } from "../../ds";
import { useEntitlement, type EntitlementTier } from "../../lib/context/EntitlementContext";

export interface LockedValueProps {
  children: ReactNode;
  /** Required tier to reveal the value. Default `premium`. */
  tier?: EntitlementTier;
  inline?: boolean;
}

/**
 * Renders its children when the account is entitled to `tier`; otherwise a lock
 * pill (default-deny). Clicking the pill unlocks the tier in the demo
 * entitlement context. Real entitlement will come from the account surface.
 */
export function LockedValue({ children, tier = "premium", inline }: LockedValueProps) {
  const { isEntitled, setPlan } = useEntitlement();
  if (isEntitled(tier)) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={() => setPlan(tier)}
      title={`${tier} 解锁`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        cursor: "pointer",
        padding: inline ? "1px 7px" : "3px 9px",
        borderRadius: "var(--radius-pill)",
        border: "1px dashed var(--violet-500)",
        background: "var(--violet-50)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-2xs)",
        fontWeight: 700,
        color: "var(--violet-600)",
        whiteSpace: "nowrap",
      }}
    >
      <Icon name="lock" size={11} color="var(--violet-600)" />{" "}
      {tier === "enterprise" ? "Enterprise" : "Premium"} 解锁
    </button>
  );
}
