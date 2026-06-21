# Search Announcements Scaffold Contract

## Objective

Complete the backend-only Sprint 2.2 DOC-01 announcement search scaffold:

- search by company/security
- search by published date range
- search by category
- search by keyword
- return visible title/date/category/language/summary rows

## Required Surfaces

- Package: `@aiphabee/document-tools`
- Runtime route: `GET /documents/runtime`
- Search route: `POST /documents/search-announcements`
- Contract: `deploy/documents/search-announcements.contract.json`
- Checker: `npm run check:search-announcements`

## Required Guarantees

- Use standard response envelopes.
- Reuse `resolve_security`.
- Block ambiguous security resolution without choosing a candidate.
- Keep live data access disabled.
- Keep SQL emission disabled.
- Keep vector search disabled.
- Keep original document fetch disabled.
- Return `document_id`, `source_record_id`, page, anchor, title, published date,
  category, language, and summary.
- Mark announcement content as untrusted data.
- Keep frontend rendering disabled.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves runtime capability, matching search, and ambiguous
  security blocking.
- Sprint tracker row is checked only for DOC-01; original excerpt retrieval,
  pgvector search, document diffing, saved runs, replay, and frontend UI remain
  open.
