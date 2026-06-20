# Task Contract: tool-golden-fixtures-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-tool-golden-fixtures-scaffold.md`
> **Task Profile**: tests-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-tool-golden-fixtures
> **Last Updated**: 2026-06-21 02:45 +08
> **Notes File**:
> `tasks/notes/tool-golden-fixtures-scaffold.notes.md`

## Goal

Add executable synthetic golden fixtures for every registered Sprint 1.2 tool
and wire them into the existing `npm run test:golden` gate.

## Scope

- In scope:
  - `tests/golden/tools/manifest.json`;
  - one tool response fixture for each registered tool;
  - schema ID checks for each fixture;
  - expected standard envelope fields;
  - provenance and usage checks;
  - `toolName`, `status`, and `liveDataAccess=false` checks;
  - `scripts/check-golden-regression.mjs` extension;
  - tracker/governance updates.
- Out of scope:
  - partner-approved production golden corpus;
  - live HTTP replay of tool routes;
  - full JSON Schema validation of fixture payloads;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/tool-golden-fixtures-scaffold.md
  - plans/plan-tool-golden-fixtures-scaffold.md
  - scripts/check-golden-regression.mjs
  - tasks/contracts/tool-golden-fixtures-scaffold.contract.md
  - tasks/notes/tool-golden-fixtures-scaffold.notes.md
  - tasks/todos.md
  - tests/golden/README.md
  - tests/golden/tools/**
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Tool golden manifest includes all 9 registered tools"
    - "Each tool fixture declares input/output schema IDs"
    - "Each expected response includes standard envelope fields"
    - "Each expected response has non-empty provenance and usage"
    - "Each expected response data payload has matching toolName, expected status, and liveDataAccess=false"
    - "No partner-approved corpus, live route replay, full JSON Schema validation, or frontend changes are claimed"
  commands_succeed:
    - npm run test:golden
    - npm run check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task completes synthetic tool golden fixture coverage only.
- Production partner corpus approval remains an external Gate 0 / Sprint 0.3
  blocker.

## Rollback Point

- Revert the commit that adds `tests/golden/tools`, the golden checker
  extension, README update, and tracker/governance changes.
