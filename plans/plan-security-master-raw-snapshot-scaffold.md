# Plan: Security Master Raw Snapshot Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 16:45 +08
> **Slug**: security-master-raw-snapshot-scaffold
> **Spec**: `docs/spec.md`
> **Source Baseline**: `docs/governance/data-contract-methodology-baseline.md`
> **Task Contract**:
> `tasks/contracts/security-master-raw-snapshot-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/security-master-raw-snapshot-scaffold.notes.md`

## Agentic Routing

- Selected route: Postgres-compatible schema scaffold for Sprint 1.1 data
  foundations.
- Routing reason: Data Access Gateway can now reject unsafe access, but Sprint
  1.1 still needs security master and raw snapshot tables before Serving can
  return any licensed data.
- Due diligence:
  - P1 map: existing migration contract, governance default-deny schema,
    PRD DAT-01/DAT-02, Worker runtime capability routes.
  - P2 trace: migration contract -> SQL files -> checker coverage -> Worker
    `/data/runtime`.
  - P3 decision rationale: add empty schema scaffolds only; do not load partner
    or market data without signed rights.

## Workflow Inventory

- Active plan: `plans/plan-security-master-raw-snapshot-scaffold.md`
- Task contract: `tasks/contracts/security-master-raw-snapshot-scaffold.contract.md`
- Implementation notes: `tasks/notes/security-master-raw-snapshot-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/security-master-raw-snapshot-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add a second Postgres-compatible migration with empty security master and raw
  snapshot tables.
- Preserve default-deny and no-market-data guarantees in the database contract.
- Add `/data/runtime` to report schema capability without live queries.
- Financial fact/restatement and corporate-action/adjustment schemas now exist
  in later slices; real data loading and Hyperdrive live smoke remain out of
  scope for this slice.

## Task Breakdown

- [x] Add security master schema migration.
- [x] Add raw snapshot / data version schema migration.
- [x] Update database migration contract.
- [x] Add Worker `/data/runtime` capability route and tests.
- [x] Update tracker/governance/todos.
- [x] Verify local checks and workflow strict check.
