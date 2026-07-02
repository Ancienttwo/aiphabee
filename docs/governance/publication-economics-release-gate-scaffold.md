# Publication Economics Release Gate Scaffold

This scaffold covers the Sprint 3.3 release gate item for public status/help/privacy/terms publication plus positive expected-usage unit economics.

## Scope

- Runtime package: `@aiphabee/public-ops`
- Runtime route: `GET /public/runtime`
- Gate route: `POST /public/release-gates/publication-economics/plan`
- Linked evidence routes: `GET /public/status`, `GET /public/docs`, `GET /support/help-center`, `GET /account/package-pricing`
- Contract: `deploy/public-ops/publication-economics-release-gate.contract.json`
- Migration: `deploy/database/migrations/20260622004000_publication_economics_release_gate_scaffold.sql`
- Checker: `npm run check:publication-economics-release-gate`

## What This Proves

- Public status page scaffold exposes request-id-visible components including public documentation.
- Public docs manifest includes API, MCP, privacy, and terms local publication drafts.
- Help center manifest includes the support topics needed for account/billing, MCP, data quality, usage quota, privacy/account, and incident status.
- Pricing catalog exposes Pro and Developer validation prices and package entitlements.
- Synthetic expected-usage unit economics are positive against PRD §15.5 targets: Pro margin at or above 70%, Developer/MCP margin at or above 60%.
- Live deployment, legal approval, finance signoff, pricing provider calls, SQL, and persistent writes remain disabled.

## Deliberate Blockers

- `live_public_status_page_deployment_missing`
- `live_help_center_deployment_missing`
- `final_privacy_terms_legal_approval_missing`
- `live_pricing_provider_missing`
- `finance_unit_economics_signoff_missing`
- `frontend_public_release_surface_missing`
