# Plan: Get Financial Facts Tool Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 02:11 +08
> **Slug**: get-financial-facts-tool-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/get-financial-facts-tool-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/get-financial-facts-tool-scaffold.notes.md`

## Agentic Routing

- Selected route: no-live `get_financial_facts` tool scaffold for Sprint 1.2.
- Routing reason: corporate-action timelines are now exposed; the next atomic
  tool can expose standardized financial fact rows with period, currency, unit,
  statement type, restatement version, and point-in-time semantics.
- Due diligence:
  - P1 map: `@aiphabee/financial-facts`, `@aiphabee/tool-registry`, Worker
    `/tools/get-financial-facts`, and a financial-facts contract checker.
  - P2 trace: instrument + period range + metrics + statement types + as-of +
    limit/cursor -> synthetic fact rows -> standard response envelope ->
    licensing, quality, point-in-time, range, row-limit, and input errors.
  - P3 decision rationale: add a query scaffold beside the existing restatement
    engine without enabling live partner facts or expanding storage semantics.

## Workflow Inventory

- Active plan: `plans/plan-get-financial-facts-tool-scaffold.md`
- Task contract:
  `tasks/contracts/get-financial-facts-tool-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/get-financial-facts-tool-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/get-financial-facts-tool-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Extend `@aiphabee/financial-facts` with `getFinancialFacts()`.
- Cover income statement, balance sheet, and cash flow fact rows.
- Support metric subsets, statement type subsets, point-in-time `as_of`, and
  deterministic limit/cursor pagination.
- Return period, currency, unit, accounting standard, scale, and restatement
  version metadata.
- Return standard error states for unlicensed metrics/types, quality hold,
  point-in-time unavailable, out of range, too many rows, not found, and invalid
  input.
- Add Worker `POST /tools/get-financial-facts` with standard envelopes.
- Promote `get_financial_facts` from planned to scaffold in the shared registry.
- Add `deploy/tools/get-financial-facts.contract.json` and
  `npm run check:financial-facts`.

## Task Breakdown

- [x] Add no-live `getFinancialFacts()` package behavior and tests.
- [x] Promote `get_financial_facts` registry entry from planned to scaffold.
- [x] Add Worker `POST /tools/get-financial-facts` route.
- [x] Add tool contract and checker coverage.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
