# Get Announcement Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.2

## Task Breakdown

- [x] Add `getAnnouncement()` to `@aiphabee/document-tools`.
- [x] Add `get_announcement` document runtime capability.
- [x] Add Worker `POST /documents/get-announcement`.
- [x] Add contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker, traceability ledger, and deferred-goal ledger.

## Scope

This slice covers Sprint 2.2 DOC-02 / US-W06 backend scaffold: retrieve
authorized announcement excerpts by `document_id` and optional section list,
with page, paragraph, source-record, and synthetic locator metadata. It does
not implement live original document fetch, full-document return, pgvector
search, cross-period document diffing, saved research runs, replay, or frontend
research-library UI.

## Verification

Required before closeout:

- `npm run check:get-announcement`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `POST /documents/get-announcement`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
