# Document Sanitizer Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 14:45 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-document-sanitizer-scaffold.md`
> **Task Contract**: `tasks/contracts/document-sanitizer-scaffold.contract.md`

This slice continues Sprint 2.2 with backend-only document sanitizer coverage
for announcement excerpts returned by `get_announcement`.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/document-tools` | Owns document/research tool scaffolds |
| Runtime route | `GET /documents/runtime` | Reports document sanitizer capability |
| Applied route | `POST /documents/get-announcement` | Returns sanitized excerpts |
| Contract | `deploy/documents/document-sanitizer.contract.json` | Guards DOC-03 no-tool-invocation posture |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /documents/get-announcement`.
2. The route resolves the synthetic document and requested sections.
3. Each section excerpt is passed through `sanitizeDocumentExcerpt()` before
   any excerpt text is returned.
4. The sanitizer removes script tags, hidden text, comments, visible
   instruction-overrides, visible tool/function invocation requests, and raw
   HTML tags.
5. The returned excerpt is the sanitized text only.
6. Each excerpt includes `removed_items`, `raw_excerpt_returned=false`, and
   `document_instruction_executed=false`.
7. The result includes top-level `sanitization_policy` and
   `sanitization_summary`.
8. The shared standard envelope returns the response; no tool call can be
   authorized by document-origin content.

## P3 Design Decision

Selected an inline sanitizer on the existing excerpt output surface instead of
adding a separate parsing service.

Reason:

- DOC-03 acceptance is about preventing document content from changing
  instruction/tool policy at the point content becomes model-visible.
- `get_announcement` is already the first document-text output surface.
- A separate service would add lifecycle surface without increasing proof for
  the current no-live scaffold.

Tradeoff:

- The backend now has deterministic prompt-injection fixture coverage for
  announcement excerpts.
- Webpage and user-input sanitizer coverage remains separate because those
  surfaces are not part of this backend document-tool slice.
- Live parser, full-document return, and original document fetch remain
  explicitly disabled.

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
- local Worker smoke for runtime sanitizer capability
- local Worker smoke for sanitized `POST /documents/get-announcement`
- `scripts/check-task-workflow.sh --strict`

Observed sanitized excerpt behavior:

```json
{
  "toolName": "get_announcement",
  "status": "found",
  "sanitization_summary": {
    "raw_document_instructions_ignored": true,
    "removed_item_count": 3,
    "sections_sanitized": 1,
    "sections_reviewed": 1
  },
  "excerpts": [
    {
      "section_id": "dividend_timetable",
      "sanitization": {
        "document_instruction_executed": false,
        "raw_excerpt_returned": false,
        "removed_items": ["hidden_text", "script_tag", "suspicious_instruction"],
        "status": "sanitized"
      }
    }
  ]
}
```

Observed root check residual:

- Root `npm run check` passed all lint/typecheck/test/golden/contract checks,
  including `check:document-sanitizer`, before failing at `@aiphabee/web`
  `vite build` because the current Node runtime does not export
  `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.

## Residual Gaps

- Webpage and user-input sanitizer coverage are not implemented.
- Semantic document search is covered by
  `docs/governance/semantic-document-search-scaffold.md`; live pgvector remains
  disabled.
- Cross-period document diff and numeric extraction are covered separately by
  `docs/governance/announcement-diff-extraction-scaffold.md`.
- Research run save/replay planning is covered separately by
  `docs/governance/research-run-save-scaffold.md` and
  `docs/governance/research-run-replay-scaffold.md`; live replay execution remains
  open.
- Frontend research-library UI remains delegated.
