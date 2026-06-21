# Agent Label Budget Release Gate Scaffold Notes

## Summary

Implemented the Sprint 3.3 §19.2 backend scaffold for claim-label effectiveness
and high-cost task budget confirmation.

## Current State

- `@aiphabee/agent-runtime` exposes `agent_label_budget_release_gate` capability
  under `GET /agent/runtime`.
- `POST /agent/release-gates/label-budget/plan` returns a deterministic
  no-write plan.
- The gate reuses `createToolLoopAgentPlan()` to read the existing
  `answer_evidence_contract`.
- The label gate proves fact, calculation, inference, and unknown claims each
  have required bindings.
- Evidence strength remains categorical and confidence-score display remains
  disabled.
- The gate reuses `planHighCostAnalyticsQueue()` to show unconfirmed high-cost
  tasks stay `confirmation_required`, while confirmed tasks become
  `queued_planned` in the independent high-cost pool.
- The gate reuses `createHighCostUsageReservationPlan()` to show pre-debit is
  only planned after confirmation, with failure refund and idempotency still
  required.
- `core.agent_label_budget_release_gate` and
  `governance.agent_label_budget_release_gate_contract` exist as empty schema
  scaffolds for future persistence.
- The local contract checker verifies claim labels, high-cost budget policy,
  linked contracts, no-live boundaries, package script registration, and
  database contract coverage.

## Non-Goals

- No generated-answer label parser.
- No frontend budget confirmation UI.
- No live high-cost queue execution.
- No live usage ledger writes.
- No model calls.
- No SQL or persistent writes.

## Verification

Passed on 2026-06-21:

- `npm run check:label-budget-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`

`npm run check` passed all contract checks reached by this slice, including
`check:label-budget-release-gate`, then failed in the final workspace build at
`@aiphabee/web` because the current local Node runtime does not expose
`node:module.registerHooks`, which `@cloudflare/vite-plugin` imports from
`apps/web/vite.config.ts`. Frontend work is intentionally out of scope for this
slice.
