# Plan: Corporate Action Adjustment Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 16:14 +08
> **Slug**: corporate-action-adjustment-scaffold
> **Spec**: `docs/spec.md`
> **Source Baseline**: `docs/governance/data-contract-methodology-baseline.md`
> **Task Contract**:
> `tasks/contracts/corporate-action-adjustment-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/corporate-action-adjustment-scaffold.notes.md`

## Agentic Routing

- Selected route: Supabase-compatible schema scaffold for Sprint 1.1 DAT-04.
- Routing reason: security master, raw snapshots, and financial facts now have
  empty storage, but corporate actions and adjustment factors need their own
  method-versioned structures before price history can expose adjusted series.
- Due diligence:
  - P1 map: PRD §10.4, data methodology baseline, migration contract, Worker
    `/data/runtime`.
  - P2 trace: migration contract -> SQL files -> checker coverage -> Worker
    capability response.
  - P3 decision rationale: add empty schema scaffolds only; do not claim live
    adjustment-engine parity without partner bars and golden corpus.

## Workflow Inventory

- Active plan: `plans/plan-corporate-action-adjustment-scaffold.md`
- Task contract:
  `tasks/contracts/corporate-action-adjustment-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/corporate-action-adjustment-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/corporate-action-adjustment-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add a Supabase-compatible migration for empty `core.corporate_action`,
  `core.adjustment_methodology`, and `core.price_adjustment_factor` tables.
- Preserve default-deny and no-market-data guarantees in the database contract.
- Extend `/data/runtime` to report corporate-action and adjustment schema
  capability without live actions, adjusted series, or database queries.
- Keep real price bars, Serving reads, adjustment computation, usage ledger, and
  frontend out of scope.

## Task Breakdown

- [x] Add corporate action schema migration.
- [x] Add adjustment methodology schema migration.
- [x] Add price adjustment factor schema migration.
- [x] Update database migration contract.
- [x] Extend Worker `/data/runtime` capability route and tests.
- [x] Update tracker/governance/todos.
- [x] Verify local checks and workflow strict check.
