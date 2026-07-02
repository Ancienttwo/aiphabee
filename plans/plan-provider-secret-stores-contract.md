# Plan: Provider Secret Stores Contract

> **Status**: Verified
> **Created**: 2026-06-20 15:20 +08
> **Slug**: provider-secret-stores-contract
> **Spec**: `docs/spec.md`
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/provider-secret-stores-contract.contract.md`
> **Implementation Notes**: `tasks/notes/provider-secret-stores-contract.notes.md`

## Agentic Routing

- Selected route: no-secret provider store, rotation, and emergency revocation
  contract.
- Routing reason: Sprint 0.4 needs provider secret stores and rotation policy,
  but real Cloudflare/GitHub credentials and approved provider mutation
  are not available in repo-local state.
- Due diligence:
  - P1 map: env secret schema, Cloudflare Worker secret store, GitHub Actions
    environment secrets, retired database-provider secret boundary, runbook,
    CI checker.
  - P2 trace: env secret names -> provider store manifest -> rotation/revocation
    runbook -> `/secrets/runtime` no-secret capability route.
  - P3 decision rationale: make secret names, stores, commands, cadence, and
    revocation SLA verifiable without writing or mutating secret values.

## Task Breakdown

- [x] Add provider secret stores contract.
- [x] Add rotation and emergency revocation runbook.
- [x] Add `npm run check:secrets` and CI coverage.
- [x] Add Worker `/secrets/runtime` capability route.
- [x] Add tests for the no-secret runtime capability route.
- [x] Update `.gitignore` for Cloudflare local `.dev.vars*` files.
- [x] Update tracker/todos/governance docs.
- [x] Verify local checks, Wrangler smoke, and workflow strict check.
