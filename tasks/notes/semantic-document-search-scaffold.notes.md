# Semantic Document Search Scaffold Notes

## Summary

Implemented the Sprint 2.2 backend semantic document search scaffold for the
pgvector-first announcement/file retrieval item.

## Current State

- `@aiphabee/document-tools` exposes:
  - `getSearchDocumentsCapabilities()`
  - `searchDocuments()`
- `GET /documents/runtime` now reports `search_documents`.
- `POST /documents/search-documents` returns a standard envelope with:
  - query text
  - category/date/document/instrument/language/min-score/limit filters
  - synthetic pgvector-style index metadata
  - metadata filter pushdown flag
  - sanitized snippets
  - `chunk_id`, `document_id`, `section_id`, rank, similarity score, score
    explanation, source record, and page/paragraph locator
- `live_pgvector=false`, `sql_emitted=false`, and `original_document_fetch=false`
  remain explicit.

## Non-Goals

- No live pgvector connection.
- No SQL emission or execution.
- No Cloudflare Vectorize use.
- No live original document fetch.
- No cross-period document diff.
- No saved research run persistence or replay.
- No frontend research-library UI.

## Verification

Passed:

- `npm run check:search-documents`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- `npm run test`
- `npm run test:golden`
- `npm run lint`
- Worker smoke for runtime semantic search capability and top-hit
  `search_documents` retrieval
- `scripts/check-task-workflow.sh --strict`

Observed residual:

- Root `npm run check` was run. All lint/typecheck/test/golden/contract checks,
  including `check:search-documents`, passed before it failed at
  `@aiphabee/web` `vite build` under Node `v22.12.0` because
  `@cloudflare/vite-plugin` requires `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.
