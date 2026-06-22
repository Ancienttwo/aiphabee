# Enterprise Controls Scaffold Notes

## Summary

Implemented the Phase 4 backend scaffold for Team/Enterprise controls: seats,
SSO, audit, and private data connectors.

## Current State

- `@aiphabee/account-runtime` exposes:
  - `getEnterpriseControlsCapabilities()`
  - `createEnterpriseControlsPlan()`
- `GET /account/runtime` includes `enterprise_controls`.
- Worker exposes `POST /account/enterprise-controls/plan` using the standard
  success envelope.
- A migration scaffold declares empty enterprise control-plane tables for seat
  assignments, SSO config, enterprise admin audit events, private connectors,
  and governance contract metadata.
- The local checker verifies enterprise-only plan codes, no-live/no-write
  invariants, security exclusions, source/test tokens, migration coverage,
  package scripts, and tracker sync.

## Non-Goals

- No live SSO provider calls.
- No directory sync.
- No private connector live test.
- No credential material storage.
- No DB writes.
- No SQL emission.
- No frontend enterprise admin UI.

## Verification

Run:

- `npm run check:enterprise-controls`
- `npm run check:database`
- `npx vitest run packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/account-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
