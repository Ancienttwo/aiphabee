# Task Contract: private-share-link-scaffold

> **Sprint**: 3.2
> **PRD Trace**: RES-03, §19.4
> **Capability ID**: sprint32-private-share-link

## Objective

Create a backend-only private sharing scaffold that can plan a private share
link while proving the share does not expand the recipient's data rights.

## Acceptance Evidence

- `@aiphabee/sharing-runtime` exposes:
  - `getPrivateSharingCapabilities()`
  - `createPrivateShareLinkPlan()`
- Worker exposes:
  - `GET /sharing/runtime`
  - `POST /sharing/private-links/plan`
- The plan requires creator and recipient `exports.read` scope.
- The plan rechecks recipient entitlement through the Data Access Gateway.
- The plan releases only the intersection of creator-allowed and
  recipient-allowed fields.
- The plan records redacted fields when the recipient lacks rights.
- The plan always reports:
  - `recipient_data_rights_expansion=false`
  - `share_expands_recipient_rights=false`
  - `link_handle_materialized=false`
  - `public_indexing=false`
  - `artifact_writes=false`
  - `persistent_writes=false`
  - `frontend=false`
- The contract checker validates:
  - route names;
  - required scope;
  - recipient entitlement recheck;
  - max expiry;
  - required watermark fields;
  - DB table coverage;
  - no secret-like values.

## Verification Commands

- `npm run typecheck --workspace @aiphabee/sharing-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:private-sharing`
- `npm run check:database`
- `npx vitest run packages/sharing-runtime/src/index.test.ts apps/worker/src/index.test.ts`

## Non-Goals

- No frontend share UI.
- No real link handle generation.
- No R2/static artifact writes.
- No persistent DB writes.
- No live partner data access.
