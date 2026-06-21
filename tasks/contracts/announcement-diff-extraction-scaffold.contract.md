# Announcement Diff Extraction Scaffold Contract

## Objective

Complete the backend-only Sprint 2.2 DOC-04 announcement diff and key numeric
extraction scaffold:

- compare two announcement documents across periods
- extract key numeric values into a schema-bound payload
- bind every extracted value to a page/paragraph/source locator
- return deterministic numeric diffs

## Required Surfaces

- Package: `@aiphabee/document-tools`
- Runtime route: `GET /documents/runtime`
- Diff route: `POST /documents/diff-announcements`
- Contract: `deploy/documents/announcement-diff-extraction.contract.json`
- Checker: `npm run check:announcement-diff-extraction`

## Required Guarantees

- Use standard response envelopes.
- Keep live data access disabled.
- Keep live pgvector and SQL emission disabled.
- Keep original document fetch disabled.
- Return `extracted_values` with document/source/section/evidence locator
  metadata.
- Return `schema_validation` with schema id, required fields, validation status,
  and errors.
- Return matched diffs with base/comparison periods, values, absolute change,
  percent change, unit, and both evidence locators.
- Treat document content as untrusted data.
- Keep frontend rendering disabled.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker route proves source-bound FY2023/FY2024 revenue and operating
  profit diff extraction.
- Sprint tracker row is checked only for DOC-04; saved runs, replay, and
  frontend UI remain open.
