# Field Rights Live Policy Source Readiness Contract

## Source

- PRD: `docs/researches/AiphaBee_PRD_v1.0.md`
- Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- Contract: `deploy/governance/field-rights-live-policy-source.contract.json`

## Acceptance

- `@aiphabee/data-access-gateway` exposes `FIELD_RIGHTS_LIVE_POLICY_SOURCE_VERSION`, `getFieldRightsLivePolicySourceCapabilities()`, and `createFieldRightsLivePolicySourceReadinessReport()`.
- The readiness report compiles partner rights matrix fixture rows plus DB entitlement row snapshots into a Gateway policy.
- Runtime smoke scenarios cover workspace, plan, channel, dataset, field, time range, export, blocked precedence, workspace default-deny, and versioned cache key behavior.
- Worker exposes `GET /gateway/field-rights/live-policy-source/readiness`.
- `GET /gateway/runtime` exposes `field_entitlement_enforcement.live_policy_source_readiness`.
- Signed partner matrix, live DB reads, live partner matrix reads, SQL execution, persistent writes, and frontend rendering remain disabled.

## Verification

- `npm run check:field-rights-live-policy-source`
- `npm run check:traceability-matrix`
- `npm run typecheck --workspace @aiphabee/data-access-gateway`
- `npm run typecheck --workspace @aiphabee/worker`
