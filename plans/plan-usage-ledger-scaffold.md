# Plan: Usage Ledger Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 16:27 +08
> **Slug**: usage-ledger-scaffold
> **Spec**: `docs/spec.md`
> **Source Baseline**: `docs/governance/golden-quality-commercial-baseline.md`
> **Task Contract**: `tasks/contracts/usage-ledger-scaffold.contract.md`
> **Implementation Notes**: `tasks/notes/usage-ledger-scaffold.notes.md`

## Agentic Routing

- Selected route: Postgres-compatible schema scaffold for Sprint 1.1 ACC-04.
- Routing reason: account/workspace entitlement schemas now exist, but Gateway
  usage previews need persistent event, credit-meter, ledger, and reconciliation
  structures before billing reconciliation can be implemented.
- Due diligence:
  - P1 map: PRD ACC-04, weighted credits baseline, account/workspace schema,
    migration contract, Worker `/gateway/runtime`.
  - P2 trace: migration contract -> SQL files -> checker coverage -> Worker
    capability response.
  - P3 decision rationale: add empty schema scaffolds only; do not claim live
    usage writes without Serving Store, identity context, or billing integration.

## Workflow Inventory

- Active plan: `plans/plan-usage-ledger-scaffold.md`
- Task contract: `tasks/contracts/usage-ledger-scaffold.contract.md`
- Implementation notes: `tasks/notes/usage-ledger-scaffold.notes.md`
- Runtime evidence: `docs/governance/usage-ledger-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add a Postgres-compatible migration for empty usage meter rule, usage event,
  reconciliation batch, and ledger entry tables.
- Preserve default-deny and no-market-data guarantees in the database contract.
- Extend `/gateway/runtime` to report usage-ledger schema capability without
  live writes or billing reconciliation.
- Keep live event writes, billing provider reconciliation, quota displays, and
  frontend out of scope.

## Task Breakdown

- [x] Add usage meter rule schema migration.
- [x] Add usage event schema migration.
- [x] Add usage reconciliation batch schema migration.
- [x] Add usage ledger entry schema migration.
- [x] Update database migration contract.
- [x] Extend Worker `/gateway/runtime` capability route and tests.
- [x] Update tracker/governance/todos.
- [x] Verify local checks and workflow strict check.
