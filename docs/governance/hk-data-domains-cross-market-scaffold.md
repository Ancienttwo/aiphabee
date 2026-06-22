# HK Data Domains Cross-Market Scaffold

Status: local contract complete

This slice closes the Phase 4 backlog item for additional Hong Kong data
domains and cross-market comparison as a backend-only coverage planner.

## Scope

- Package: `@aiphabee/market-domain-runtime`
- Runtime capability: `GET /market-data/domains/runtime`
- Plan route: `POST /market-data/domains/cross-market/plan`
- Contract: `deploy/market-data/hk-data-domains-cross-market.contract.json`
- Migration scaffold: `supabase/migrations/20260622009000_hk_data_domains_cross_market_scaffold.sql`
- Gate: `npm run check:hk-data-domains-cross-market`

## Invariants

- Expanded HK data domains are planned as coverage metadata, not live market
  data reads.
- Cross-market mapping is HK-based and covers CN A-share, US, and SG comparison
  planning.
- Point-in-time fields are required for every covered domain.
- Data Gateway, security resolution, market calendar, and analytics comparison
  routes are linked, but not executed live by this planner.
- Field authorization and a rights matrix are required before any export,
  MCP redistribution, or external redistribution claim can move out of
  default-deny.
- Raw partner payloads are not stored or returned.
- The scaffold does not load live partner data, emit SQL, write persistent
  state, approve redistribution, or render frontend UI.

## Verification

Run:

```sh
npm run check:hk-data-domains-cross-market
npx vitest run packages/market-domain-runtime/src/index.test.ts apps/worker/src/index.test.ts
```
