# Plan: Serving Store Schema Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 16:45 +08
> **Slug**: serving-store-schema-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**: `tasks/contracts/serving-store-schema-scaffold.contract.md`
> **Implementation Notes**: `tasks/notes/serving-store-schema-scaffold.notes.md`

## Agentic Routing

- Selected route: Postgres-compatible Serving Store schema scaffold for Sprint
  1.1.
- Routing reason: Gateway default-deny, quality hold, entitlement evaluator, and
  usage ledger schemas exist, but there is no versioned Serving Store projection
  that later live reads can target.
- Due diligence:
  - P1 map: PRD Serving pipeline, database migration contract, existing
    security/financial/corporate/account/usage schemas, Worker `/data/runtime`
    and `/gateway/runtime`.
  - P2 trace: migration contract -> SQL file coverage -> Worker runtime
    capability -> Gateway remains no live data access.
  - P3 decision rationale: add empty versioned projection tables only; do not
    enable live reads without partner data, Hyperdrive smoke, rights rows, and
    quality-release flow.

## Workflow Inventory

- Active plan: `plans/plan-serving-store-schema-scaffold.md`
- Task contract: `tasks/contracts/serving-store-schema-scaffold.contract.md`
- Implementation notes: `tasks/notes/serving-store-schema-scaffold.notes.md`
- Runtime evidence: `docs/governance/serving-store-schema-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add a Postgres-compatible migration for Serving Store dataset, field,
  snapshot, and record projection tables.
- Keep `default_deny`, `HOLD`, `held`, and `live_serving_reads=false` as the
  default posture.
- Extend `/data/runtime` and `/gateway/runtime` to expose Serving Store schema
  capability without serving market data.
- Keep live Gateway reads, partner-loaded data, billing writes, and frontend out
  of scope.

## Task Breakdown

- [x] Add Serving Store dataset schema migration.
- [x] Add Serving Store field schema migration.
- [x] Add Serving Store snapshot schema migration.
- [x] Add Serving Store record schema migration.
- [x] Update database migration contract.
- [x] Extend Worker `/data/runtime` and `/gateway/runtime` capability routes.
- [x] Update tracker/governance/todos.
- [x] Verify local checks and workflow strict check.
