# Task Contract: gate0-signed-evidence-transition-fixtures

> **Status**: Verified
> **Task Profile**: governance fixture check
> **Owner**: Codex
> **Capability ID**: gate0-governance
> **Last Updated**: 2026-06-22
> **Notes File**: `tasks/notes/gate0-signed-evidence-transition-fixtures.notes.md`

## Goal

Prove the Gate 0 signed-evidence manifest transition rules with deterministic
valid and invalid fixtures, without adding or simulating real external
approval evidence in the production manifest.

## Scope

- In scope:
  - reusable validation export from the production manifest checker;
  - in-memory transition fixtures for accepted and invalid manifests;
  - package script and full-check integration;
  - tracker/todos updates preserving pending external evidence state.
- Out of scope:
  - external signatures;
  - legal advice;
  - activating rights;
  - changing the production manifest out of `pending_external_evidence`;
  - frontend changes.

## Files

- `scripts/check-gate0-signed-evidence-manifest-contract.mjs`
- `scripts/check-gate0-signed-evidence-manifest-fixtures.mjs`
- `docs/governance/gate0-signed-evidence-manifest.md`
- `tasks/notes/gate0-signed-evidence-transition-fixtures.notes.md`
- `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- `tasks/todos.md`
- `package.json`

## Exit Criteria

```yaml
exit_criteria:
  valid_fixtures:
    - current_pending_manifest
    - complete_accepted_manifest
  invalid_fixtures:
    - accepted_without_evidence_refs
    - partial_packet_release_flags
    - invalid_sha256_ref
    - approval_status_mismatch
    - unredacted_evidence_ref
    - missing_packet_retains_evidence_ref
  commands_succeed:
    - npm run check:gate0-signed-evidence-manifest
    - npm run check:gate0-signed-evidence-manifest-fixtures
```

## Acceptance Notes

This task is complete when the fixture runner is part of the full repo check
and the production manifest still reports `accepted_packets=0` and
`release_transition_allowed=false`.
