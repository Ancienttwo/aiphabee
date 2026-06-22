# HK Data Domains Cross-Market Scaffold Notes

## Summary

Implemented the Phase 4 backend scaffold for additional Hong Kong data domain
coverage and cross-market comparison planning.

## Current State

- `@aiphabee/market-domain-runtime` exposes:
  - `getMarketDomainRuntimeCapabilities()`
  - `getHkDataDomainsCrossMarketCapabilities()`
  - `createHkDataDomainsCrossMarketPlan()`
- Worker exposes:
  - `GET /market-data/domains/runtime`
  - `POST /market-data/domains/cross-market/plan`
- The planner covers expanded HK domains: IPO pipeline, index constituents,
  Stock Connect flow, short selling, ownership disclosure, warrants/CBBC,
  sector/industry classification, corporate calendar, and dividend calendar.
- The planner covers HK-based comparison planning against CN A-share, US, and
  SG markets.
- Cross-market mapping supports dual listing, ADR equivalence, Stock Connect
  eligibility, industry classification, currency normalization, trading
  calendar alignment, and corporate action alignment.
- Point-in-time methodology fields are required and tied back to PRD §10.2.
- Data Gateway, security resolution, market calendar, and analytics comparison
  routes are linked as downstream planning surfaces.
- A migration scaffold declares empty domain coverage, cross-market mapping,
  audit event, and governance contract tables.
- The local checker verifies no-live/no-write boundaries, default-deny rights,
  migration coverage, source/test tokens, package scripts, and tracker sync.

## Non-Goals

- No live partner data load.
- No live cross-market mapping lookup.
- No FX provider call.
- No export approval.
- No MCP redistribution approval.
- No raw partner payload storage.
- No DB writes.
- No SQL emission.
- No frontend UI.

## Verification

Run:

- `npm run check:hk-data-domains-cross-market`
- `npm run check:database`
- `npx vitest run packages/market-domain-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/market-domain-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
