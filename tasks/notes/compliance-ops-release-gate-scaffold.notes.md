# Compliance Ops Release Gate Scaffold Notes

## Implemented

- Added `compliance_ops_release_gate` capability to `@aiphabee/public-ops`.
- Added `createComplianceOpsReleaseGatePlan()` to compose:
  - public docs/status manifests;
  - Agent kill-switch no-live drill;
  - support request_id incident-response drill;
  - local observability `run.audit` export drill.
- Added Worker route `POST /public/release-gates/compliance-ops/plan`.
- Extended `GET /public/runtime` with `compliance_ops_release_gate`.
- Added contract checker `npm run check:compliance-ops-release-gate`.
- Added empty DB scaffold tables:
  - `core.compliance_ops_release_gate`
  - `audit.compliance_ops_drill_event`
  - `governance.compliance_ops_release_gate_contract`

## Evidence

The release gate verifies:

- Type 4 research-boundary copy review exists as a local release check;
- forbidden advice claims are absent from supplied marketing-copy snippets;
- model requests and tool execution are blocked under kill switch;
- safe degradation remains user-visible;
- request_id incident trace uses support operations and public status component source;
- audit export includes required `run.audit` fields and excludes sensitive payload release.

## Non-Claims

External legal/compliance signoff, live flag source, live incident feed, live audit export store, frontend release UI, public launch approval, and live model/tool execution remain absent.

## Commands

- `npm run check:compliance-ops-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/public-ops`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/public-ops/src/index.test.ts apps/worker/src/index.test.ts`
