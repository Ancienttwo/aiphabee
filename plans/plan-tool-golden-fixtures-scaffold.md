# Plan: Tool Golden Fixtures Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 02:45 +08
> **Slug**: tool-golden-fixtures-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/tool-golden-fixtures-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/tool-golden-fixtures-scaffold.notes.md`

## Agentic Routing

- Selected route: synthetic golden response fixtures for all 9 registered
  Sprint 1.2 tools.
- Routing reason: handler and schema contracts are now present; the next
  acceptance gap is a deterministic tool fixture gate wired into
  `npm run test:golden`.
- Due diligence:
  - P1 map: `tests/golden/tools/manifest.json`, tool fixture files, and
    `scripts/check-golden-regression.mjs`.
  - P2 trace: tool fixture manifest -> fixture JSON -> schema IDs -> expected
    standard envelope -> provenance/usage/toolName/status/liveDataAccess guard.
  - P3 decision rationale: add synthetic response fixtures to the existing
    golden hook without claiming partner-approved production corpus or live
    route replay.

## Task Breakdown

- [x] Add tool golden manifest with one sample per registered tool.
- [x] Add 9 tool expected-response fixtures under `tests/golden/tools`.
- [x] Extend `npm run test:golden` to validate tool fixture shape.
- [x] Update golden README and tracker/governance/todos.
- [x] Verify `npm run test:golden`, `npm run check`, workflow, and safety gates.
