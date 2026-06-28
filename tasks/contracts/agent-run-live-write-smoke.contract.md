# Agent Run Live Write Smoke Contract

## Goal

Add a guarded backend smoke for Sprint 1.3 that proves one synthetic Agent run
can write, read, and delete audit, evidence, and usage-ledger rows through
Hyperdrive without enabling production Agent persistence.

## Scope

- Add guarded `POST /agent/runs/live-write-smoke`.
- Require `x-aiphabee-smoke=agent-run-live-write-v1`.
- Require `AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN`.
- Require `AIPHABEE_HYPERDRIVE` after auth passes.
- Create `aiphabee_audit.agent_run_audit_event` schema scaffold.
- Use `createAgentDryRunTelemetry()` for a prompt-free `run.audit` payload.
- Use `createEvidenceRecordPlan()` for evidence row identifiers.
- Use `createUsageLedgerEventPlan()` for usage event and ledger entry ids.
- Insert audit, evidence, account/workspace, meter, usage event, and ledger
  entry rows inside one transaction.
- Read back audit/evidence/usage/ledger presence.
- Delete every synthetic row before commit.
- Return a hash-only summary with no DB connection string, raw row ids, token,
  prompt, or raw model/tool output.
- Add contract/checker/test and connect to root `npm run check`.

## Explicit Non-Goals

- No frontend work.
- No production Agent run persistence.
- No durable run-state or checkpoint persistence.
- No billing-posted ledger entries.
- No user-facing live model token streaming.
- No AI Gateway logs/cost/cache/rate-limit/fallback evidence.

## Verification

- `npm run test -- apps/worker/src/agent-run-live-write-smoke.test.ts`
- `npm run check:agent-run-live-write-smoke`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/worker`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
