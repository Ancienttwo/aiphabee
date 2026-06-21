# Semantic Document Search Scaffold Contract

## Objective

Complete the backend-only Sprint 2.2 pgvector/semantic document search scaffold:

- expose a document-chunk semantic search route
- model pgvector-first retrieval behavior
- keep Vectorize optional and not required for launch
- apply metadata filters before ranking
- return sanitized snippets with source locators

## Required Surfaces

- Package: `@aiphabee/document-tools`
- Runtime route: `GET /documents/runtime`
- Search route: `POST /documents/search-documents`
- Contract: `deploy/documents/search-documents.contract.json`
- Checker: `npm run check:search-documents`

## Required Guarantees

- Use standard response envelopes.
- Keep live pgvector disabled in this scaffold.
- Keep SQL emission disabled.
- Keep live data access disabled.
- Keep original document fetch disabled.
- Mark pgvector as the first target architecture.
- Mark Vectorize as optional future optimization.
- Return `chunk_id`, `document_id`, `section_id`, sanitized snippet,
  similarity score, rank, score explanation, source record, and locator fields.
- Return only sanitized snippets.
- Keep frontend rendering disabled.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves semantic top-hit retrieval, metadata filter shape,
  sanitized snippet output, and no live pgvector/SQL use.
- Sprint tracker row is checked only for semantic document search; document
  diffing, saved runs, replay, and frontend UI remain open.
