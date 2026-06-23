# Restricted Exports Scaffold

> **Status**: Verified no-live restricted export scaffold
> **Last Updated**: 2026-06-21 19:29 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/restricted-exports-scaffold.contract.md`

This slice closes the Sprint 3.1 ANA-08 backend gap for CSV, image, and PDF
exports. It plans exports only when the caller has the high-risk `exports.read`
scope, then delegates field authorization, row bounds, and time-range limits to
the Data Access Gateway. It does not generate files, write R2 objects, or render
frontend export UI.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Gateway package | `@aiphabee/data-access-gateway` | Owns restricted export planner and synthetic export policy |
| Runtime route | `GET /gateway/runtime` | Reports `restricted_exports` capability and no-live posture |
| Planner route | `POST /gateway/exports/plan` | Checks `exports.read`, evaluates `channel=export`, and returns a standard envelope plan |
| Schema scaffold | `aiphabee_core.restricted_export_request`, `aiphabee_audit.restricted_export_event`, `aiphabee_governance.restricted_export_contract` | Empty future-live scaffolds only; current route does not write |
| Contract gate | `deploy/gateway/restricted-exports.contract.json` | Locks formats, required scope, watermark fields, error codes, and DB tables |
| Frontend / R2 | Out of scope | No export UI and no artifact writes |

## P2 Concrete Trace

1. Caller sends `POST /gateway/exports/plan` with `dataset`, `fields`,
   `format`, `requested_rows`, `workspace_id`, and scopes.
2. Worker calls `createRestrictedExportPlan()` with request metadata.
3. Planner rejects missing `exports.read` before Gateway evaluation.
4. Planner calls `evaluateDataAccessRequest()` using `channel=export` and
   `exportRequested=true`.
5. Gateway applies field authorization, workspace/plan entitlement, row limit,
   time-range limit, and quality-state checks.
6. Successful plans return allowed fields, redacted fields, row policy, and a
   required watermark containing request/workspace/dataset/rights/as-of fields.

## P3 Design Decision

Selected a Gateway-owned no-write export planner.

Reason:

- ANA-08 is primarily a rights and distribution boundary, not a renderer.
- The existing Data Access Gateway already owns channel/field/time/row/export
  decisions.
- `exports.read` must stay separate from Web display and MCP/API rights.

Tradeoff:

- Backend can now prove export scope gating, field redaction, row limits, and
  watermark requirements.
- It cannot yet generate downloadable artifacts or persist audit rows.

## Verification

Expected checks for this slice:

- `npm run typecheck --workspace @aiphabee/data-access-gateway`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run test -- packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:restricted-exports`
- `npm run check:database`
- `npm run typecheck`
- `npm run test`
- `npm run check`
- `git diff --check`
- `git diff --name-only -- apps/web`
- `scripts/check-task-workflow.sh --strict`

Known local blocker:

- `npm run check` reaches `npm run build` after passing lint, typecheck, tests,
  golden regression, and contract checks, then fails only at delegated
  `@aiphabee/web` Vite build because Node v22.12.0 lacks
  `node:module.registerHooks`.

## Residual Gaps

- Live artifact generation and R2 writes remain absent.
- Persistent export audit writes remain absent.
- Frontend export controls remain delegated.
