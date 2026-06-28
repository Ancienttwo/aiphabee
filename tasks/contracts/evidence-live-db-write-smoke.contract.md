# Task Contract: evidence-live-db-write-smoke

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-evidence-live-db-write-smoke
> **Last Updated**: 2026-06-22 00:00 +08
> **Notes File**:
> `tasks/notes/evidence-live-db-write-smoke.notes.md`

## Goal

Prove a guarded Worker route can write, read, and clean up Evidence/Lineage rows
through Hyperdrive without enabling partner source rows or production evidence
persistence.

## Scope

- In scope:
  - `POST /evidence/records/live-db-smoke` header and token guard;
  - Hyperdrive-backed insert/read/delete smoke for `aiphabee_core.evidence_record` and
    `aiphabee_core.evidence_source_ref`;
  - hash-only response shape;
  - focused Worker tests with mocked `pg`;
  - machine-checkable smoke contract and readiness-ledger integration;
  - tracker, docs, and deferred-ledger updates.
- Out of scope:
  - partner source rows or data-owner signoff;
  - production Evidence service persistence;
  - frontend.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Smoke route rejects missing header, missing token, bad auth, and missing Hyperdrive before writes"
    - "Smoke route inserts, reads, deletes, and commits synthetic evidence rows"
    - "Response contains hashes and counts, not raw evidence/source ids or connection strings"
    - "Readiness ledger moves live_db_writes to a validated surface"
    - "partner_source_rows remains the only Sprint 1.2 readiness blocker"
  commands_succeed:
    - npm run test -- apps/worker/src/evidence-live-db-write-smoke.test.ts
    - npm run check:evidence-live-db-write-smoke
    - npm run check:tool-route-replay-readiness
    - npm run check:tool-route-replay-readiness-fixtures
    - npm run check
    - git diff --check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- Passing this task proves a guarded smoke write path only.
- It does not claim partner source rows or production Evidence service
  persistence.

## Rollback Point

- Revert the commit that adds the guarded Evidence live DB write smoke route,
  contract, tests, readiness v3 update, and tracker/task documentation updates.
