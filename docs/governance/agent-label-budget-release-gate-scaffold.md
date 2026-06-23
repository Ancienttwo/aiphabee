# Agent Label Budget Release Gate Scaffold

> **Status**: Backend scaffold
> **Last Updated**: 2026-06-21 22:21 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/agent-label-budget-release-gate-scaffold.contract.md`

This slice completes the backend-only Sprint 3.3 §19.2 scaffold for proving
fact/inference/unknown labels are enforced and high-cost tasks require a budget
estimate plus user confirmation before enqueue.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime | `@aiphabee/agent-runtime` | Owns `answer_evidence_contract` and the release-gate capability metadata |
| Runtime route | `GET /agent/runtime` | Reports nested `agent_label_budget_release_gate` readiness |
| Gate route | `POST /agent/release-gates/label-budget/plan` | Composes label and high-cost budget checks |
| Label source | `POST /agent/runs/plan` | Produces fact/calculation/inference/unknown claim-label contract |
| High-cost planner | `POST /analytics/high-cost/plan` | Produces deterministic credit estimate, queue decision, and confirmation gate |
| Usage reservation | `POST /usage/high-cost/reservation/plan` | Produces pre-debit, failure-refund, and idempotency no-write plan |
| Contract | `deploy/agent/label-budget-release-gate.contract.json` | Guards label requirements, high-cost budget policy, linked contracts, and blockers |
| Schema scaffold | `aiphabee_core.agent_label_budget_release_gate`, `aiphabee_governance.agent_label_budget_release_gate_contract` | Empty future persistence tables |
| Explicitly absent | Generated-answer label parser, frontend budget confirmation UI, live high-cost queue execution | Remain blocked or delegated |

## P2 Concrete Trace

1. Caller requests `POST /agent/release-gates/label-budget/plan`.
2. Worker normalizes the optional security query, high-cost tool, workspace,
   subscription, event window, locale, and response depth.
3. The gate calls `createToolLoopAgentPlan()` and reads
   `answer_evidence_contract.claim_labels`.
4. The gate builds a label matrix requiring fact evidence cards, calculation
   refs, inference evidence strength, and unknown missing reasons.
5. The gate calls `planHighCostAnalyticsQueue()` with `userConfirmed=false`,
   proving high-cost work stays `confirmation_required`.
6. The gate calls the same planner with `userConfirmed=true`, proving the task
   moves to `queued_planned` in the independent high-cost pool.
7. The gate calls `createHighCostUsageReservationPlan()` before and after
   confirmation, proving pre-debit waits for confirmation while failure refund
   and idempotency remain planned no-write semantics.

## P3 Design Decision

Selected a Worker-level release-gate composer with Agent runtime capability
metadata instead of moving analytics or usage-ledger logic into
`@aiphabee/agent-runtime`.

Reason:

- Claim labeling belongs to Agent answer contracts.
- High-cost estimation belongs to analytics.
- Pre-debit/refund/idempotency belongs to usage-ledger.
- Sprint 3.3 needs a cross-owner release gate, not a new duplicated policy
  engine.

Tradeoff:

- The repo can now prove the release-gate path across all three owners.
- Live generated-answer validation, frontend confirmation UI, and durable queue
  execution remain future work.

## Verification

Run the focused gate:

- `npm run check:label-budget-release-gate`
- `npm run check:database`
- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
