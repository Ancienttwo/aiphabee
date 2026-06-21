# Task Contract: Field Rights Runtime Closeout

## Objective

Close the local, repo-verifiable A2 DAT-05 requirement that the Data Access
Gateway runtime crops fields by channel, plan, field, time range, and export
mode.

## Acceptance

- Add `deploy/governance/field-rights-runtime.contract.json`.
- Add `npm run check:field-rights-runtime`.
- Cross-check `deploy/gateway/access.contract.json` keeps default-deny channels,
  entitlement guards, and cache-key dimensions.
- Cross-check field authorization and P0 rights matrix contracts remain no-live.
- Cross-check `packages/data-access-gateway/src/index.ts` contains request,
  evaluator, policy compiler, denial reason, and cache-key evidence.
- Cross-check `packages/data-access-gateway/src/index.test.ts` covers workspace,
  plan, export, time range, default deny, and row-snapshot policy compile.
- Cross-check `apps/worker/src/index.ts` exposes `/gateway/runtime`
  `field_entitlement_enforcement`.
- Update only the A2 local runtime checkbox; keep DAT-05 overall incomplete.

## Out Of Scope

- Partner-signed rights matrix.
- Live partner rights matrix load.
- Live DB entitlement reads.
- Live Serving SQL execution.
- Persistent usage writes.
- Frontend rights operations UI.
