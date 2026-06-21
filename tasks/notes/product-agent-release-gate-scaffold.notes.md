# Product Agent Release Gate Scaffold Notes

## Summary

Implemented the Sprint 3.3 §19.2 backend scaffold for product and Agent release
checks covering ambiguous security handling and evidence-bound concrete
financial numbers.

## Current State

- `@aiphabee/agent-runtime` exposes `product_agent_release_gate` capability under
  `GET /agent/runtime`.
- `POST /agent/release-gates/product-agent/plan` returns a deterministic no-write
  plan.
- The gate reuses `createPreToolCallResolution()` to prove `ABC` returns
  blocking clarification, two ambiguous candidates, no resolved instrument, and
  `tool_readiness.can_plan_tools=false`.
- The gate reuses `createToolLoopAgentPlan()` to prove concrete financial
  numbers are restricted to `tool_result` or `deterministic_calculation`.
- The gate now reuses `validatePostGenerationEvidenceBinding()` to prove
  unsourced post-generation financial numbers are blocked while evidence-card
  bound numbers pass locally.
- Numeric sources from model memory, training data, unverified prompts, and
  unstated sources remain blocked with `UNSOURCED_NUMERIC_CLAIM`.
- The answer/evidence contract requires fact/calculation/inference/unknown
  labels, evidence cards for facts, calculation refs for calculations, and
  missing reasons for unknown values.
- `core.product_agent_release_gate` and
  `governance.product_agent_release_gate_contract` exist as empty schema
  scaffolds for future persistence.
- The local contract checker verifies release checks, linked contracts,
  no-live boundaries, package script registration, and database contract
  coverage.

## Non-Goals

- No live evidence binding writes.
- No frontend clarification UI.
- No model calls.
- No live tool execution.
- No SQL or persistent writes.

## Verification

Passed on 2026-06-21:

- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:product-agent-release-gate`
- `npm run check:database`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`

Root check caveat:

- `npm run check` passed every backend/checker step including
  `check:product-agent-release-gate`, then retained the existing delegated
  frontend build caveat in `@aiphabee/web`: current Node does not expose
  `node:module.registerHooks` required by `@cloudflare/vite-plugin`.
