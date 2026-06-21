# Document Sanitizer Scaffold Notes

## Summary

Implemented the Sprint 2.2 backend document sanitizer scaffold for DOC-03.

## Current State

- `@aiphabee/document-tools` exposes `getDocumentSanitizerCapabilities()`.
- `GET /documents/runtime` now reports `document_sanitizer`.
- `POST /documents/get-announcement` now sanitizes excerpt text before
  returning it.
- Synthetic malicious fixture content covers:
  - `<script>` removal
  - hidden text removal
  - document-origin instruction/tool-call neutralization
- Returned excerpts include:
  - sanitized `excerpt`
  - `sanitization.status`
  - `sanitization.removed_items`
  - `document_instruction_executed=false`
  - `raw_excerpt_returned=false`
- Top-level output includes `sanitization_policy` and `sanitization_summary`.

## Non-Goals

- No webpage sanitizer coverage.
- No user-input sanitizer coverage.
- No live original document fetch.
- No full-document return.
- Semantic document search is covered by the separate
  `semantic-document-search-scaffold` slice; live pgvector remains disabled.
- No cross-period document diff.
- No saved research run persistence or replay.
- No frontend research-library UI.

## Verification

Passed:

- `npm run check:get-announcement`
- `npm run check:document-sanitizer`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- `npm run test`
- `npm run test:golden`
- `npm run lint`
- Worker smoke for runtime sanitizer capability and sanitized
  `get_announcement` excerpt output
- `scripts/check-task-workflow.sh --strict`

Observed residual:

- Root `npm run check` was run. All lint/typecheck/test/golden/contract checks,
  including `check:document-sanitizer`, passed before it failed at
  `@aiphabee/web` `vite build` under Node `v22.12.0` because
  `@cloudflare/vite-plugin` requires `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.
