# Product Agent Release Gate Scaffold Contract

## Scope

Complete the Sprint 3.3 §19.2 backend scaffold for product and Agent release
checks covering security ambiguity and evidence-bound concrete financial
numbers.

## Required Surfaces

- `@aiphabee/agent-runtime` exposes `product_agent_release_gate` capabilities.
- `GET /agent/runtime` includes nested release-gate readiness.
- `POST /agent/release-gates/product-agent/plan` returns the gate plan.
- Local contract checker: `npm run check:product-agent-release-gate`.
- Empty schema scaffold:
  - `core.product_agent_release_gate`
  - `governance.product_agent_release_gate_contract`

## Behavioral Contract

- Ambiguous security input must produce a blocking clarification before tool
  planning.
- Silent security selection must remain disallowed.
- Concrete financial numbers must require either:
  - `tool_result` with `source_record_id`
  - `deterministic_calculation` with calculation reference
  - post-generation evidence card / source record binding before answer output
- Numeric sources must block:
  - `model_memory`
  - `training_data`
  - `unverified_prompt`
  - `unstated_source`
- Answer/evidence contract must require fact/calculation/inference/unknown
  labels.
- Fact claims require evidence cards.
- Calculation claims require calculation references.
- Unknown claims require missing reasons.
- No live DB writes, SQL, live tool execution, model calls, persistent writes,
  or frontend rendering.

## Non-Goals

- No live evidence binding writes.
- No frontend clarification UI.
- No production release signoff.
- No actual model/tool execution.
