# Event Study Scaffold

> **Status**: Verified no-live analytics scaffold
> **Last Updated**: 2026-06-21 18:43 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/event-study-scaffold.contract.md`

This slice adds a Sprint 3.1 no-live `run_event_study` scaffold for ANA-06 and
PRD §9.3. It computes deterministic event-window abnormal returns from static
price-history fixtures and surfaces missing samples explicitly. It does not
read live partner rows, write queues or usage ledger rows, execute SQL, or add
frontend UI.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Analytics package | `packages/analytics-tools` | Owns `runEventStudy()`, `getEventStudyCapabilities()`, deterministic event-window math, missing-sample reporting, and high-cost weight estimation |
| Source tools | `resolveSecurity()`, `getPriceHistory()` | Provide the security/benchmark identity and bounded total-return fixture rows used by the scaffold |
| Worker route | `POST /analytics/event-study` | Exposes standard envelope success responses and blocked-resolution/history errors without live execution |
| Runtime capability | `GET /analytics/runtime` | Reports event-study route, formula version, abnormal-return method, missing-sample policy, and no-live posture |
| High-cost queue planner | `POST /analytics/high-cost/plan` | Adds `run_event_study` to the independent `analytics_high_cost` pool with PRD 20-50 credit weighting and confirmation required |
| Contracts | `deploy/analytics/event-study.contract.json`, `deploy/analytics/high-cost-analytics-queue.contract.json` | Lock event date/window/benchmark/abnormal-return/missing-sample fields plus high-cost queue metadata |

## P2 Concrete Trace

1. Client sends `POST /analytics/event-study` with `security_query`,
   optional benchmark, event date, and event-window bounds.
2. Worker normalizes snake_case/camelCase inputs and calls `runEventStudy()`.
3. The analytics tool resolves the subject security and explicit benchmark, or
   uses a same-security benchmark proxy when no benchmark is supplied.
4. It retrieves bounded total-return price-history rows for the security and
   benchmark.
5. It builds the requested event-window calendar, calculates
   `security_return - benchmark_return`, and records missing dates instead of
   silently dropping them.
6. Worker wraps the result in the standard success envelope with source
   metadata.

Error trace:

1. Missing or unresolved subject security returns `blocked_resolution`.
2. Missing or unresolved explicit benchmark returns `blocked_resolution`.
3. Missing price-history rows return `blocked_history`.
4. Unsupported larger windows are clamped to the scaffold's bounded fixture
   limits and reported through `event_window`.

## P3 Design Decision

Selected a deterministic no-live scaffold inside `@aiphabee/analytics-tools`
instead of adding a separate runtime package.

Reason:

- PRD §9.3 event study depends on the same security resolution and
  price-history contracts as returns/risk analytics.
- Keeping the scaffold in the analytics package reuses existing source-record
  and fixture patterns.
- The highest-risk acceptance condition is missing sample handling, so the
  first slice proves explicit missing-window output before live data or UI.

Tradeoff:

- The implementation proves event date/window/benchmark/abnormal-return shape
  and high-cost queue planning.
- It does not claim production-grade benchmark construction, historical
  constituent membership, live queue writes, live usage debit, or frontend
  workflow completion.

## Verification

Expected checks for this slice:

- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:event-study`
- `npm run check:high-cost-analytics`
- `npm run typecheck`
- `npm run test`
- `npm run check` reaches `npm run build` after passing lint, typecheck, tests,
  golden regression, and contract checks, then fails only at delegated
  `@aiphabee/web` Vite build because Node v22.12.0 lacks
  `node:module.registerHooks`
- `git diff --check`
- `git diff --name-only -- apps/web`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- Live event-study execution and durable queue writes remain absent.
- Live benchmark/security historical constituent logic remains absent.
- Export, multilingual, newbie/professional mode, session memory, and frontend
  workflows remain separate Sprint 3.1 items.
- Root `npm run check` remains blocked by the existing delegated frontend Vite
  build/runtime mismatch, not by this backend scaffold.
