# Package Pricing Scaffold Notes

## Summary

Implemented the Sprint 3.2 backend scaffold for formal Pro and Developer
pricing and entitlement catalog exposure.

## Current State

- `@aiphabee/account-runtime` exposes package pricing capabilities.
- `GET /account/runtime` includes nested `package_pricing` readiness.
- `GET /account/package-pricing` returns a deterministic no-write catalog for
  Pro and Developer.
- Pro is represented as `HK$228/month` with full authorized 30-year history,
  comparison, screening, event study, deep report, all P0 tools, and a `5000`
  credit quota reference.
- Developer is represented as `HK$688+/month` with Pro Web entitlements,
  multiple MCP connections, API key access, bulk pagination, overage planning,
  and a `10000` credit quota reference.
- `core.plan_pricing_catalog`, `core.plan_entitlement_bundle`, and
  `governance.package_pricing_contract` exist as empty schema scaffolds.
- The local contract checker verifies price assumptions, quota linkage,
  overage boundaries, redistribution controls, no provider calls, no SQL, no
  writes, and database contract linkage.

## Non-Goals

- No final commercial quote.
- No live billing provider integration.
- No invoice, payment, or overage charge execution.
- No DB writes to pricing, entitlement, subscription, invoice, or ledger tables.
- No frontend pricing or billing UI.

## Verification

Passed:

- `npm run typecheck --workspace @aiphabee/account-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:package-pricing`
- `npm run check:database`
- `npx vitest run packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts`
