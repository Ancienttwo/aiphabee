# Plan: Field Entitlement Enforcement Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 16:27 +08
> **Slug**: field-entitlement-enforcement-scaffold
> **Spec**: `docs/spec.md`
> **Source Baseline**:
> `docs/governance/account-workspace-entitlement-scaffold.md`
> **Task Contract**:
> `tasks/contracts/field-entitlement-enforcement-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/field-entitlement-enforcement-scaffold.notes.md`

## Agentic Routing

- Selected route: Data Access Gateway evaluator scaffold for Sprint 1.1 DAT-05.
- Routing reason: account/workspace entitlement schemas now exist, but the
  Gateway evaluator still only enforced channel and field allowlists. It needs
  workspace, plan, dataset, field, time-range, and export dimensions before live
  entitlement rows can be connected.
- Due diligence:
  - P1 map: `packages/data-access-gateway`, `deploy/gateway/access.contract.json`,
    Worker `/gateway/runtime` and `/gateway/access-check`.
  - P2 trace: request body -> Gateway request model -> evaluator -> cache key
    -> envelope response.
  - P3 decision rationale: add deterministic local policy execution and
    synthetic tests only; do not claim live partner rights matrix or database
    policy source.

## Workflow Inventory

- Active plan: `plans/plan-field-entitlement-enforcement-scaffold.md`
- Task contract:
  `tasks/contracts/field-entitlement-enforcement-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/field-entitlement-enforcement-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/field-entitlement-enforcement-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Extend `DataAccessRequest` with workspace and export context.
- Add entitlement policy rules for workspace, plan, channel, dataset, field,
  time-range, and export checks.
- Include workspace and export dimensions in cache keys.
- Update Worker `/gateway/runtime` and `/gateway/access-check` to expose and
  pass through the new dimensions while keeping live policy source disabled.
- Keep partner rights matrix ingestion, database policy reads, and Serving Store
  integration out of scope.

## Task Breakdown

- [x] Add entitlement policy types and evaluator checks.
- [x] Add synthetic workspace entitlement tests.
- [x] Update Gateway runtime contract and checker.
- [x] Pass workspace/export context through Worker `/gateway/access-check`.
- [x] Update tracker/governance/todos.
- [x] Verify local checks and workflow strict check.
