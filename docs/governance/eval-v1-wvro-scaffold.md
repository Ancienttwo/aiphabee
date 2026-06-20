# Eval v1 WVRO Scaffold

> **Status**: Verified no-write eval v1 and WVRO scaffold
> **Last Updated**: 2026-06-21 04:52 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-eval-v1-wvro-scaffold.md`
> **Task Contract**: `tasks/contracts/eval-v1-wvro-scaffold.contract.md`

This slice adds eval v1 and WVRO instrumentation without persistent writes,
frontend dashboards, or production corpus claims.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Observability package | `packages/observability` | Owns eval v1 metrics, WVRO criteria, and run.eval payload shape |
| Worker runtime | `GET /observability/runtime` | Advertises eval v1 capability |
| Worker planner | `POST /observability/eval-v1/plan` | Returns no-write eval v1 record for deterministic smoke/tests |
| Guard contract | `deploy/observability/eval-v1.contract.json` | Requires metrics, WVRO criteria, high-intent actions, and no-write flags |
| Frontend | Out of scope | No `apps/web` files changed |

## P2 Concrete Trace

1. Caller posts eval counts and WVRO evidence to
   `POST /observability/eval-v1/plan`.
2. Worker normalizes snake/camel input into an eval v1 record request.
3. Observability computes four quality metrics, unsourced numeric claim rate,
   and WVRO criteria status.
4. Worker returns the record in the standard envelope with no D1 write and no
   OTLP export.
5. Existing dry-run telemetry also attaches an `eval_v1` payload to `run.eval`,
   but dry-runs are not counted as WVRO because they have no successful live tool
   call, openable evidence, or high-intent action.

## P3 Design Decision

Selected no-write instrumentation before persistent eval storage.

Reason:

- Sprint 1.4 needs a repeatable eval/WVRO contract.
- Sprint 0.4 live OTLP and persistent eval-store smokes remain blocked by
  missing external resources.
- Existing observability already emits `run.eval` events, so extending that
  payload preserves the local contract.

Tradeoff:

- Quality metrics and WVRO eligibility can be verified locally.
- Production corpus approval and durable analytics remain later work.

What fails first at 10x scale:

- Eval records need a durable dedupe key and sampled-answer provenance before
  high-volume persistent writes can be enabled safely.

## Verification

Passed:

- `npm run check:eval-v1`
- `npm run check:observability`
- `npm run test -- packages/observability/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/observability`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/observability`
- `npm run build --workspace @aiphabee/worker`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`

Local worker smoke:

- `POST /observability/eval-v1/plan` returns `status=planned_no_write`,
  `live_persistent_writes=false`, four quality metrics,
  `wvro.eligible=true` for a fully satisfied synthetic run, and
  `unsourced_numeric_claims.target_rate=0.001`.

## Residual Gaps

- Persistent eval-store writes are absent.
- Live OTLP export is absent.
- Frontend analytics dashboards are absent.
- Production partner-approved eval corpus is absent.
- Automatic post-generation answer grading is absent.
