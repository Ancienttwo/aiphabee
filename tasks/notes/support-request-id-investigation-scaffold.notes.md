# Support Request Id Investigation Scaffold Notes

## Summary

Implemented the Sprint 3.2 backend scaffold for help center topics and
request_id-based support investigation planning.

## Current State

- `@aiphabee/support-ops` exposes support operations capabilities.
- `GET /support/runtime` reports support runtime readiness.
- `GET /support/help-center` returns six help topics and the escalation path to
  request id investigation.
- `POST /support/request-id-investigation/plan` returns a deterministic
  metadata-only investigation plan for a target `request_id`.
- Sensitive content requests are blocked by default.
- `docs/public/help-center.md` exists as a local help center publication draft.
- `core.support_ticket`, `audit.support_investigation_event`, and
  `governance.support_request_id_contract` exist as empty schema scaffolds.
- The local contract checker verifies help topics, allowed lookup fields,
  forbidden sensitive fields, planned sources, required help center sections,
  no live log reads, no live billing provider reads, no SQL, no writes, and
  database contract linkage.

## Non-Goals

- No frontend help center.
- No live chat.
- No ticket persistence.
- No live log reads.
- No live billing provider reads.
- No sensitive content release workflow.

## Verification

Passed:

- `npm run typecheck --workspace @aiphabee/support-ops`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:support-ops`
- `npm run check:database`
- `npx vitest run packages/support-ops/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run build --workspace @aiphabee/support-ops`
- `npm run build --workspace @aiphabee/worker`
