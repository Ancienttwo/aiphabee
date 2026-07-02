# Enterprise Controls Scaffold

Status: local contract complete

This slice closes the Phase 4 Team/Enterprise backlog item for seats, SSO,
audit, and private data connectors as a backend-only account-runtime planner.

## Scope

- Package: `@aiphabee/account-runtime`
- Runtime capability: `GET /account/runtime`
- Route: `POST /account/enterprise-controls/plan`
- Contract: `deploy/account/enterprise-controls.contract.json`
- Migration scaffold: `deploy/database/migrations/20260622007000_enterprise_controls_scaffold.sql`
- Gate: `npm run check:enterprise-controls`

## Invariants

- Only `team` and `enterprise` plan codes can plan enterprise controls.
- Seat management, SSO metadata validation, audit export, and private connector
  setup are planned without live provider calls.
- Private data connectors require Data Gateway rights enforcement and remain
  default-deny until approved.
- Credential material, raw emails, and raw connection strings are never stored
  or returned by the planner.
- The scaffold does not sync directories, call identity providers, test private
  connectors, write persistent state, emit SQL, or render frontend UI.

## Verification

Run:

```sh
npm run check:enterprise-controls
npx vitest run packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts
```
