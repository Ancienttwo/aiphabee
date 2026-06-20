# Notes: field-entitlement-enforcement-scaffold

> **Last Updated**: 2026-06-20 16:27 +08
> **Plan**: `plans/plan-field-entitlement-enforcement-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/field-entitlement-enforcement-scaffold.md`

## Decisions

- Added deterministic entitlement checks to the Gateway package without reading
  a live database policy source.
- Kept live `/gateway/access-check` default-deny because partner rights matrix
  and entitlement rows are not approved or loaded.
- Added workspace and export to cache key dimensions to prevent cross-workspace
  or export-mode cache reuse.
- Used synthetic workspace policy tests to prove allow/redaction/export/time
  behavior without committing real market data.

## Verification

- Passed: `npm run check:data-gateway`
- Passed: `npm run test`
- Passed: `npm run typecheck`
- Passed: `npm run check`
- Passed: Wrangler smoke for `GET /gateway/runtime`
- Passed: Wrangler smoke for `POST /gateway/access-check`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Partner-signed field rights matrix is absent.
- Live database policy source is not wired.
- Serving Store schema exists, but real Gateway reads are absent.
- Usage ledger live writes are not wired.
