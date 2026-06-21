# Search Announcements Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 13:35 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-search-announcements-scaffold.md`
> **Task Contract**: `tasks/contracts/search-announcements-scaffold.contract.md`

This slice starts Sprint 2.2 with a backend-only `search_announcements`
scaffold. It provides a dedicated document-tool surface for announcement search
instead of reusing the stock workbench aggregate route as the Phase 2 tool.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/document-tools` | Owns document/research tool scaffolds |
| Runtime route | `GET /documents/runtime` | Reports document tool capabilities |
| Search route | `POST /documents/search-announcements` | Returns filtered announcement rows |
| Source tool | `resolve_security` | Resolves company/security query and blocks ambiguity |
| Contract | `deploy/documents/search-announcements.contract.json` | Guards DOC-01 filters, output fields, and no-live posture |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /documents/search-announcements` with `security_query`
   or `instrument_id`, optional date range, categories, keyword, language, and
   limit.
2. If only `security_query` is supplied, `resolve_security` runs first.
3. Ambiguous resolution returns `blocked_resolution`; no candidate is chosen.
4. The package filters synthetic announcement fixtures by:
   - instrument/company
   - `published_at` date range
   - category
   - keyword over title, summary, category, and symbol
   - language
5. Results are sorted newest first and capped by limit.
6. Each row returns title, publication timestamp, category, language, summary,
   `document_id`, `source_record_id`, page, anchor, and synthetic original
   locator.
7. The result marks announcement content as untrusted data and returns through
   the shared standard envelope.

## P3 Design Decision

Selected a dedicated `@aiphabee/document-tools` package over extending the
workbench aggregate package.

Reason:

- Sprint 1.4 workbench announcement search is a stock-workbench section.
- Sprint 2.2 introduces document/research tools that now include dedicated
  excerpt retrieval, sanitizer, semantic search, and diff extraction scaffolds,
  with saved run replay still separate.
- Keeping the document-tool surface separate avoids coupling Phase 2 document
  contracts to the workbench snapshot shape.

Tradeoff:

- DOC-01 is now testable through a dedicated backend tool.
- Synthetic fixtures are duplicated for the scaffold instead of extracting a
  shared storage layer prematurely.
- Live document fetch remains a future slice; semantic search is covered by
  `docs/governance/semantic-document-search-scaffold.md`.

## Verification

Passed:

- `npm run check:search-announcements`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- `npm run test`
- `npm run test:golden`
- `npm run lint`
- local Worker smoke for `GET /documents/runtime`
- local Worker smoke for matching `POST /documents/search-announcements`
- local Worker smoke for ambiguous security blocking
- `scripts/check-task-workflow.sh --strict`

Observed search behavior:

```json
{
  "toolName": "search_announcements",
  "status": "found",
  "filters": {
    "date_basis": "published_at",
    "keyword": "timetable"
  },
  "results": [
    {
      "document_id": "doc_ann_00700_20260103_dividend",
      "category": "dividend",
      "source_record_id": "src_announcement_00700_20260103_dividend",
      "page": 2,
      "anchor": "dividend-timetable"
    }
  ],
  "vector_search": false,
  "original_document_fetch": false
}
```

## Residual Gaps

- `get_announcement` original locator/excerpt retrieval is covered separately by
  `docs/governance/get-announcement-scaffold.md`.
- Semantic document search is covered by
  `docs/governance/semantic-document-search-scaffold.md`; live pgvector remains
  disabled.
- Cross-period document diff and numeric extraction are covered separately by
  `docs/governance/announcement-diff-extraction-scaffold.md`.
- Research run save-plan is covered separately by
  `docs/governance/research-run-save-scaffold.md`; replay execution remains open.
- Frontend research-library UI remains delegated.
