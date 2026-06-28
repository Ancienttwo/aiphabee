# Agent Label Budget Release Gate Scaffold Contract

## Scope

Complete the Sprint 3.3 §19.2 backend scaffold for answer claim-label
effectiveness and high-cost task budget confirmation.

## Required Surfaces

- `@aiphabee/agent-runtime` exposes `agent_label_budget_release_gate`
  capabilities.
- `GET /agent/runtime` includes nested release-gate readiness.
- `POST /agent/release-gates/label-budget/plan` returns the gate plan.
- Local contract checker: `npm run check:label-budget-release-gate`.
- Empty schema scaffold:
  - `aiphabee_core.agent_label_budget_release_gate`
  - `aiphabee_governance.agent_label_budget_release_gate_contract`

## Behavioral Contract

- Fact claims require evidence cards.
- Calculation claims require calculation refs.
- Inference claims require evidence strength.
- Unknown claims require missing reasons.
- Evidence strength uses categorical values and must not expose a confidence
  score.
- High-cost tasks require deterministic credit estimates.
- High-cost tasks require user confirmation before enqueue.
- Confirmed high-cost tasks use the independent high-cost pool.
- Usage reservation requires pre-debit, failure refund, and idempotency.
- No live DB writes, queue writes, ledger writes, SQL, live tool execution,
  model calls, persistent writes, or frontend rendering.

## Non-Goals

- No generated-answer label parser.
- No frontend budget confirmation UI.
- No live high-cost queue execution.
- No live usage ledger writes.
- No production release signoff.
