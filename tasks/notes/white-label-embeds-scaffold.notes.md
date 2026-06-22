# White-Label Embeds Scaffold Notes

## Summary

Implemented the Phase 4 backend scaffold for B2B white-label partner programs,
embedded research components, MCP/API planning, and partner settlement linkage.

## Current State

- `@aiphabee/partner-runtime` exposes:
  - `getPartnerRuntimeCapabilities()`
  - `getWhiteLabelEmbedCapabilities()`
  - `createWhiteLabelEmbedPlan()`
- Worker exposes:
  - `GET /partner/runtime`
  - `POST /partner/white-label-embeds/plan`
- The planner supports brokerage, media, wealth platform, and data company
  partner types.
- The planner supports research widget, report viewer, watchlist widget, MCP
  API, and data API planning surfaces.
- Embedded component surfaces require a valid HTTPS origin allowlist.
- Data governance remains default-deny and requires field authorization,
  signed partner rights, and a partner rights matrix.
- Partner settlement is linked to the existing usage partner reconciliation
  planner.
- Data delivery is linked to the existing restricted export and Data Access
  Gateway planning surface.
- A migration scaffold declares empty partner program, embed surface,
  distribution audit event, and governance contract tables.
- The local checker verifies no-live/no-write invariants, security exclusions,
  migration coverage, source/test tokens, package scripts, and tracker sync.

## Non-Goals

- No frontend component work.
- No embed script bundle generation.
- No live widget rendering.
- No live API execution.
- No MCP tool execution.
- No external redistribution approval.
- No credential material storage.
- No DB writes.
- No SQL emission.

## Verification

Run:

- `npm run check:white-label-embeds`
- `npm run check:database`
- `npx vitest run packages/partner-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/partner-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
