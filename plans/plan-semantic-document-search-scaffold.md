# Semantic Document Search Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.2

## Task Breakdown

- [x] Add `searchDocuments()` to `@aiphabee/document-tools`.
- [x] Add `search_documents` document runtime capability.
- [x] Add Worker `POST /documents/search-documents`.
- [x] Add contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker, traceability ledger, and deferred-goal ledger.

## Scope

This slice covers the Sprint 2.2 pgvector/semantic document search scaffold:
synthetic document chunks are ranked through deterministic pgvector-style
similarity, metadata filters are pushed down before ranking, snippets are
sanitized, and the result shape matches a future pgvector-first retrieval path.
It does not connect to live pgvector, emit SQL, use Vectorize, fetch original
documents, diff filings, persist research runs, replay saved runs, or render
frontend research UI.

## Verification

Required before closeout:

- `npm run check:search-documents`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `POST /documents/search-documents`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
