# Plan: Get Quote Snapshot Tool Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 01:25 +08
> **Slug**: get-quote-snapshot-tool-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/get-quote-snapshot-tool-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/get-quote-snapshot-tool-scaffold.notes.md`

## Agentic Routing

- Selected route: no-live `get_quote_snapshot` tool scaffold for Sprint 1.2.
- Routing reason: security resolution/profile and market calendar scaffolds now
  provide the context needed for an atomic quote snapshot contract.
- Due diligence:
  - P1 map: `@aiphabee/market-data`, `@aiphabee/tool-registry`, Worker
    `/tools/get-quote-snapshot`, and market-data contract checker.
  - P2 trace: instrument + fields + mode -> synthetic quote fixture ->
    standard response envelope -> licensing/quality/time/input errors.
  - P3 decision rationale: use deterministic synthetic delayed/close fixtures
    to prove quote envelope and error semantics before live market data rights.

## Workflow Inventory

- Active plan: `plans/plan-get-quote-snapshot-tool-scaffold.md`
- Task contract:
  `tasks/contracts/get-quote-snapshot-tool-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/get-quote-snapshot-tool-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/get-quote-snapshot-tool-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `@aiphabee/market-data` with `getQuoteSnapshot()`.
- Cover synthetic delayed and close snapshots.
- Support quote field subsets and delay metadata.
- Return standard error states for unlicensed fields, quality hold,
  point-in-time unavailable, not found, and invalid input.
- Add Worker `POST /tools/get-quote-snapshot` with standard envelopes.
- Mark `get_quote_snapshot` as scaffold-ready while live data remains disabled.
- Add `deploy/tools/get-quote-snapshot.contract.json` and
  `npm run check:market-data`.

## Task Breakdown

- [x] Add no-live `getQuoteSnapshot()` package and tests.
- [x] Promote `get_quote_snapshot` registry entry from planned to scaffold.
- [x] Add Worker `POST /tools/get-quote-snapshot` route.
- [x] Add tool contract and checker.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
