# Implementation Notes: activate-entitlement-gated-netquity-resolution-through-private-web-rpc

> **Status**: Complete
> **Plan**: plans/plan-20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.md
> **Contract**: tasks/contracts/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.contract.md
> **Review**: tasks/reviews/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.review.md
> **Last Updated**: 2026-07-11 07:06
> **Lifecycle**: notes

## Design Decisions

- Web accepts only `query` and optional `market`; Better Auth session lookup
  completes before the staging service binding is read.
- The named `AuthenticatedNetquityResolver` has no HTTP route. It maps only an
  exact canonical subject through a locked SECURITY DEFINER function, sets the
  request-local RLS account claim, and requires exactly one active context.
- Rights are pinned to the active product-access policy version. Runtime rejects
  wildcard or unexpected field rows, requires all 13 explicit fields, and then
  applies the shared Gateway evaluator.
- Serving authority is pinned across dataset, snapshot, and data-version policy
  versions, plus approved default rights, released state, and PASS quality.
- Exact alias containment uses the partial
  `serving_record_security_aliases_gin_idx`; live `EXPLAIN (ANALYZE)` showed a
  Bitmap Index Scan on that index.
- The Web RPC response boundary rejects any success without
  `liveDataAccess=true`, complete live schema, version-consistent Netquity
  provenance, and matching envelope metadata.
- The provisioning replay path preserves blocked/default-deny rows instead of
  reactivating an operator revocation.

## Deviations From Plan Or Spec

- No production or public live route was introduced.
- Live browser acceptance used a temporary database session row for the one
  verified Better Auth user. It exercised the deployed session -> TanStack
  server function -> named RPC -> RLS/rights -> Serving path, then deleted all
  temporary sessions and the acceptance Worker. No bootstrap path was added to
  product code.
- Rapid sequential operator acceptance calls temporarily exhausted the shared
  admin connection slots and returned fail-closed `500`; product traffic makes
  one RPC per search. This confirms the plan's stated 10x bottleneck without
  weakening authorization.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Public HTTP forwarding | Rejected | Would expose identity-bearing authority on a public route. |
| Caller workspace selection | Rejected | Multi-workspace product semantics are not defined; ambiguity returns 409. |
| Wildcard field rights | Rejected at runtime and provisioning | Future fields must not inherit authorization. |
| Latest released snapshot without policy pin | Rejected | Dataset, snapshot, data-version, and entitlement policy must form one chain. |

## Open Questions

- None.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Live API deployment: `db4e9458-2008-439b-8edd-955ab057a57e` / `dc29656e-0310-4879-8ccb-81057dde58d6`.
- Live Web deployment: `9f0e7e85-950d-4afb-beb1-abaf1674b222` / `102464b3-446b-4dd5-8b45-d69df3b5bbb5` (latest secret-only deployment retaining the reviewed code).
- DB readback: one subject function, one mapped account, 13 approved Web fields,
  zero approved non-Web fields, runtime EXECUTE true, auth schema USAGE false.
- Live RPC: code, English, Traditional Chinese, and Simplified Chinese each
  returned one Netquity candidate; unmapped/no membership/expired/no rights/
  blocked/ambiguous paths denied and temporary fixture count returned zero.
- Authenticated browser: the deployed server function returned `200` and
  navigated to the resolved stock; unauthenticated search returned `401` and
  stayed on `/stock`. Temporary session count returned zero.
- Alias index readback: Bitmap Index Scan on
  `serving_record_security_aliases_gin_idx`, execution time `0.766ms` for the
  live exact-alias plan.
- Final smoke at `2026-07-10T23:19:40.495Z`: six of six isolation checks passed.
- Targeted verification: 107 tests passed; full suite 1078 passed / 3 skipped;
  Web/Worker/root typecheck, database, binding, contract, 10 negative fixtures,
  build artifact, and diff checks passed.

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- Promote to `docs/researches/` only when it is durable repo knowledge with evidence.
- Promote to harness asset files only after verification across more than one task or fixture.
