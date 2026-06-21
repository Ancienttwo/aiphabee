# Plan: Evidence Lineage Tools Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 02:30 +08
> **Slug**: evidence-lineage-tools-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/evidence-lineage-tools-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/evidence-lineage-tools-scaffold.notes.md`

## Agentic Routing

- Selected route: no-live `get_data_lineage` and `get_entitlements` tool
  scaffolds for Sprint 1.2.
- Routing reason: the first seven atomic data tools now execute against
  synthetic fixtures; the next atomic slice is self-checkable evidence lineage
  and entitlement scope without enabling live partner rows or live DB reads.
- Due diligence:
  - P1 map: `@aiphabee/evidence-lineage`, `@aiphabee/data-access-gateway`,
    `@aiphabee/tool-registry`, Worker `/tools/get-data-lineage`,
    Worker `/tools/get-entitlements`, and the evidence-lineage contract checker.
  - P2 trace: evidence/record lookup -> synthetic lineage fixture -> standard
    envelope; workspace/channel/tool/dataset/fields -> synthetic entitlement
    rows -> Gateway policy compiler/evaluator -> standard envelope.
  - P3 decision rationale: add no-live tool scaffolds on top of existing
    entitlement compiler and synthetic provenance records without implementing
    a durable Evidence/Lineage service or live entitlement DB reads.

## Workflow Inventory

- Active plan: `plans/plan-evidence-lineage-tools-scaffold.md`
- Task contract:
  `tasks/contracts/evidence-lineage-tools-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/evidence-lineage-tools-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/evidence-lineage-tools-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `@aiphabee/evidence-lineage` with `getDataLineage()` and
  `getEntitlements()`.
- Return synthetic lineage rows with evidence ID, record ID, dataset, source,
  batch, version, method/formula, quality state, and upstream references.
- Compile synthetic entitlement rows through `createPolicyFromEntitlementRows()`
  and evaluate requested fields through `evaluateDataAccessRequest()`.
- Add Worker `POST /tools/get-data-lineage` and
  `POST /tools/get-entitlements` with standard success/error envelopes.
- Promote `get_data_lineage` and `get_entitlements` from planned to scaffold in
  the shared registry.
- Add `deploy/tools/evidence-lineage.contract.json` and
  `npm run check:evidence-lineage`.

## Task Breakdown

- [x] Add no-live evidence-lineage package behavior and tests.
- [x] Promote `get_data_lineage` and `get_entitlements` registry entries.
- [x] Add Worker tool routes and route tests.
- [x] Add evidence-lineage contract and checker coverage.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
