# Plan: failure-recovery-policy-scaffold

> **Status**: Implemented
> **Owner**: Codex
> **Created**: 2026-06-21
> **Sprint**: 1.3
> **Tracker Item**: AGT-08

## Goal

Add a no-live Agent planner contract for AGT-08 failure recovery, partial retry,
and no-double-charge behavior.

## Scope

- Extend `@aiphabee/agent-runtime` runtime capabilities with
  `failure_recovery_policy`.
- Extend `POST /agent/runs/plan` with retryable/non-retryable error classes,
  per-step recovery actions, partial answer behavior, recovery-state placeholders,
  and usage-ledger idempotency requirements.
- Add a local deploy contract and checker:
  `deploy/agent/failure-recovery-policy.contract.json` and
  `npm run check:failure-recovery-policy`.
- Update worker/runtime tests and tracker/governance notes.

## Out of Scope

- Actual tool execution retries.
- Durable run-state persistence.
- Live usage ledger writes.
- Frontend retry UI.
- Workflow task recovery.

## Verification

- `npm run check:failure-recovery-policy`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- local `POST /agent/runs/plan` smoke after implementation
