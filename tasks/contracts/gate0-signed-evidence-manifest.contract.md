# Task Contract: gate0-signed-evidence-manifest

> **Status**: Verified
> **Task Profile**: governance contract
> **Owner**: Codex
> **Capability ID**: gate0-governance
> **Last Updated**: 2026-06-22
> **Notes File**: `tasks/notes/gate0-signed-evidence-manifest.notes.md`

## Goal

Create a machine-checkable manifest for applying signed Gate 0 evidence without
storing raw legal, commercial, privacy, or credential material in repo.

## Scope

- In scope:
  - signed evidence manifest contract;
  - checker for packet transition rules;
  - governance documentation;
  - tracker/todos updates preserving pending external evidence state.
- Out of scope:
  - actual external signatures;
  - legal advice;
  - rights activation;
  - live data exposure;
  - frontend changes.

## Files

- `deploy/governance/gate0-signed-evidence-manifest.contract.json`
- `scripts/check-gate0-signed-evidence-manifest-contract.mjs`
- `docs/governance/gate0-signed-evidence-manifest.md`
- `tasks/notes/gate0-signed-evidence-manifest.notes.md`
- `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- `tasks/todos.md`
- `package.json`

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - deploy/governance/gate0-signed-evidence-manifest.contract.json
    - scripts/check-gate0-signed-evidence-manifest-contract.mjs
    - docs/governance/gate0-signed-evidence-manifest.md
    - tasks/notes/gate0-signed-evidence-manifest.notes.md
  content_checks:
    - "Manifest contains all six Gate 0 evidence packets"
    - "Manifest keeps external_approvals_complete=false while packets are missing"
    - "Checker rejects accepted packets without evidence refs"
    - "Checker requires SHA-256 and redacted_no_secrets refs"
    - "Package exposes check:gate0-signed-evidence-manifest"
  commands_succeed:
    - npm run check:gate0-signed-evidence-manifest
    - npm run check:gate0-external-evidence-intake
```

## Acceptance Notes

This task is complete when the manifest is executable and still proves that
Gate 0 remains pending. It does not mark Sprint 0.1 external approvals
complete.
