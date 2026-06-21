# Notes: restricted-exports-scaffold

> **Last Updated**: 2026-06-21 19:29 +08
> **Runtime Evidence**:
> `docs/governance/restricted-exports-scaffold.md`

## Decisions

- Kept restricted export planning inside `@aiphabee/data-access-gateway`
  because export is a channel/field/rights distribution boundary.
- Required `exports.read` before invoking Gateway field evaluation.
- Reused `evaluateDataAccessRequest()` with `channel=export` and
  `exportRequested=true`, so row/time/quality/field guards stay consistent
  with the rest of the Gateway.
- Added empty schema scaffolds for future request and audit persistence while
  keeping this route no-write.

## Verification

- `npm run typecheck --workspace @aiphabee/data-access-gateway`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run test -- packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:restricted-exports`
- `npm run check:database`
- `npm run typecheck`
- `npm run test`
- `npm run check` -> passes lint/typecheck/tests/golden/contracts, reaches
  `npm run build`, then fails only at delegated `@aiphabee/web` Vite build
  because Node v22.12.0 lacks `node:module.registerHooks`
- `git diff --check`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Live artifact generation and R2 writes remain absent.
- Persistent export audit rows remain absent.
- Frontend export UI remains delegated.
