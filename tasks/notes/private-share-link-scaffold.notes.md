# private-share-link-scaffold Notes

## Decision

Build private sharing as a no-write planner instead of a live link issuance
flow. The core invariant is that a share is not a new authorization path:
recipient entitlements are rechecked through the Data Access Gateway and the
released field list is the intersection of creator and recipient rights.

## Current Slice

- Added `@aiphabee/sharing-runtime`.
- Added `GET /sharing/runtime`.
- Added `POST /sharing/private-links/plan`.
- Added local contract `deploy/sharing/private-share-link.contract.json`.
- Added `npm run check:private-sharing`.
- Added empty DB scaffold tables:
  - `aiphabee_core.private_share_link`
  - `aiphabee_audit.private_share_event`
  - `aiphabee_governance.private_sharing_contract`

## Verification Focus

- Missing recipient scope blocks the plan.
- Invalid expiry blocks the plan.
- Recipient-only redaction does not count as data-right expansion.
- Link handle materialization, public indexing, artifact writes, persistent
  writes, frontend, SQL, and live data access remain disabled.

## Remaining Work

- Real private URL generation and revocation.
- Persisted audit events.
- Static report artifact generation.
- Frontend sharing controls delegated to Claude.
