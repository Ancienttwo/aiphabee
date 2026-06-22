# Licensed Advice Exploration Scaffold Notes

Date: 2026-06-22

## Decision

Implement Phase 4 Route 2 as a compliance-blocking exploration planner, not as a
personalized advice feature.

## Why

The PRD explicitly keeps personalized advice behind a confirmed licensed path.
The current product truth is still a research and evidence tool, so the smallest
coherent slice is to define the controls required before future exploration can
start:

- external Type 4 written opinion
- licensed entity or partner
- responsible officer supervision
- suitability profile controls
- advice record retention
- human review queue
- kill switch policy
- complaint handling path

## Boundary

`planned_no_write` means the inputs for an exploration plan are present. It does
not mean AiphaBee can generate personalized investment advice, execute trades,
route orders, run a live model for advice, persist suitability decisions, or
ship frontend advice UI.

The runtime and worker routes always return false for advice generation, live
model execution, order execution, persistent writes, and SQL emission.

## Verification Surface

- `deploy/compliance/licensed-advice-exploration.contract.json`
- `scripts/check-licensed-advice-exploration-contract.mjs`
- `packages/licensed-advice-runtime/src/index.test.ts`
- `apps/worker/src/index.test.ts`
- `npm run check:licensed-advice-exploration`
