# Package Pricing Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 19:41 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **PRD Source**: `docs/researches/AiphaBee_PRD_v1.0.md` 15.2
> **Task Contract**: `tasks/contracts/package-pricing-scaffold.contract.md`

This slice completes the backend-only Sprint 3.2 scaffold for formal Pro and
Developer package pricing. It exposes PRD 15.2 validation prices and entitlement
boundaries without enabling live billing provider calls, persistent writes, SQL
emission, or frontend screens.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/account-runtime` | Owns plan catalog capability and deterministic pricing catalog |
| Runtime route | `GET /account/runtime` | Reports existing account capability plus nested `package_pricing` readiness |
| Catalog route | `GET /account/package-pricing` | Returns Pro and Developer prices, entitlements, quota linkage, overage policy, and redistribution controls |
| Usage linkage | `deploy/usage/quota-display.contract.json` | Remains the usage quota authority; package catalog references Pro `5000` and Developer `10000` credit limits |
| Billing linkage | `deploy/usage/billing-reconciliation.contract.json` | Developer overage is planned but no live provider call or invoice execution occurs |
| Contract | `deploy/account/package-pricing.contract.json` | Guards price assumptions, plan coverage, no frontend, no live prices, no billing provider, no writes, and no SQL |
| Schema scaffold | `aiphabee_core.plan_pricing_catalog`, `aiphabee_core.plan_entitlement_bundle`, `aiphabee_governance.package_pricing_contract` | Empty future persistence surfaces |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller requests `GET /account/package-pricing` with an optional
   `x-request-id`.
2. Worker calls `getPackagePricingCatalog()` from `@aiphabee/account-runtime`.
3. The catalog returns Pro `HK$228/month` and Developer `HK$688+/month` from
   PRD 15.2 as `validation_assumption_not_final_quote`.
4. Each plan binds Web entitlements, MCP entitlements, quota contract linkage,
   overage status, and redistribution controls.
5. Worker wraps the catalog in the shared standard success envelope with zero
   credits and two catalog rows.

## P3 Design Decision

Selected a no-write catalog route and contract instead of integrating live
billing or moving quota logic out of usage-ledger.

Reason:

- PRD 15.2 asks to formalize Pro and Developer pricing while explicitly noting
  prices are validation assumptions before authorization cost review and target
  market interviews.
- Existing account runtime already owns plan codes and subscription lifecycle
  boundaries.
- Existing usage-ledger already owns credit quota display and billing
  reconciliation surfaces.

Tradeoff:

- The product-facing package assumptions are now stable and testable.
- Final pricing, payment execution, overage charging, and frontend billing UI
  remain separate later slices.

## Verification

Passed:

- `npm run typecheck --workspace @aiphabee/account-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:package-pricing`
- `npm run check:database`
- `npx vitest run packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts`

Observed catalog invariants:

```json
{
  "package_pricing": {
    "billing_provider_calls": false,
    "currency": "HKD",
    "live_prices": false,
    "route": "GET /account/package-pricing",
    "status": "package_pricing_scaffold"
  },
  "plans": [
    {
      "plan_code": "pro",
      "display_price": "HK$228",
      "credit_limit": 5000,
      "overage_enabled": false
    },
    {
      "plan_code": "developer",
      "display_price": "HK$688+",
      "credit_limit": 10000,
      "overage_enabled": true
    }
  ]
}
```

## Residual Gaps

- Final commercial prices are not approved.
- Live billing provider integration is absent.
- Overage charge execution is absent.
- Pricing and entitlement rows are not written by runtime code.
- Frontend pricing and billing UI is absent by delegation.
