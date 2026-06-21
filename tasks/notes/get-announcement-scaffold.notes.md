# Get Announcement Scaffold Notes

## Summary

Implemented the Sprint 2.2 backend `get_announcement` scaffold for DOC-02 /
US-W06.

## Current State

- `@aiphabee/document-tools` exposes:
  - `getAnnouncementCapabilities()`
  - `getAnnouncement()`
- `GET /documents/runtime` now reports both `search_announcements` and
  `get_announcement`.
- `POST /documents/get-announcement` returns a standard envelope with:
  - `document_id` lookup
  - optional section filtering
  - bounded authorized excerpts
  - `document_id`, page, paragraph, anchor, synthetic locator, and
    `source_record_id`
  - source metadata linking back to the announcement row
  - untrusted document policy metadata
- Unknown documents return `not_found` with no fabricated excerpt.
- Unknown requested sections return `section_not_found` with allowed sections.

## Non-Goals

- No live original document fetch.
- No full-document return.
- No complete DOC-03 sanitizer for scripts/hidden text.
- No pgvector search.
- No cross-period document diff.
- No saved research run persistence or replay.
- No frontend research-library UI.

## Verification

Passed:

- `npm run check:search-announcements`
- `npm run check:get-announcement`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- `npm run test`
- `npm run test:golden`
- `npm run lint`
- Worker smoke for runtime capability, found `get_announcement` excerpt, and
  missing-document non-fabrication
- `scripts/check-task-workflow.sh --strict`

Observed residual:

- Root `npm run check` was run. All lint/typecheck/test/golden/contract checks,
  including `check:get-announcement`, passed before it failed at
  `@aiphabee/web` `vite build` under Node `v22.12.0` because
  `@cloudflare/vite-plugin` requires `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.
