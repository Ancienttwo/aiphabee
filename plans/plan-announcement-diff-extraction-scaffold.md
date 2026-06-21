# Announcement Diff Extraction Scaffold Plan

## Objective

Complete the backend-only Sprint 2.2 DOC-04 scaffold for cross-period
announcement differences and key numeric extraction.

## Boundary

- Package: `@aiphabee/document-tools`
- Runtime route: `GET /documents/runtime`
- Diff route: `POST /documents/diff-announcements`
- Contract: `deploy/documents/announcement-diff-extraction.contract.json`
- Checker: `npm run check:announcement-diff-extraction`
- Frontend: out of scope; user delegated frontend work to Claude

## Task Breakdown

- [x] Add synthetic comparable announcement fixtures for FY2023 and FY2024
- [x] Extract key numeric values with schema fields and source locators
- [x] Compare matched numeric fields across periods
- [x] Expose Worker route with standard response envelope
- [x] Add contract JSON and checker
- [x] Add package and Worker tests
- [x] Update tracker, governance, and notes

## Non-Goals

- No live original document fetch
- No live document parser
- No live pgvector or SQL execution
- No saved research run persistence or replay
- No frontend research library UI
