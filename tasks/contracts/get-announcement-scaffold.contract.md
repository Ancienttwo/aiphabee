# Get Announcement Scaffold Contract

## Objective

Complete the backend-only Sprint 2.2 DOC-02 announcement excerpt scaffold:

- retrieve announcement metadata by `document_id`
- return only authorized excerpts
- support optional section selection
- bind each excerpt to page, paragraph, and source-record location
- keep full original document fetch disabled

## Required Surfaces

- Package: `@aiphabee/document-tools`
- Runtime route: `GET /documents/runtime`
- Excerpt route: `POST /documents/get-announcement`
- Contract: `deploy/documents/get-announcement.contract.json`
- Checker: `npm run check:get-announcement`

## Required Guarantees

- Use standard response envelopes.
- Require `document_id`; never fabricate unknown documents.
- Return `document_id`, source metadata, allowed sections, excerpts, and
  evidence locators.
- Each excerpt must include page, paragraph, anchor, source_record_id, and
  synthetic original locator.
- Cap excerpts to the authorized length.
- Keep full-document return disabled.
- Keep live data access disabled.
- Keep SQL emission disabled.
- Keep vector search disabled.
- Keep original document fetch disabled.
- Mark document content as untrusted data.
- Keep frontend rendering disabled.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves found excerpt, page/paragraph/source locator, and
  missing-document non-fabrication.
- Sprint tracker row is checked only for DOC-02; full DOC-03 sanitizer,
  pgvector search, document diffing, saved runs, replay, and frontend UI remain
  open.
