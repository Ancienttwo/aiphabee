# Plan: Model Provider Streaming Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 15:25 +08
> **Slug**: model-provider-streaming-scaffold
> **Spec**: `docs/spec.md`
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/model-provider-streaming-scaffold.contract.md`
> **Implementation Notes**: `tasks/notes/model-provider-streaming-scaffold.notes.md`

## Agentic Routing

- Selected route: no-secret model provider and streaming execution contract with
  a guarded Worker streaming route.
- Routing reason: Sprint 0.4 needs model provider / streaming execution, but
  Cloudflare AI Gateway, provider secrets, budget ledger, and evidence-binding
  enforcement are not live.
- Due diligence:
  - P1 map: AI SDK v7, Cloudflare AI Gateway, Agent Runtime dry-run route,
    model-provider contract, and Worker stream guard.
  - P2 trace: model provider manifest -> checker -> `/agent/model-provider`
    capability route -> `/agent/runs/stream` guarded error.
  - P3 decision rationale: expose the execution contract and streaming boundary
    without making a model call or fabricating AI Gateway evidence.

## Task Breakdown

- [x] Add model provider / AI Gateway contract.
- [x] Add `npm run check:model-provider` and CI coverage.
- [x] Add shared `MODEL_PROVIDER_NOT_CONFIGURED` error code.
- [x] Add Worker `GET /agent/model-provider` capability route.
- [x] Add Worker `POST /agent/runs/stream` guard.
- [x] Add tests for capability and guarded streaming route.
- [x] Update tracker/todos/governance docs.
- [x] Verify local checks, Wrangler smoke, and workflow strict check.
