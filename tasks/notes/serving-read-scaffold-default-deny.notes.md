# Notes: serving-read-scaffold-default-deny

> **Last Updated**: 2026-06-20 18:05 +08
> **Plan**: `plans/plan-serving-read-scaffold-default-deny.md`
> **Runtime Evidence**:
> `docs/governance/serving-read-scaffold-default-deny.md`

## Decisions

- Added a Serving read planner package instead of enabling live SQL reads.
- Attached `servingRead` to Data Access Gateway decisions so policy and read
  posture are evaluated together.
- Kept default-deny and quality-hold as terminal read blockers:
  `liveRead=false`, `servedRows=0`, and `sqlEmitted=false`.
- Kept synthetic allowed reads in `releaseState=held` until real quality-release
  and rights rows exist.
- Exposed Worker `/gateway/runtime` read-planner capability only; no market data
  or external redistribution route is enabled.
- Added a later quality release isolation capability; read planning still keeps
  non-released records blocked before live reads.
- Added a later query planner capability; released snapshot query material is
  planned without SQL or live reads.
- Added a later SQL descriptor capability; statement id and bindings are
  planned without SQL text or execution.
- Added a later SQL text compiler capability; fixed SQL text is planned without
  execution.

## Verification

- Passed: `npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts`
- Passed: `npm run typecheck`
- Passed: `npm run check:data-gateway`
- Passed: `npm run test`
- Passed: `npm run check`
- Passed: Wrangler smoke for `/gateway/runtime` read planner capability.
- Passed: `scripts/check-task-workflow.sh --strict`.

## Residual Blockers

- Live Supabase/Hyperdrive Serving reads are absent.
- Partner-approved data loading is absent.
- Persistent quality-release jobs and Serving snapshot mutation are absent.
- Query planning, SQL descriptor planning, and SQL text planning exist, but
  live Serving SQL execution is absent.
- Field entitlement live DB policy source is not wired.
- Usage ledger live writes and billing reconciliation are not wired.
