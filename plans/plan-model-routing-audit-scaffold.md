# Plan: model-routing-audit-scaffold

> **Status**: Implemented
> **Owner**: Codex
> **Created**: 2026-06-21
> **Sprint**: 1.3
> **Tracker Item**: Model routing + AI Gateway audit/fallback

## Goal

Add a no-live Agent planner contract for model routing, AI Gateway audit
requirements, cache limits, and fallback model-change recording.

## Scope

- Extend `@aiphabee/agent-runtime` runtime capabilities with
  `model_routing_audit`.
- Extend `POST /agent/runs/plan` with planned routing tiers, fallback policy,
  required audit fields, cache constraints, and validation rules.
- Link the policy to the existing Cloudflare AI Gateway provider contract and
  failure recovery policy.
- Add a local deploy contract and checker:
  `deploy/agent/model-routing-audit.contract.json` and
  `npm run check:model-routing-audit`.
- Update worker/runtime tests and tracker/governance notes.

## Out of Scope

- Live model calls.
- Real AI Gateway request smoke.
- Runtime model selection.
- Token/cost log writes.
- Frontend Ask/evidence-card rendering.

## Verification

- `npm run check:model-routing-audit`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- local `POST /agent/runs/plan` smoke after implementation
