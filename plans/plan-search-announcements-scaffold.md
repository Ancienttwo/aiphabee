# Search Announcements Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.2

## Task Breakdown

- [x] Add `@aiphabee/document-tools`.
- [x] Add `searchAnnouncements()` and document runtime capability.
- [x] Add Worker `GET /documents/runtime`.
- [x] Add Worker `POST /documents/search-announcements`.
- [x] Add contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker, traceability ledger, and deferred-goal ledger.

## Scope

This slice covers Sprint 2.2 DOC-01 backend scaffold: announcement search by
company/security, published date, category, keyword, and language. It does not
implement original document excerpt retrieval, pgvector search, cross-period
document diffing, saved research runs, replay, or frontend research-library UI.

## Verification

Required before closeout:

- `npm run check:search-announcements`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /documents/runtime`
- local Worker smoke for `POST /documents/search-announcements`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
