# Plan: Pre Tool Call Resolution Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 03:34 +08
> **Slug**: pre-tool-call-resolution-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/pre-tool-call-resolution-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/pre-tool-call-resolution-scaffold.notes.md`

## Agentic Routing

- Selected route: no-model pre-tool-call resolution scaffold for Sprint 1.3.
- Routing reason: ToolLoopAgent planning now exists; the next required safety
  boundary is resolving security/time/currency/methodology before tool calls
  and returning clarification instead of silently guessing critical ambiguity.
- Due diligence:
  - P1 map: `@aiphabee/agent-runtime`, Worker `POST /agent/runs/preflight`,
    Worker `POST /agent/runs/plan`, Tool Registry validation, and
    `deploy/agent/pre-tool-call-resolution.contract.json`.
  - P2 trace: request prompt/context -> registered tool validation -> security,
    time, currency, and methodology resolution -> assumptions or blocking
    clarifications -> tool readiness flag -> standard response envelope.
  - P3 decision rationale: add deterministic preflight context planning without
    model calls, actual tool execution, live entitlement reads, or frontend.

## Workflow Inventory

- Active plan: `plans/plan-pre-tool-call-resolution-scaffold.md`
- Task contract:
  `tasks/contracts/pre-tool-call-resolution-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/pre-tool-call-resolution-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/pre-tool-call-resolution-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `createPreToolCallResolution()` in `@aiphabee/agent-runtime`.
- Resolve or clarify:
  - security;
  - time/as_of;
  - currency;
  - methodology.
- Treat ambiguous security identifiers as blocking clarification.
- Return assumptions for safe defaults such as latest available snapshot,
  primary security currency, split-adjusted prices, and latest reported
  financial facts.
- Add Worker `POST /agent/runs/preflight`.
- Include preflight resolution inside `POST /agent/runs/plan`.
- Add `deploy/agent/pre-tool-call-resolution.contract.json` and
  `npm run check:pre-tool-call-resolution`.

## Task Breakdown

- [x] Add pre-tool-call resolution behavior and tests.
- [x] Add Worker preflight route and route tests.
- [x] Include preflight result in no-model ToolLoopAgent plan output.
- [x] Add preflight contract and checker coverage.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
