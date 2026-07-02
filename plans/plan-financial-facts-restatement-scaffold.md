# Plan: Financial Facts Restatement Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 16:08 +08
> **Slug**: financial-facts-restatement-scaffold
> **Spec**: `docs/spec.md`
> **Source Baseline**: `docs/governance/data-contract-methodology-baseline.md`
> **Task Contract**:
> `tasks/contracts/financial-facts-restatement-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/financial-facts-restatement-scaffold.notes.md`

## Agentic Routing

- Selected route: Postgres-compatible schema scaffold for Sprint 1.1 DAT-03.
- Routing reason: security master and raw snapshots now exist, but financial
  statements need their own period, currency, unit, methodology, and restatement
  version structures before Serving can expose sourced financial facts.
- Due diligence:
  - P1 map: PRD DAT-03, data methodology baseline, migration contract, Worker
    `/data/runtime`.
  - P2 trace: migration contract -> SQL files -> checker coverage -> Worker
    capability response.
  - P3 decision rationale: add empty schema scaffolds only; do not load partner
    facts or imply live Serving readiness without signed rights.

## Workflow Inventory

- Active plan: `plans/plan-financial-facts-restatement-scaffold.md`
- Task contract:
  `tasks/contracts/financial-facts-restatement-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/financial-facts-restatement-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/financial-facts-restatement-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add a Postgres-compatible migration for empty `aiphabee_core.financial_statement`,
  `aiphabee_core.financial_fact`, and `aiphabee_core.financial_restatement` tables.
- Preserve default-deny and no-market-data guarantees in the database contract.
- Extend `/data/runtime` to report financial-fact schema capability without
  live facts or database queries.
- Corporate-action/adjustment schemas now exist in a later slice; real data
  loading, Serving reads, usage ledger, and frontend remain out of scope.

## Task Breakdown

- [x] Add financial statement schema migration.
- [x] Add financial fact schema migration.
- [x] Add financial restatement schema migration.
- [x] Update database migration contract.
- [x] Extend Worker `/data/runtime` capability route and tests.
- [x] Update tracker/governance/todos.
- [x] Verify local checks and workflow strict check.
