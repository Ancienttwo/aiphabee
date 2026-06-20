# Plan: Cloudflare Bindings Contract

> **Status**: Verified
> **Created**: 2026-06-20 15:10 +08
> **Slug**: cloudflare-bindings-contract
> **Spec**: `docs/spec.md`
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/cloudflare-bindings-contract.contract.md`
> **Implementation Notes**: `tasks/notes/cloudflare-bindings-contract.notes.md`

## Agentic Routing

- Selected route: binding contract and validation
- Routing reason: Sprint 0.4 needs Cloudflare binding planning, but real
  provider resources should not be invented in repo config.
- Due diligence:
  - P1 map: Worker, Workflows, Queues, Cron, Durable Objects, R2, KV, AI Gateway,
    Hyperdrive, CI validation, future smoke tests.
  - P2 trace: `npm run check` -> `npm run check:bindings` -> contract validation
    -> CI parity.
  - P3 decision rationale: complete binding planning now; keep provisioning and
    real smoke tests pending until resources exist.

## Task Breakdown

- [x] Add Cloudflare binding contract manifest.
- [x] Add binding contract validator.
- [x] Wire validator into root check and CI.
- [x] Update tracker/todos/governance docs.
- [x] Verify local checks and workflow strict check.
