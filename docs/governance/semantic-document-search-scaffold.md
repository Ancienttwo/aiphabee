# Semantic Document Search Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 15:20 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-semantic-document-search-scaffold.md`
> **Task Contract**: `tasks/contracts/semantic-document-search-scaffold.contract.md`

This slice continues Sprint 2.2 with a backend-only semantic document search
surface. It models pgvector-first announcement/file retrieval without connecting
to live pgvector or emitting SQL.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/document-tools` | Owns document/research tool scaffolds |
| Runtime route | `GET /documents/runtime` | Reports semantic search capability |
| Search route | `POST /documents/search-documents` | Returns ranked document chunks |
| Source corpus | Synthetic announcement sections | Provides sanitized chunk text and metadata |
| Contract | `deploy/documents/search-documents.contract.json` | Guards pgvector-first, no-live posture |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /documents/search-documents` with query and optional
   metadata filters.
2. The Worker normalizes query, categories, date range, document IDs,
   instrument ID, language, min score, and limit.
3. `searchDocuments()` expands synthetic announcement sections into document
   chunks.
4. Each chunk is sanitized before snippet output and scoring text construction.
5. Metadata filters are applied before ranking.
6. Deterministic token overlap produces a synthetic pgvector-style similarity
   score and score explanation.
7. Results are sorted by score, published timestamp, and chunk ID.
8. Each row returns chunk/document/section IDs, sanitized snippet, rank,
   similarity score, source record, and page/paragraph locator.

## P3 Design Decision

Selected a synthetic pgvector scaffold instead of a live pgvector adapter.

Reason:

- PRD §11.4 states pgvector should be the first search substrate and Vectorize
  optional later.
- The repo does not yet have live document ingestion, original document fetch,
  or a provisioned vector table.
- A scaffold can still fix the route, metadata filter contract, result shape,
  and sanitizer boundary before live infrastructure lands.

Tradeoff:

- Semantic retrieval shape is now executable and testable.
- Live recall quality, real embeddings, and DB query plans remain future work.
- Vectorize remains explicitly optional rather than a launch dependency.

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
- local Worker smoke for runtime semantic search capability
- local Worker smoke for top-hit `POST /documents/search-documents`
- `scripts/check-task-workflow.sh --strict`

Observed semantic search behavior:

```json
{
  "toolName": "search_documents",
  "status": "found",
  "search_engine": "synthetic_pgvector_scaffold",
  "index": {
    "pgvector_first": true,
    "vectorize_optional": true,
    "metadata_filter_pushdown": true
  },
  "results": [
    {
      "chunk_id": "doc_ann_00700_20260103_dividend:dividend_timetable",
      "document_id": "doc_ann_00700_20260103_dividend",
      "page": 2,
      "paragraph": 3
    }
  ],
  "live_pgvector": false,
  "sql_emitted": false
}
```

Observed root check residual:

- Root `npm run check` passed all lint/typecheck/test/golden/contract checks,
  including `check:search-documents`, before failing at `@aiphabee/web`
  `vite build` because the current Node runtime does not export
  `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.

## Residual Gaps

- Live pgvector index, embeddings, and SQL execution are not implemented.
- Cloudflare Vectorize is not used.
- Cross-period document diff and numeric extraction are covered separately by
  `docs/governance/announcement-diff-extraction-scaffold.md`.
- Research run save-plan is covered separately by
  `docs/governance/research-run-save-scaffold.md`; replay execution remains open.
- Frontend research-library UI remains delegated.
