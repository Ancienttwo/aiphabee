import { createContext, useContext, useState, type ReactNode } from "react";

export type EntitlementPlan = "free" | "premium" | "enterprise";
export type EntitlementTier = "premium" | "enterprise";

interface EntitlementState {
  plan: EntitlementPlan;
  setPlan: (plan: EntitlementPlan) => void;
  /** True when the current plan authorizes the given sensitive-field tier. */
  isEntitled: (tier: EntitlementTier) => boolean;
}

/**
 * Field-authorization (default-deny) context, ported from the IPO workbench
 * prototype's `PlanCtx`. Sensitive vendor fields — cornerstone amounts
 * (enterprise), 頂頭槌 / per-tier applicant counts (premium) — render a locked
 * state via `LockedValue` until the plan authorizes them.
 *
 * FP1: `plan` is a local demo toggle defaulting to `free`. Real entitlement
 * will arrive from the account/billing surface + response envelope later; this
 * context is the single swap point so views never change.
 */
const EntitlementContext = createContext<EntitlementState>({
  plan: "free",
  setPlan: () => {},
  isEntitled: () => false,
});

export function EntitlementProvider({
  children,
  initialPlan = "free",
}: {
  children: ReactNode;
  initialPlan?: EntitlementPlan;
}) {
  const [plan, setPlan] = useState<EntitlementPlan>(initialPlan);
  const isEntitled = (tier: EntitlementTier): boolean =>
    tier === "enterprise" ? plan === "enterprise" : plan !== "free";
  return (
    <EntitlementContext.Provider value={{ plan, setPlan, isEntitled }}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlement(): EntitlementState {
  return useContext(EntitlementContext);
}
