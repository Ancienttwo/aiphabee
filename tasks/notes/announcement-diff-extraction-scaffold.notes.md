# Announcement Diff Extraction Scaffold Notes

## Summary

Implemented the Sprint 2.2 backend DOC-04 `diff_announcements` scaffold for
cross-period announcement differences and schema-bound key numeric extraction.

## Current State

- `@aiphabee/document-tools` exposes:
  - `getDiffAnnouncementsCapabilities()`
  - `diffAnnouncements()`
- `GET /documents/runtime` now reports `diff_announcements`.
- `POST /documents/diff-announcements` returns a standard envelope with:
  - base/comparison document metadata
  - schema-bound `extracted_values`
  - `schema_validation` for `announcement_numeric_extraction_v0`
  - revenue and operating-profit diffs
  - page/paragraph/source locators for every extracted value and diff side
- The synthetic corpus now includes comparable Tencent FY2023 and FY2024 annual
  results fixtures.
- `live_data_access=false`, `original_document_fetch=false`,
  `live_pgvector=false`, and `sql_emitted=false` remain explicit.

## Non-Goals

- No live original document fetch.
- No live PDF/HTML parser.
- No live pgvector or SQL execution.
- No saved research run persistence or replay.
- No frontend research-library UI.

## Verification

Passed:

- `npm run check:announcement-diff-extraction`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`

Observed residual:

- Root `npm run check` passed all lint/typecheck/test/golden/contract checks,
  including `check:announcement-diff-extraction`, before it failed at
  `@aiphabee/web` `vite build` under the current Node runtime because
  `node:module.registerHooks` is unavailable.
- No `apps/web` files were changed in this backend slice.
