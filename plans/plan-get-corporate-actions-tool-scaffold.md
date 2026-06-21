# Plan: Get Corporate Actions Tool Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 01:57 +08
> **Slug**: get-corporate-actions-tool-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/get-corporate-actions-tool-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/get-corporate-actions-tool-scaffold.notes.md`

## Agentic Routing

- Selected route: no-live `get_corporate_actions` tool scaffold for Sprint 1.2.
- Routing reason: price-history scaffolding now exposes adjustment methodology
  metadata, so the next atomic tool can expose the synthetic corporate-action
  timeline that explains dividends, splits/consolidations, placements, rights,
  and buybacks.
- Due diligence:
  - P1 map: `@aiphabee/corporate-actions`, `@aiphabee/tool-registry`, Worker
    `/tools/get-corporate-actions`, and a corporate-actions contract checker.
  - P2 trace: instrument + date range + types + limit/cursor -> synthetic
    corporate-action rows -> standard response envelope -> licensing, quality,
    range, row-limit, and input errors.
  - P3 decision rationale: add a query scaffold beside the existing adjustment
    engine without enabling live partner rows or expanding the engine surface.

## Workflow Inventory

- Active plan: `plans/plan-get-corporate-actions-tool-scaffold.md`
- Task contract:
  `tasks/contracts/get-corporate-actions-tool-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/get-corporate-actions-tool-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/get-corporate-actions-tool-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Extend `@aiphabee/corporate-actions` with `getCorporateActions()`.
- Cover dividends, splits, consolidations, rights issues, placements, and
  buybacks as synthetic action rows.
- Support type filtering and deterministic limit/cursor pagination.
- Return adjustment-impact metadata that links action types to adjustment
  methodology without computing live factors.
- Return standard error states for unlicensed types, quality hold, out of
  range, too many rows, not found, and invalid input.
- Add Worker `POST /tools/get-corporate-actions` with standard envelopes.
- Promote `get_corporate_actions` from planned to scaffold in the shared
  registry.
- Add `deploy/tools/get-corporate-actions.contract.json` and
  `npm run check:corporate-actions`.

## Task Breakdown

- [x] Add no-live `getCorporateActions()` package behavior and tests.
- [x] Promote `get_corporate_actions` registry entry from planned to scaffold.
- [x] Add Worker `POST /tools/get-corporate-actions` route.
- [x] Add tool contract and checker coverage.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
