# Plan: Tool Schema Contract Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 02:39 +08
> **Slug**: tool-schema-contract-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/tool-schema-contract-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/tool-schema-contract-scaffold.notes.md`

## Agentic Routing

- Selected route: local JSON Schema contract scaffold for all 9 registered
  Sprint 1.2 tools.
- Routing reason: all 9 no-live handlers now execute; the next acceptance gap
  is fixed input/output schema IDs, standard response envelope fields, and
  machine-readable error codes.
- Due diligence:
  - P1 map: `deploy/tools/tool-schemas.contract.json`,
    `@aiphabee/tool-registry`, and `scripts/check-tool-schemas-contract.mjs`.
  - P2 trace: registry tool name -> input schema ID and output schema ID ->
    standard envelope fields -> error schema enum -> repo contract checker.
  - P3 decision rationale: add schema artifacts and a deterministic checker
    without changing runtime validation, MCP protocol serving, or frontend.

## Task Breakdown

- [x] Add centralized input/output JSON Schema contract for all 9 registered tools.
- [x] Require standard envelope fields and success/error payload shape.
- [x] Require standard error enum coverage and no arbitrary SQL/URL input properties.
- [x] Add `npm run check:tool-schemas`.
- [x] Add tool schema checker to `npm run check`.
- [x] Update tracker/governance/todos and verify repo checks.
