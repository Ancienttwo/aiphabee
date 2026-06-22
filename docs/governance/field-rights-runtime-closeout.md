# Field Rights Runtime Closeout

> **Status**: Verified local runtime closeout
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/field-rights-runtime-closeout.contract.md`

This slice closes the repo-verifiable part of A2 DAT-05: field rights are wired
into the Data Access Gateway runtime path and can crop data by workspace, plan,
channel, dataset, field, time range, and export mode. It keeps live partner
rights matrix loading, live DB entitlement reads, live Serving SQL execution,
usage writes, and frontend ops UI out of scope.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Gateway evaluator | `packages/data-access-gateway` | Computes allow/redaction/deny decisions before serving plans |
| Policy compiler | `createPolicyFromEntitlementRows()` | Compiles row snapshots into Gateway policy without SQL or live reads |
| Runtime route | `GET /gateway/runtime` | Reports field entitlement dimensions and policy-source capability |
| Access route | `POST /gateway/access-check` | Exercises Gateway decisions under default-deny local policy |
| Governance contract | `deploy/governance/field-rights-runtime.contract.json` | Cross-checks source, tests, runtime route, and tracker sync |
| Live rights source | Not claimed | No partner-signed matrix, live DB reads, or production Serving reads |

## P2 Concrete Trace

1. A request enters `evaluateDataAccessRequest()` with channel, plan, dataset,
   requested fields, workspace, optional time range, and export mode.
2. Gateway checks channel status and per-field policy before building serving
   plans.
3. `evaluateWorkspaceEntitlement()` matches workspace, plan, dataset, channel,
   and field pattern. Blocked rows win before approved rows.
4. Approved entitlement rows can still block export or over-wide time windows.
5. Allowed fields are the only fields passed into serving read/query/sql plans,
   usage preview, serving result envelope, and cache key material.
6. `createPolicyFromEntitlementRows()` proves the intended DB row shape can
   compile into this runtime policy, but it is still a row-snapshot compiler.
7. `/gateway/runtime` exposes `field_entitlement_enforcement` with the seven
   required dimensions and `live_policy_source=false`.

## P3 Design Decision

Selected a cross-cutting governance gate instead of changing evaluator behavior.

Reason:

- The evaluator, worker runtime route, entitlement row compiler, and tests
  already express the A2 runtime crop path.
- The remaining DAT-05 blockers are external/live: partner rights matrix,
  production entitlement reads, and live Serving reads.
- Changing runtime semantics here would risk weakening default-deny behavior
  without any new trusted policy source.

Tradeoff:

- A2 can be checked for the local runtime path.
- DAT-05 is completed in the traceability matrix only after the separate
  `field-rights-live-policy-source-readiness` gate exists.

## Verification

Required:

- `npm run check:field-rights-runtime`
- `npm run check:data-gateway`
- `npm run check:field-authorization-config`
- `npm run check:p0-rights-matrix-coverage`
- `npm run test -- packages/data-access-gateway`
- `npm run check`

## Residual Gaps

- Partner-signed field rights matrix is absent.
- Live DB entitlement reads are absent.
- Live Serving SQL execution and reads are absent.
- Persistent usage writes and billing reconciliation remain disabled.
- Frontend rights operations UI is not part of this slice.
