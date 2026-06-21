# Plan: Env Secrets Contract

> **Status**: Verified
> **Created**: 2026-06-20 14:58 +08
> **Slug**: env-secrets-contract
> **Spec**: `docs/spec.md`
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/env-secrets-contract.contract.md`
> **Implementation Notes**: `tasks/notes/env-secrets-contract.notes.md`

## Agentic Routing

- Selected route: env/secrets contract and validation
- Routing reason: Sprint 0.4 needs dev/staging/prod env management, but real
  provider secrets must not be committed or provisioned in this slice.
- Due diligence:
  - P1 map: env templates, schema, CI, Worker vars, future provider stores.
  - P2 trace: `npm run check` -> `npm run check:env` -> schema/template
    validation -> CI parity.
  - P3 decision rationale: enforce names-only templates now; leave provider
    secret stores and rotation to deployment work.

## Task Breakdown

- [x] Add env schema with secret flags.
- [x] Add dev/staging/prod names-only templates.
- [x] Add env contract validator.
- [x] Wire validator into root check and CI.
- [x] Update tracker/todos/governance docs.
- [x] Verify local checks and workflow strict check.
