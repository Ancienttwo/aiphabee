# Plan: Account Workspace Entitlement Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 16:20 +08
> **Slug**: account-workspace-entitlement-scaffold
> **Spec**: `docs/spec.md`
> **Source Baseline**: `docs/governance/golden-quality-commercial-baseline.md`
> **Task Contract**:
> `tasks/contracts/account-workspace-entitlement-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/account-workspace-entitlement-scaffold.notes.md`

## Agentic Routing

- Selected route: Postgres-compatible schema scaffold for Sprint 1.1 ACC-02.
- Routing reason: data schemas and default-deny Gateway now exist, but account,
  workspace, subscription, and entitlement records need a shared system-of-record
  model before field rights or usage ledger can be enforced per workspace.
- Due diligence:
  - P1 map: PRD ACC-02/DAT-05, package entitlement baseline, migration
    contract, Worker `/data/runtime` and `/gateway/runtime`.
  - P2 trace: migration contract -> SQL files -> checker coverage -> Worker
    capability response.
  - P3 decision rationale: add empty schema scaffolds only; do not claim live
    auth, billing, or entitlement enforcement without signed rights and identity
    provider integration.

## Workflow Inventory

- Active plan: `plans/plan-account-workspace-entitlement-scaffold.md`
- Task contract:
  `tasks/contracts/account-workspace-entitlement-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/account-workspace-entitlement-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/account-workspace-entitlement-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add a Postgres-compatible migration for empty account, workspace, membership,
  subscription, entitlement, and workspace-entitlement tables.
- Preserve default-deny and no-market-data guarantees in the database contract.
- Extend `/data/runtime` and `/gateway/runtime` to report schema capability
  without live account lookup, billing state, or field entitlement enforcement.
- Keep identity provider integration, payment provider integration, usage
  ledger, field-level runtime execution, and frontend out of scope.

## Task Breakdown

- [x] Add account/workspace schema migration.
- [x] Add subscription plan and workspace subscription schema migration.
- [x] Add entitlement and workspace entitlement schema migration.
- [x] Update database migration contract.
- [x] Extend Worker `/data/runtime` and `/gateway/runtime` capability routes
  and tests.
- [x] Update tracker/governance/todos.
- [x] Verify local checks and workflow strict check.
