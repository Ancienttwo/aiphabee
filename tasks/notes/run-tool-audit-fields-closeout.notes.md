# Run/Tool Audit Fields Closeout Notes

## Scope

- Closed A5 local audit-field completeness for `run.audit` and planned/denied
  tool-call audit records.
- Reused Agent runtime `run_context` as the source of truth for user,
  workspace, model dry-run state, and tool versions.
- Kept prompt/content and secret-like values out of telemetry.

## Evidence

- `deploy/governance/run-tool-audit-fields.contract.json`
- `deploy/observability/events.contract.json`
- `scripts/check-run-tool-audit-fields-contract.mjs`
- `packages/observability/src/index.ts`
- `apps/worker/src/index.ts`
- `packages/observability/src/index.test.ts`
- `apps/worker/src/index.test.ts`

## Verification

- `npm run check:run-tool-audit-fields`
- `npm run check:observability`
- `npm run test -- packages/observability apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/observability`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check`

## Not Claimed

- Live AI Gateway request/cost/fallback logs.
- Real model execution or streaming.
- Actual tool execution.
- Persistent audit store.
- Frontend Ask rendering.
