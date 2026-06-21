# Notes: security-history-scaffold

> **Last Updated**: 2026-06-21 19:18 +08
> **Runtime Evidence**:
> `docs/governance/security-history-scaffold.md`

## Decisions

- Kept SEC-05 inside `@aiphabee/security-tools` because security identity,
  company names, industries, listing state, and ambiguity handling already live
  there.
- Added a separate `getSecurityHistory()` route instead of overloading
  `get_security_profile`, so current profile consumers keep their existing
  contract while historical workflows get a mandatory `as_of` boundary.
- Used synthetic point-in-time records to prove the invariant that historical
  screening must not silently use today's classification, name, or constituent
  set.
- Added empty schema scaffolds for future live rows while keeping this route
  no-read/no-write.

## Verification

- `npm run typecheck --workspace @aiphabee/security-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run test -- packages/security-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:security-history`
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

- Live partner historical names, industry classifications, and index
  constituent rows remain absent.
- MCP registration remains absent.
- Frontend history UI remains delegated.
