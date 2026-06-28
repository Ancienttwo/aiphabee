# Security History Scaffold

> **Status**: Verified no-live point-in-time security history scaffold
> **Last Updated**: 2026-06-21 19:18 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/security-history-scaffold.contract.md`

This slice closes the Sprint 3.1 SEC-05 backend gap for historical
constituents, historical industry, and historical security names. It adds a
no-live point-in-time history route that requires `as_of` and refuses to fall
back to current classifications, names, or constituent sets.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Security package | `@aiphabee/security-tools` | Owns synthetic historical name, industry, and index-constituent history |
| Route | `POST /tools/get-security-history` | Returns point-in-time history through the standard response envelope |
| Contract gate | `deploy/tools/security-history.contract.json` | Locks `as_of` requirement, history fields, and no-latest fallback policy |
| Schema scaffold | `aiphabee_core.security_name_history`, `aiphabee_core.security_industry_history`, `aiphabee_core.index_constituent_history`, `aiphabee_governance.security_history_contract` | Empty future-live scaffolds only; current route does not read or write DB rows |
| Frontend / MCP | Out of scope | No Web UI and no MCP registration in this slice |

## P2 Concrete Trace

1. Caller sends `POST /tools/get-security-history` with `instrument_id` and
   `as_of`.
2. Worker normalizes snake/camel fields and calls `getSecurityHistory()`.
3. `security-tools` validates `instrument_id` and requires `as_of`.
4. The package finds effective historical name, industry, and constituent
   membership records using `validFrom <= as_of <= validTo`.
5. Missing `as_of` returns `POINT_IN_TIME_UNAVAILABLE`; unknown instrument
   returns `NOT_FOUND`.
6. Successful responses include `pointInTimePolicy` with
   `usesLatestName=false`, `usesLatestClassification=false`, and
   `usesLatestConstituents=false`.

## P3 Design Decision

Selected a separate security-history route instead of changing
`get_security_profile`.

Reason:

- Current profile remains a simple current-profile scaffold used by existing
  workbench and analytics surfaces.
- SEC-05 specifically needs point-in-time behavior and an explicit `as_of`
  contract.
- The first acceptance risk is silently using today's industry or index
  constituents during historical screening or backtests.

Tradeoff:

- Backend can now prove the historical identity surface and no-latest fallback
  invariant.
- Live partner history rows, MCP exposure, and frontend history UI remain
  absent.

## Verification

Expected checks for this slice:

- `npm run typecheck --workspace @aiphabee/security-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run test -- packages/security-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:security-history`
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

- Live partner history rows remain absent.
- MCP registration remains absent.
- Frontend history display remains delegated.
