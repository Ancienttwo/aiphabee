# Privacy Share Release Gate Scaffold Notes

## Implemented

- Added `privacy_share_release_gate` capability to `@aiphabee/sharing-runtime`.
- Added `createPrivacyShareReleaseGatePlan()` to compose:
  - `createAccountDataRequestPlan()` download and erasure plans.
  - `createPrivateShareLinkPlan()` recipient entitlement recheck and no-expansion plan.
- Added Worker route `POST /sharing/release-gates/privacy-share/plan`.
- Extended `GET /sharing/runtime` with `privacy_share_release_gate`.
- Added contract checker `npm run check:privacy-share-release-gate`.
- Added empty DB scaffold tables:
  - `core.privacy_share_release_gate`
  - `governance.privacy_share_release_gate_contract`

## Evidence

The release gate verifies:

- secure scoped personal-data download delivery remains planned no-write;
- erasure planning retains protected billing, usage ledger, and audit log scopes;
- recipient entitlement is rechecked before private share planning;
- effective fields are the creator/recipient allowed-field intersection;
- recipient rights are not expanded;
- private link remains unmaterialized, non-public, expiring, and watermarked.

## Non-Claims

Live personal-data delivery jobs, live retention-policy source, live share-handle generation, external legal/privacy signoff, and frontend release UI remain absent.

## Commands

- `npm run check:privacy-share-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/sharing-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/sharing-runtime/src/index.test.ts apps/worker/src/index.test.ts`
