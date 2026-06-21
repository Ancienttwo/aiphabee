# Document Sanitizer Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.2

## Task Breakdown

- [x] Add document sanitizer capability to `@aiphabee/document-tools`.
- [x] Apply sanitizer to `get_announcement` excerpt output.
- [x] Add malicious synthetic document fixture content.
- [x] Add contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker, traceability ledger, and deferred-goal ledger.

## Scope

This slice covers Sprint 2.2 DOC-03 for announcement/document excerpts:
document-origin content is treated as untrusted data, scripts and hidden text
are removed, suspicious document-origin tool instructions are neutralized, and
sanitized excerpts carry audit metadata. It does not implement webpage/user
input sanitizer coverage, live original document fetch, pgvector search,
cross-period document diffing, saved research runs, replay, or frontend UI.

## Verification

Required before closeout:

- `npm run check:document-sanitizer`
- `npm run test -- packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/document-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for sanitized `POST /documents/get-announcement`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
