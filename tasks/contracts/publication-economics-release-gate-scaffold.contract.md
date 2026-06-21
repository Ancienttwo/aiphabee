# Publication Economics Release Gate Scaffold Contract

## Objective

Close the Sprint 3.3 backend/contract scaffold for: status page, help center, privacy, and terms publication readiness; positive unit economics under expected usage.

## Runtime Surface

- Package: `@aiphabee/public-ops`
- Capability: `publication_economics_release_gate`
- Route: `POST /public/release-gates/publication-economics/plan`
- Runtime exposure: `GET /public/runtime`
- Contract checker: `npm run check:publication-economics-release-gate`

## Required Checks

- `public_status_page_scaffold_published`
- `help_center_manifest_published`
- `privacy_and_terms_publication_ready`
- `package_pricing_catalog_present`
- `unit_economics_positive_for_expected_usage`
- `live_publication_and_finance_writes_blocked`

## Evidence

- Public status/docs evidence comes from `@aiphabee/public-ops`.
- Help center evidence comes from `@aiphabee/support-ops`.
- Pricing and package catalog evidence comes from `@aiphabee/account-runtime`.
- Unit economics follow PRD §15.5 contribution margin formula and use local synthetic expected-usage assumptions.

## Non-Goals

- No live status page deployment verification.
- No legal approval claim.
- No finance signoff claim.
- No live pricing provider reads or writes.
- No frontend release surface implementation.
