# Plan: Usage Ledger Event Writer Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 17:30 +08
> **Slug**: usage-ledger-event-writer-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/usage-ledger-event-writer-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/usage-ledger-event-writer-scaffold.notes.md`

## Agentic Routing

- Selected route: deterministic usage event writer scaffold for Sprint 1.1
  ACC-04.
- Routing reason: Usage Ledger schema exists, and Gateway decisions now carry
  rows/credits/quality/Serving posture, but no executable per-call usage event
  and ledger-entry plan existed.
- Due diligence:
  - P1 map: `aiphabee_core.usage_*` schema, Data Access Gateway decision shape, Worker
    `/gateway/runtime`, ACC-04 usage/billing tracker rows.
  - P2 trace: Gateway access request -> decision usage summary -> usage event
    plan -> ledger entry preview -> runtime capability -> no live write.
  - P3 decision rationale: create deterministic event/ledger planning before
    live DB writes or billing reconciliation.

## Workflow Inventory

- Active plan: `plans/plan-usage-ledger-event-writer-scaffold.md`
- Task contract:
  `tasks/contracts/usage-ledger-event-writer-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/usage-ledger-event-writer-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/usage-ledger-event-writer-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `@aiphabee/usage-ledger` as a pure planner package.
- Attach `usageLedger` to every Data Access Gateway decision.
- Mark billable usage as `preview` only when workspace context exists, no error
  occurred, and credits are positive.
- Keep live writes, SQL, billing reconciliation, invoices, and frontend out of
  scope.

## Task Breakdown

- [x] Add usage event writer planner package.
- [x] Generate deterministic usage event and ledger-entry IDs.
- [x] Connect Gateway decisions to `usageLedger`.
- [x] Expose Worker `/gateway/runtime` event-writer capability.
- [x] Add Gateway contract guard.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
