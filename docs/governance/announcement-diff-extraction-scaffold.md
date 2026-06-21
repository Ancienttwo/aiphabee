# Announcement Diff Extraction Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 12:54 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-announcement-diff-extraction-scaffold.md`
> **Task Contract**: `tasks/contracts/announcement-diff-extraction-scaffold.contract.md`

This slice continues Sprint 2.2 with a backend-only DOC-04 surface for
cross-period announcement diffing and schema-bound key numeric extraction.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/document-tools` | Owns document/research tool scaffolds |
| Runtime route | `GET /documents/runtime` | Reports diff extraction capability |
| Diff route | `POST /documents/diff-announcements` | Compares two announcement documents |
| Source corpus | Synthetic announcement sections | Provides FY2023/FY2024 numeric facts and locators |
| Contract | `deploy/documents/announcement-diff-extraction.contract.json` | Guards schema/evidence/no-live posture |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /documents/diff-announcements` with
   `base_document_id` and `comparison_document_id`.
2. The Worker normalizes document IDs and optional section filters.
3. `diffAnnouncements()` finds the synthetic announcement documents.
4. Numeric facts are extracted only from matching sections.
5. Each extracted value is emitted with schema fields and a synthetic
   page/paragraph/source locator.
6. Schema validation checks required fields, finite values, and locator/source
   consistency.
7. Matching fields are paired across periods to calculate absolute and percent
   change.
8. The standard envelope returns documents, extracted values, diffs, schema
   validation, trust policy, and usage.

## P3 Design Decision

Selected a schema-bound synthetic extraction scaffold instead of a live parser.

Reason:

- PRD DOC-04 requires extracted values to bind to original locations and pass
  schema validation.
- The repo does not yet have live original document fetch, parser output, or
  replay execution.
- A deterministic scaffold can lock the route, payload shape, validation
  invariant, and source-location binding before live document ingestion lands.

Tradeoff:

- The FY2023/FY2024 revenue and operating-profit diff shape is executable and
  testable now.
- Real PDF/HTML parsing, extraction confidence, parser drift, and review UI are
  still future work.
- Saved run replay and data/model/parameter diffing remain the next
  research-library bottleneck.

## Verification

Passed:

- `npm run check:announcement-diff-extraction`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`

Observed diff behavior:

```json
{
  "toolName": "diff_announcements",
  "status": "found",
  "diff_count": 2,
  "extracted_value_count": 4,
  "schema_validation": {
    "schema_id": "announcement_numeric_extraction_v0",
    "valid": true
  },
  "diffs": [
    {
      "field_id": "revenue",
      "base_value": 609,
      "comparison_value": 660.3,
      "absolute_change": 51.3,
      "percent_change": 0.084236
    }
  ],
  "original_document_fetch": false,
  "sql_emitted": false
}
```

Observed root check residual:

- Root `npm run check` passed all lint/typecheck/test/golden/contract checks,
  including `check:announcement-diff-extraction`, before failing at
  `@aiphabee/web` `vite build` because the current Node runtime does not export
  `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.

## Residual Gaps

- Live original document fetch and parser extraction are not implemented.
- Live pgvector and SQL execution are not used.
- Saved research runs, replay, and old-report immutability are not implemented.
- Frontend research-library UI remains delegated.
