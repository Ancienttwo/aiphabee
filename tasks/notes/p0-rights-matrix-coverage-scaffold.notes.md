# P0 Rights Matrix Coverage Scaffold Notes

## Summary

Implemented the Sprint 3.3 §19.1 backend scaffold for P0 field/tool rights
matrix coverage across Web, MCP, export, and enterprise surfaces.

## Current State

- `@aiphabee/data-access-gateway` exposes P0 rights matrix coverage
  capabilities.
- `GET /gateway/runtime` includes nested `p0_rights_matrix_coverage` readiness.
- `GET /gateway/rights-matrix/p0/coverage` returns default-deny coverage for
  all 16 P0 Tool Registry tools and 9 core dataset/field groups.
- `core.p0_rights_matrix_entry` and
  `governance.p0_rights_matrix_contract` exist as empty schema scaffolds.
- Release gate status is `blocked_external_rights_matrix` until partner,
  commercial, and legal signoffs are present.

## Non-Goals

- No live partner rights matrix reads.
- No live entitlement writes.
- No signed external matrix evidence.
- No frontend operations UI.

## Verification

Passed on 2026-06-21:

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
