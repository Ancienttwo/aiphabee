# Notes: authorized-session-memory-scaffold

> **Last Updated**: 2026-06-21 19:07 +08
> **Runtime Evidence**:
> `docs/governance/authorized-session-memory-scaffold.md`

## Decisions

- Kept authorized memory inside `@aiphabee/account-runtime` because it depends
  on account/workspace context and privacy/credential boundaries.
- Allowed only explicit preference/consent keys, not prompts, generated
  answers, financial values, or credentials.
- Added an empty schema scaffold for future persistence, while keeping the
  current route no-read/no-write.
- Treated `view`, `upsert`, and `delete` as user-visible control plans, not
  immediate database operations.

## Verification

- `npm run typecheck --workspace @aiphabee/account-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run test -- packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:authorized-session-memory`
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

- Live authorized-memory reads/writes remain absent.
- Frontend memory management controls remain delegated.
- Generated-answer memory extraction remains absent by design.
