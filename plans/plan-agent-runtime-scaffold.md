# Plan: Agent Runtime Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 14:47 +08
> **Slug**: agent-runtime-scaffold
> **Spec**: `docs/spec.md`
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/agent-runtime-scaffold.contract.md`
> **Implementation Notes**: `tasks/notes/agent-runtime-scaffold.notes.md`

## Agentic Routing

- Selected route: provider-agnostic Agent Runtime skeleton
- Routing reason: Sprint 0.4 needs AI SDK v7 on Workers, but real provider
  credentials and market-data tools are not ready.
- Due diligence:
  - P1 map: Worker routes, agent-runtime package, data contracts, AI SDK v7 beta,
    model provider boundary.
  - P2 trace: Worker request -> runtime skeleton -> response envelope -> no-call
    dry-run behavior and policy denial.
  - P3 decision rationale: implement runtime contracts without model/provider
    side effects.

## Task Breakdown

- [x] Add `packages/agent-runtime`.
- [x] Pin AI SDK v7 beta dependency.
- [x] Add runtime capabilities and dry-run skeleton.
- [x] Add Worker routes for capabilities and dry-run.
- [x] Add tests for runtime and Worker routes.
- [x] Update tracker/todos/governance docs.
- [x] Verify local checks, Wrangler smoke, and workflow strict check.
