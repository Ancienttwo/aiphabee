# Document Sanitizer Scaffold Contract

## Objective

Complete the backend-only Sprint 2.2 DOC-03 announcement/document sanitizer
scaffold:

- treat document content as untrusted data
- remove script tags before returning excerpts
- remove hidden text before returning excerpts
- neutralize document-origin tool/system-instruction attempts
- prove sanitized output cannot trigger tool invocation

## Required Surfaces

- Package: `@aiphabee/document-tools`
- Runtime route: `GET /documents/runtime`
- Applied route: `POST /documents/get-announcement`
- Contract: `deploy/documents/document-sanitizer.contract.json`
- Checker: `npm run check:document-sanitizer`

## Required Guarantees

- Use standard response envelopes.
- Keep live data access disabled.
- Keep SQL emission disabled.
- Keep vector search disabled.
- Keep original document fetch disabled.
- Keep document-origin tool invocation disabled.
- Return only sanitized excerpts.
- Never return raw HTML/script/hidden text in `excerpt`.
- Mark `document_instruction_executed=false`.
- Return per-excerpt `removed_items` and top-level `sanitization_summary`.
- Keep frontend rendering disabled.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves sanitized excerpt output and no document-origin tool
  execution.
- Sprint tracker row is checked only for announcement/document DOC-03; webpage
  and user-input sanitizer coverage remains in the global A3 track.
