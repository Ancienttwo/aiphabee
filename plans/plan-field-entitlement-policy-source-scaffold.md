# Plan: Field Entitlement Policy Source Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 17:38 +08
> **Slug**: field-entitlement-policy-source-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/field-entitlement-policy-source-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/field-entitlement-policy-source-scaffold.notes.md`

## Agentic Routing

- Selected route: deterministic DB-row-to-Gateway-policy compiler for Sprint
  1.1 DAT-05.
- Routing reason: Gateway field enforcement exists, and account/workspace
  entitlement schemas exist, but there was no executable contract for compiling
  entitlement rows into a Gateway policy.
- Due diligence:
  - P1 map: `aiphabee_governance.data_entitlement`, `aiphabee_governance.workspace_entitlement`,
    `platform.workspace_subscription`, `DataAccessPolicy`, Worker
    `/gateway/runtime`, and Gateway contract guard manifest.
  - P2 trace: entitlement rows -> active subscription/workspace filtering ->
    field/entitlement policies -> Gateway evaluator -> no live DB read.
  - P3 decision rationale: compile synthetic row snapshots first; do not
    connect live DB reads or partner rights matrix until external rights
    evidence exists.

## Workflow Inventory

- Active plan: `plans/plan-field-entitlement-policy-source-scaffold.md`
- Task contract:
  `tasks/contracts/field-entitlement-policy-source-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/field-entitlement-policy-source-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/field-entitlement-policy-source-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add row contracts for `data_entitlement`, `workspace_entitlement`, and
  `workspace_subscription` inside `@aiphabee/data-access-gateway`.
- Compile only active workspace-bound entitlement rows into Gateway policy.
- Preserve default-deny when no active workspace entitlement exists.
- Support wildcard field patterns and blocked precedence.
- Expose policy-source capability on Worker `/gateway/runtime`.
- Keep live DB reads, partner rights matrix ingestion, live Serving reads, and
  frontend out of scope.

## Task Breakdown

- [x] Add entitlement row contracts.
- [x] Add DB-row-to-Gateway-policy compiler.
- [x] Cover active/expired/blocked/export/time-range policy cases.
- [x] Expose Worker runtime policy-source capability.
- [x] Add Gateway contract guard.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
