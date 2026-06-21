# Private Share Link Scaffold

> **Status**: Verified local scaffold
> **Tracker**: Sprint 3.2 / RES-03 / PRD §19.4
> **Runtime**: `@aiphabee/sharing-runtime`
> **Routes**: `GET /sharing/runtime`, `POST /sharing/private-links/plan`

This slice adds the backend contract for private report/data sharing without
expanding the recipient's data rights. It is intentionally a no-write planning
surface: no link handle is materialized, no artifact is written, and no frontend
sharing UI is enabled.

## Boundary

| Area | Owner | Notes |
|---|---|---|
| Private share planner | `packages/sharing-runtime` | Builds a no-write plan and computes recipient-safe fields |
| Data rights gate | `@aiphabee/data-access-gateway` | Re-evaluates the recipient through `channel=export` |
| Worker route | `apps/worker` | Wraps runtime and plan responses in the shared envelope |
| Contract gate | `deploy/sharing/private-share-link.contract.json` | Locks no-expansion, expiry, watermark, and DB table requirements |
| Database scaffold | `supabase/migrations/20260621124000_private_share_link_scaffold.sql` | Empty private share, audit, and governance tables |
| Frontend | Out of scope | User delegated frontend work to Claude |

## Trace

1. Caller submits creator, recipient, dataset, fields, rows, expiry, and scopes
   to `POST /sharing/private-links/plan`.
2. Worker normalizes snake/camel fields and passes them to
   `createPrivateShareLinkPlan()`.
3. Sharing runtime validates required creator/recipient context and expiry
   limit.
4. Creator and recipient are both checked through
   `createRestrictedExportPlan()` with `exports.read`, `channel=export`, field
   authorization, row bounds, time range, and watermark posture.
5. The released field list is the intersection of creator-allowed and
   recipient-allowed fields.
6. Fields missing from the recipient entitlement are put into `redacted_fields`;
   the plan still reports `recipient_data_rights_expansion=false` and
   `share_expands_recipient_rights=false`.
7. Worker returns a standard success envelope with the plan status, even for
   blocked preflight states, so the UI can display the exact reason.

## Invariants

- A private share link must never expand recipient data rights.
- Recipient entitlement is rechecked at share planning time.
- The creator and recipient both require `exports.read`.
- Expiry is capped at 168 hours.
- Watermark metadata must include request, share ref, creator workspace,
  recipient workspace, dataset, rights policy, and as-of time.
- Link handle materialization, public indexing, artifact writes, live data
  access, SQL, and persistent writes remain disabled.

## Verification

- `npm run typecheck --workspace @aiphabee/sharing-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:private-sharing`
- `npm run check:database`
- `npx vitest run packages/sharing-runtime/src/index.test.ts apps/worker/src/index.test.ts`

## Residual Risk

- This does not create real private URLs or downloadable static artifacts.
- It does not persist audit rows or link records.
- It does not implement frontend sharing controls.
- Partner/legal terms for static report redistribution remain a later Gate 0 /
  GA approval concern.
