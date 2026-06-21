# Static Report Metadata Scaffold

> **Status**: Verified local scaffold
> **Tracker**: Sprint 3.2 / RES-04
> **Runtime**: `@aiphabee/research-runtime`
> **Route**: `POST /research/reports/static/plan`

This slice creates the backend contract for static reports that are allowed
within current rights boundaries. It does not generate files, write R2 objects,
or expose a frontend surface.

## Boundary

| Area | Owner | Notes |
|---|---|---|
| Static report planner | `packages/research-runtime` | Builds metadata-complete no-write artifact plans |
| Worker route | `apps/worker` | Wraps the plan in the shared response envelope |
| Contract gate | `deploy/research/static-report.contract.json` | Locks metadata, status, scope, no-write, and DB table requirements |
| Database scaffold | `supabase/migrations/20260621125000_static_report_scaffold.sql` | Empty report artifact, audit, and governance tables |
| Frontend | Out of scope | User delegated frontend work to Claude |

## Trace

1. Caller submits source run, workspace, scope, format, report metadata, and
   optional sections to `POST /research/reports/static/plan`.
2. Worker normalizes snake/camel inputs and calls `createStaticReportPlan()`.
3. Planner requires `exports.read`, source run context, workspace context,
   supported static format, and complete metadata.
4. Plan includes generated time, data delay, data version, methodology version,
   rights policy version, and disclaimer.
5. Plan returns artifact placeholders only: no public URL, no R2 write, no DB
   write, no model call, and no live tool execution.

## Invariants

- Static reports must carry `generated_at`, `data_delay_minutes`,
  `data_version`, `methodology_version`, `rights_policy_version`, and
  `disclaimer`.
- Reports are allowed-scope only and require `exports.read`.
- Raw partner data is not embedded by this scaffold.
- Artifact writes, persistent writes, live data access, model calls, and
  frontend rendering remain disabled.

## Verification

- `npm run typecheck --workspace @aiphabee/research-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:static-report`
- `npm run check:database`
- `npx vitest run packages/research-runtime/src/index.test.ts apps/worker/src/index.test.ts`

## Residual Risk

- No real static report file is generated.
- No artifact is persisted to R2 or the database.
- Rights policy approval remains represented as contract metadata, not a live
  partner entitlement check.
- Frontend viewing and download controls remain delegated.
