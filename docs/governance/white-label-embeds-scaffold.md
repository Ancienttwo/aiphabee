# White-Label Embeds Scaffold

Status: local contract complete

This slice closes the Phase 4 B2B white-label and embedded component backlog
item as a backend-only partner-runtime planner.

## Scope

- Package: `@aiphabee/partner-runtime`
- Runtime capability: `GET /partner/runtime`
- Route: `POST /partner/white-label-embeds/plan`
- Contract: `deploy/partner/white-label-embeds.contract.json`
- Migration scaffold: `deploy/database/migrations/20260622008000_partner_white_label_embed_scaffold.sql`
- Gate: `npm run check:white-label-embeds`

## Invariants

- Supported partners are brokerage, media, wealth platform, and data company
  programs.
- Supported distribution surfaces are research widget, report viewer, watchlist
  widget, MCP API, and data API planning.
- Embedded surfaces require an HTTPS origin allowlist and CSP.
- Field authorization and a partner rights matrix are required before any
  external distribution claim can move out of default-deny.
- Partner settlement is routed through `POST /usage/partner-reconciliation/plan`.
- Data delivery planning is routed through `POST /gateway/exports/plan`.
- MCP planning links to the existing MCP endpoint, OAuth, and key lifecycle
  planners without executing tools live.
- Credential material, personal contact payloads, and raw prompts are never
  stored or returned by the planner.
- The scaffold does not generate embed bundles, render frontend widgets, call
  live APIs, write persistent state, emit SQL, or broaden redistribution rights.

## Verification

Run:

```sh
npm run check:white-label-embeds
npx vitest run packages/partner-runtime/src/index.test.ts apps/worker/src/index.test.ts
```
