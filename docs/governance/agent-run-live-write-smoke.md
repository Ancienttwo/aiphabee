# Agent Run Live Write Smoke

> **Status**: Verified guarded backend smoke
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/agent-run-live-write-smoke.contract.md`

This slice adds a guarded Agent backend smoke route that proves one synthetic
Agent run can write, read, and delete audit, evidence, and usage-ledger rows
through Hyperdrive in a single transaction.

It is not product Agent run persistence, billing posting, durable run-state
storage, frontend Ask rendering, or user-facing model token streaming.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Worker smoke route | `POST /agent/runs/live-write-smoke` | Guarded by `x-aiphabee-smoke` plus `AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN` |
| Audit payload | `createAgentDryRunTelemetry()` | Creates prompt-free `run.audit` metadata from the existing observability contract |
| Audit table | `audit.agent_run_audit_event` | Stores synthetic smoke audit JSON with default-deny contract metadata |
| Evidence rows | `core.evidence_record` + `core.evidence_source_ref` | Reuses Evidence service plan fields and cleans up smoke rows |
| Usage rows | `core.usage_event` + `core.usage_ledger_entry` | Reuses usage-ledger event plan fields with `billable_state=preview` and cleans up smoke rows |
| Frontend | Out of scope | No `apps/web` changes |

## P2 Concrete Trace

1. Operator calls the smoke route with fixed header and bearer token.
2. Worker rejects missing header, missing env, or wrong bearer token before
   opening Hyperdrive.
3. Worker returns `missing_binding` when `AIPHABEE_HYPERDRIVE` is absent.
4. Worker opens a transaction and inserts synthetic rows into:
   `audit.agent_run_audit_event`, `core.evidence_record`,
   `core.evidence_source_ref`, `core.account`, `core.workspace`,
   `core.usage_meter_rule`, `core.usage_event`, and
   `core.usage_ledger_entry`.
5. Worker reads back audit, evidence, usage event, and ledger entry presence.
6. Worker deletes every synthetic row in dependency order and commits.
7. Worker returns only status, counts, table names, and hashes.

## P3 Design Decision

Selected a guarded insert/select/delete smoke instead of enabling production
Agent persistence.

Reason:

- Sprint 1.3 needed stronger evidence that run audit/evidence/usage tables can
  be written through the runtime path.
- Production persistence requires retention, retry/idempotency, billing posting,
  durable state, and frontend state semantics that are separate product slices.
- A transaction-scoped smoke gives concrete DB evidence without leaving product
  rows behind.

Tradeoff:

- The backend can now prove the DB write path for one synthetic Agent run.
- Product Agent run persistence, durable run-state, billing posting, and
  frontend rendering remain separate release work.

## Verification

- `npm run test -- apps/worker/src/agent-run-live-write-smoke.test.ts`
- `npm run check:agent-run-live-write-smoke`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/worker`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- No production Agent run persistence.
- No durable run-state or resume checkpoint writes.
- No billing-posted usage ledger entries.
- No frontend Ask/evidence-card rendering.
- No user-facing live model token streaming.
