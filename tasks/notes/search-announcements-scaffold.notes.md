# Search Announcements Scaffold Notes

## Summary

Implemented the Sprint 2.2 backend `search_announcements` scaffold for DOC-01.

## Current State

- `@aiphabee/document-tools` exposes:
  - `getDocumentToolsCapabilities()`
  - `getSearchAnnouncementsCapabilities()`
  - `searchAnnouncements()`
- `GET /documents/runtime` reports the document tool surface.
- `POST /documents/search-announcements` returns a standard envelope with:
  - company/security resolution
  - published date/category/keyword/language filters
  - title, published date, category, language, and summary
  - `document_id`, `source_record_id`, page, anchor, and synthetic locator
  - untrusted document policy metadata
- Ambiguous security queries return `blocked_resolution`.

## Non-Goals

- No `get_announcement` original excerpt retrieval.
- No live original document fetch.
- No pgvector search.
- No cross-period document diff.
- No saved research run persistence or replay.
- No frontend research-library UI.

## Verification

Passed:

- `npm run check:search-announcements`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- `npm run test`
- `npm run test:golden`
- `npm run lint`
- Worker smoke for runtime capability, matching announcement search, and
  ambiguous security blocking
- `scripts/check-task-workflow.sh --strict`

Observed residual:

- Root `npm run check` was run. All lint/typecheck/test/golden/contract checks,
  including `check:search-announcements`, passed before it failed at
  `@aiphabee/web` `vite build` under Node `v22.12.0` because
  `@cloudflare/vite-plugin` requires `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.
