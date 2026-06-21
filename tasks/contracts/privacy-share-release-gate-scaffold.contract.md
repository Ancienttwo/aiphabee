# Privacy Share Release Gate Scaffold Contract

## Task

Complete Sprint 3.3 §19.4 item: `个人数据发送与保留合规；共享链接不扩权`.

## Authoritative Artifacts

- `packages/sharing-runtime/src/index.ts`
- `apps/worker/src/index.ts`
- `deploy/sharing/privacy-share-release-gate.contract.json`
- `scripts/check-privacy-share-release-gate-contract.mjs`
- `supabase/migrations/20260622000000_privacy_share_release_gate_scaffold.sql`
- `docs/governance/privacy-share-release-gate-scaffold.md`

## Contract

The release gate must prove, locally and without live side effects:

- Personal data download plans require scoped request items, secure delivery, no SQL, and no persistent writes.
- Personal data erasure plans respect retention holds for subscription billing, usage ledger, and audit log scopes.
- Private share link planning rechecks recipient entitlement through the Data Gateway.
- Effective share fields equal the creator/recipient allowed-field intersection.
- Private share links do not expand recipient data rights.
- Private share links require expiry, watermark metadata, no public indexing, and no materialized link handle.

## Non-Claims

The task does not claim live privacy delivery jobs, live retention policy source, live share generation, external legal/privacy signoff, or frontend release UI.

## Verification

- `npm run check:privacy-share-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/sharing-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/sharing-runtime/src/index.test.ts apps/worker/src/index.test.ts`
