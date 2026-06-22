# Field Rights Live Policy Source Readiness

## Scope

This readiness gate closes DAT-05 for repo-local runtime acceptance by joining a partner rights matrix fixture with database entitlement row snapshots, compiling them into a Gateway policy, and running runtime field-cutting smoke scenarios.

## Boundary

- Partner matrix rows cover the PRD §14.1 dimensions as fixture metadata.
- DB policy rows use `core.data_entitlement`, `core.workspace_entitlement`, and `core.workspace_subscription` row snapshots.
- The compiled policy is evaluated through `evaluateDataAccessRequest()`.
- Runtime smoke covers workspace, plan, channel, dataset, field, time range, export, blocked precedence, and versioned cache key behavior.
- `/gateway/runtime` exposes `field_entitlement_enforcement.live_policy_source_readiness`.

## Disabled Surfaces

- Signed external partner rights matrix
- Live DB entitlement reads
- Live partner matrix reads
- SQL execution
- Persistent writes
- Frontend rights ops UI

## Verification

- `npm run check:field-rights-live-policy-source`
- `npm run check:traceability-matrix`
- `npx vitest run packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
