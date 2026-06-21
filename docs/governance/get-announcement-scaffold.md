# Get Announcement Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 14:15 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-get-announcement-scaffold.md`
> **Task Contract**: `tasks/contracts/get-announcement-scaffold.contract.md`

This slice continues Sprint 2.2 with a backend-only `get_announcement`
scaffold. It gives search results a follow-up route that can return bounded
authorized excerpts with concrete source positions.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/document-tools` | Owns document/research tool scaffolds |
| Runtime route | `GET /documents/runtime` | Reports search and excerpt capabilities |
| Excerpt route | `POST /documents/get-announcement` | Returns authorized excerpts by `document_id` |
| Source tool | `search_announcements` | Produces `document_id` values for excerpt lookup |
| Contract | `deploy/documents/get-announcement.contract.json` | Guards DOC-02 locator, excerpt, and no-live posture |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /documents/get-announcement` with `document_id`,
   optional `sections`, and optional `max_excerpt_chars`.
2. The Worker normalizes snake_case/camelCase inputs and calls
   `getAnnouncement()`.
3. Unknown or missing documents return `not_found`; no synthetic excerpt is
   fabricated.
4. Known documents expose an allowlist of section IDs.
5. If sections are supplied, only matching allowlisted sections are returned.
   Unknown sections return `section_not_found`.
6. Each returned excerpt is capped by the authorized excerpt length.
7. Each excerpt carries `document_id`, page, paragraph, anchor,
   `source_record_id`, and a synthetic original locator.
8. The result marks document content as untrusted data and returns through the
   shared standard envelope.

## P3 Design Decision

Selected an excerpt allowlist scaffold instead of simulated full-document fetch.

Reason:

- DOC-02 acceptance is source positioning and authorized excerpt retrieval.
- Returning full original text would imply rights, storage, parser, and
  sanitizer surfaces that are not yet implemented.
- The scaffold must be useful for citation tests without pretending live
  document ingestion exists.

Tradeoff:

- Citation location can now be tested end to end from search result
  `document_id` to page/paragraph/source record.
- The excerpt corpus is synthetic and bounded.
- DOC-03 announcement-excerpt sanitization is covered by
  `docs/governance/document-sanitizer-scaffold.md`.

## Verification

Passed:

- `npm run check:search-announcements`
- `npm run check:get-announcement`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- `npm run test`
- `npm run test:golden`
- `npm run lint`
- local Worker smoke for `GET /documents/runtime`
- local Worker smoke for found `POST /documents/get-announcement`
- local Worker smoke for missing-document non-fabrication
- `scripts/check-task-workflow.sh --strict`

Observed excerpt behavior:

```json
{
  "toolName": "get_announcement",
  "status": "found",
  "document_id": "doc_ann_00700_20260103_dividend",
  "excerpts": [
    {
      "section_id": "dividend_timetable",
      "page": 2,
      "paragraph": 3,
      "source_record_id": "src_announcement_00700_20260103_dividend"
    }
  ],
  "full_document_returned": false,
  "original_document_fetch": false
}
```

Observed root check residual:

- Root `npm run check` passed all lint/typecheck/test/golden/contract checks,
  including `check:get-announcement`, before failing at `@aiphabee/web`
  `vite build` because the current Node runtime does not export
  `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.

## Residual Gaps

- Webpage and user-input sanitizer coverage are not implemented.
- Semantic document search is covered by
  `docs/governance/semantic-document-search-scaffold.md`; live pgvector remains
  disabled.
- Cross-period document diff and numeric extraction are not implemented.
- Saved research runs and replay are not implemented.
- Frontend research-library UI remains delegated.
