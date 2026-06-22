# Task Contract: gate0-external-evidence-intake

> **Status**: Verified
> **Task Profile**: governance contract
> **Owner**: Codex
> **Capability ID**: gate0-governance
> **Last Updated**: 2026-06-22
> **Notes File**: `tasks/notes/gate0-external-evidence-intake.notes.md`

## Goal

Make Sprint 0.1 external approval intake machine-checkable without claiming
the external approvals are complete.

## Scope

- In scope:
  - external evidence intake contract;
  - checker script and package command;
  - governance documentation;
  - tracker/todos updates preserving pending approval state.
- Out of scope:
  - legal advice;
  - partner negotiation;
  - signing evidence;
  - live rights activation;
  - frontend changes.

## Files

- `deploy/governance/gate0-external-evidence-intake.contract.json`
- `scripts/check-gate0-external-evidence-intake-contract.mjs`
- `docs/governance/gate0-external-evidence-intake.md`
- `tasks/notes/gate0-external-evidence-intake.notes.md`
- `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- `tasks/todos.md`
- `package.json`

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - deploy/governance/gate0-external-evidence-intake.contract.json
    - scripts/check-gate0-external-evidence-intake-contract.mjs
    - docs/governance/gate0-external-evidence-intake.md
    - tasks/notes/gate0-external-evidence-intake.notes.md
  content_checks:
    - "Contract covers all 11 PRD 14.1 rights dimensions"
    - "Contract records six external evidence packets"
    - "Contract keeps external approval flags false"
    - "Contract preserves DEFAULT_DENY for unconfirmed rights"
    - "Package exposes check:gate0-external-evidence-intake"
  commands_succeed:
    - npm run check:gate0-external-evidence-intake
    - npm run check:traceability-matrix
```

## Acceptance Notes

This task is complete when the intake surface is executable and Sprint 0.1
external approvals remain explicitly pending. It does not mark Gate 0 green.
