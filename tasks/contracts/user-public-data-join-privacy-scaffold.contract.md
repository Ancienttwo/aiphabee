# User Public Data Join Privacy Scaffold Contract

## Source

- PRD: `docs/researches/AiphaBee_PRD_v1.0.md`
- Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- Contract: `deploy/documents/user-public-data-join-privacy.contract.json`

## Acceptance

- `@aiphabee/document-tools` exposes `getUserPublicDataJoinPrivacyCapabilities()` and `createUserPublicDataJoinPrivacyPlan()`.
- Worker exposes `POST /documents/user-public-data-join/plan`.
- Runtime exposes the capability through `GET /documents/runtime`.
- Raw user file bodies, live upload storage, public data live reads, join execution, SQL, persistent writes, R2 writes, model calls, and frontend rendering remain disabled.
- The planner requires workspace id, file id/hash, user consent, public data scope, field authorization policy, join keys, requested fields, privacy policy, and retention policy before returning `planned_no_write`.
- Custom layout support is metadata-only and workspace-private.

## Verification

- `npm run check:user-public-data-join-privacy`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/document-tools`
- `npm run typecheck --workspace @aiphabee/worker`
