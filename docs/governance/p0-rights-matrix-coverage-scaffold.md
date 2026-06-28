# P0 Rights Matrix Coverage Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 21:25 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/p0-rights-matrix-coverage-scaffold.contract.md`

This slice completes the backend-only Sprint 3.3 §19.1 scaffold for P0
field/tool rights matrix coverage. It proves every P0 tool and core dataset
field group has Web, MCP, export, and enterprise authorization slots under
default deny without loading a signed partner matrix or enabling live reads.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/data-access-gateway` | Owns rights coverage and default-deny release gate reporting |
| Tool source | `@aiphabee/tool-registry` | Worker passes the 16 registered P0 tools into the coverage report |
| Runtime route | `GET /gateway/runtime` | Reports nested `p0_rights_matrix_coverage` readiness |
| Coverage route | `GET /gateway/rights-matrix/p0/coverage` | Returns P0 tool/dataset/surface default-deny coverage |
| Contract | `deploy/gateway/p0-rights-matrix-coverage.contract.json` | Guards P0 tool count, four authorization surfaces, release gate, no live reads, no writes, and no SQL |
| Schema scaffold | `aiphabee_core.p0_rights_matrix_entry`, `aiphabee_governance.p0_rights_matrix_contract` | Empty future coverage/governance tables |
| External dependency | Partner/commercial/legal signoff | Explicitly absent; release gate remains blocked |

## P2 Concrete Trace

1. Worker receives `GET /gateway/rights-matrix/p0/coverage`.
2. Worker reads `REGISTERED_TOOLS` from `@aiphabee/tool-registry` and passes
   the 16 tool names to `createP0RightsMatrixCoverageReport()`.
3. Gateway builds default-deny coverage rows for each P0 tool.
4. Gateway also emits dataset/field-group rows for security master, market
   calendar, quotes, prices, corporate actions, financial facts,
   announcements, derived analytics, and evidence lineage.
5. Each row includes Web, MCP, export, and enterprise surface slots.
6. Release gate remains `blocked_external_rights_matrix` until partner,
   commercial, and legal signoffs are present.

## P3 Design Decision

Selected a coverage/report scaffold instead of pretending the partner rights
matrix is signed.

Reason:

- PRD §19.1 requires P0 field/tool matrix coverage and separate Web/MCP/export
  and enterprise authorization.
- Existing repo truth still says external rights matrix and legal/commercial
  signoff are absent.
- Default deny must remain the invariant until signed rights are available.

Tradeoff:

- The release checklist can now prove coverage slots and missing signoffs.
- Real partner matrix ingestion, live entitlement rows, and final signoff remain
  future slices.

## Verification

Passed checks on 2026-06-21:

- `npm run check:p0-rights-matrix-coverage`
- `npm run check:database`
- `npx vitest run packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/data-access-gateway`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/data-access-gateway`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`
- `git diff --name-only -- apps/web`

Root check caveat:

- `npm run check` passes through `check:p0-rights-matrix-coverage`,
  `check:secrets`, and all backend package builds, then fails only at
  `@aiphabee/web` Vite config loading because the current Node runtime does not
  expose `node:module.registerHooks` required by `@cloudflare/vite-plugin`.
  Frontend work remains delegated and this slice did not modify `apps/web`.
