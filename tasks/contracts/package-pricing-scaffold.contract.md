# Package Pricing Scaffold Contract

## Objective

Complete the backend-only Sprint 3.2 scaffold for formal Pro and Developer
package pricing, entitlements, quota linkage, and overage boundaries from PRD
15.2.

## Required Surfaces

- Package: `@aiphabee/account-runtime`
- Runtime route: `GET /account/runtime`
- Catalog route: `GET /account/package-pricing`
- Contract: `deploy/account/package-pricing.contract.json`
- Checker: `npm run check:package-pricing`
- Schema scaffolds: `core.plan_pricing_catalog`,
  `core.plan_entitlement_bundle`, `governance.package_pricing_contract`

## Required Guarantees

- Use standard response envelopes.
- Support only Pro and Developer in this Sprint 3.2 slice.
- Preserve PRD 15.2 validation prices: Pro `HK$228/month`, Developer
  `HK$688+/month`.
- Mark prices as validation assumptions, not final quotes.
- Link usage quota to `deploy/usage/quota-display.contract.json` with Pro
  `5000` credits and Developer `10000` credits.
- Link Developer overage to usage billing reconciliation without calling a
  billing provider.
- Keep commercial external redistribution disabled.
- Require field authorization for export paths.
- Do not call a billing provider.
- Do not emit SQL.
- Do not write pricing, entitlement, subscription, invoice, or ledger rows.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes the package pricing tables.
- Package and Worker targeted tests pass.
- Account runtime and Worker typecheck pass.
- Sprint tracker row is checked and Sprint 3.2 count is updated.
