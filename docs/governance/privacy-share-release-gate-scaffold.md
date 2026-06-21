# Privacy Share Release Gate Scaffold

## Scope

This scaffold covers the Sprint 3.3 §19.4 release gate for personal data delivery/retention controls and private sharing no-expansion semantics.

It composes existing local planners instead of introducing a new rights model:

- `@aiphabee/account-runtime` `createAccountDataRequestPlan()` for scoped download delivery, erasure planning, retention holds, audit metadata, and no-write behavior.
- `@aiphabee/sharing-runtime` `createPrivateShareLinkPlan()` for recipient entitlement recheck, effective-field intersection, recipient redaction, expiry, watermark, private visibility, and no rights expansion.

## Runtime Surface

- Runtime: `GET /sharing/runtime`
- Release gate route: `POST /sharing/release-gates/privacy-share/plan`
- Linked routes:
  - `POST /account/data-requests/plan`
  - `POST /sharing/private-links/plan`

The release gate response uses the standard response envelope and returns:

- `account_data_request_gate.download_plan`
- `account_data_request_gate.delete_plan`
- `private_share_gate.plan`
- `private_share_gate.no_expansion_policy`
- `release_checks`
- `release_gate`
- `validation`

## Release Checks

- `personal_data_download_delivery_is_scoped_and_no_write`
- `personal_data_delete_respects_retention_holds`
- `share_link_rechecks_recipient_entitlement`
- `share_link_effective_fields_are_intersection`
- `share_link_does_not_expand_rights`
- `private_link_has_expiry_watermark_and_no_public_index`

## Non-Claims

This scaffold does not enable live personal data export, live erasure jobs, live share handle generation, DB writes, public indexing, frontend release UI, or external privacy/legal signoff.

`release_gate.gate_status` remains `blocked_live_privacy_share_validation` until live delivery, retention source, share generation, frontend UI, and legal/privacy signoff evidence exist.

## Verification

- `npm run check:privacy-share-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/sharing-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/sharing-runtime/src/index.test.ts apps/worker/src/index.test.ts`
