# HK Data Domains Cross-Market Scaffold Contract

## Objective

Complete the Phase 4 backend-only scaffold for additional Hong Kong market data
domains and cross-market comparison planning without enabling live data access,
external redistribution, or frontend work.

## Required Surfaces

- Package: `@aiphabee/market-domain-runtime`
- Runtime route: `GET /market-data/domains/runtime`
- Plan route: `POST /market-data/domains/cross-market/plan`
- Contract: `deploy/market-data/hk-data-domains-cross-market.contract.json`
- Checker: `npm run check:hk-data-domains-cross-market`
- Migration scaffold: `deploy/database/migrations/20260622009000_hk_data_domains_cross_market_scaffold.sql`

## Required Guarantees

- Use standard response envelopes.
- Support additional HK domain planning for IPO pipeline, index constituents,
  Stock Connect flow, short selling, ownership disclosure, warrants/CBBC,
  sector/industry classification, corporate calendar, and dividend calendar.
- Support HK-to-CN A-share, HK-to-US, and HK-to-SG comparison planning.
- Support dual listing, ADR equivalence, Stock Connect eligibility, industry
  classification, currency normalization, trading calendar alignment, and
  corporate action alignment mapping types.
- Require point-in-time methodology fields.
- Require field authorization and a rights matrix before distribution claims.
- Preserve default-deny for export, MCP redistribution, and external
  redistribution.
- Link to Data Gateway exports, security resolution, market calendar, and
  analytics comparison routes without executing them live.
- Return blocked statuses for missing workspace context, missing rights matrix,
  unsupported domains, unsupported markets, and unsupported mappings.
- Do not load live partner data.
- Do not store raw partner payloads.
- Do not write DB rows.
- Do not emit SQL.
- Do not render frontend UI.

## Acceptance

- Contract checker passes.
- Database migration checker passes.
- Market Domain Runtime and Worker targeted tests pass.
- Market Domain Runtime and Worker typecheck pass.
- Sprint tracker row is checked.
