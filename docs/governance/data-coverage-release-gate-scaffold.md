# Data Coverage Release Gate Scaffold

> **Status**: Backend scaffold
> **Last Updated**: 2026-06-21 22:05 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/data-coverage-release-gate-scaffold.contract.md`

This slice completes the backend-only Sprint 3.3 §19.1 scaffold for freshness
labels and coverage release checks. It proves the release checklist has slots
for realtime, delayed, EOD, corporate actions, financial restatements,
delistings, and identifier history without claiming live partner rows or final
data quality signoff.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/data-access-gateway` | Owns release-gate reporting for cross-domain data access readiness |
| Runtime route | `GET /gateway/runtime` | Reports nested `data_coverage_release_gate` readiness |
| Release route | `GET /gateway/data-coverage/release-gate` | Returns freshness markers, coverage domains, validation, and blocker state |
| Contract | `deploy/gateway/data-coverage-release-gate.contract.json` | Guards freshness tiers, coverage domains, no-live boundaries, and blockers |
| Schema scaffold | `core.data_coverage_release_gate`, `governance.data_coverage_release_gate_contract` | Empty future release-gate persistence tables |
| Existing evidence surfaces | Quote/price, corporate action, financial facts, and security history tools | Remain no-live/synthetic or schema-backed scaffolds |
| External dependency | Partner coverage files, live freshness policy, golden signoff | Explicitly absent; release gate remains blocked |

## P2 Concrete Trace

1. Caller requests `GET /gateway/data-coverage/release-gate`.
2. Worker calls `createDataCoverageReleaseGateReport()` with the local scaffold
   coverage policy version.
3. Gateway returns three freshness markers: `realtime`, `delayed`, and `eod`.
4. Gateway returns four coverage domains: `corporate_actions`,
   `financial_restatements`, `delistings`, and `identifier_history`.
5. Each entry reports `live_partner_rows_loaded=false` and keeps the release
   state blocked.
6. Standard response metadata records the gateway source and rows equal to the
   number of freshness plus coverage entries.

## P3 Design Decision

Selected a release-gate report instead of widening individual tool handlers.

Reason:

- PRD §19.1 is a release checklist requirement across multiple data domains.
- Existing quote, price, corporate action, financial restatement, and security
  history surfaces already expose no-live scaffolds.
- The missing boundary is a single publishable gate showing which required
  freshness and coverage categories are explicitly present and why GA remains
  blocked.

Tradeoff:

- The release checklist can now prove the required metadata categories and
  blocker names.
- Real partner coverage files, live freshness policy, and golden signoff remain
  separate future slices.

## Verification

Run the focused gate:

- `npm run check:data-coverage-release-gate`
- `npm run check:database`
- `npx vitest run packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/data-access-gateway`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/data-access-gateway`
- `npm run build --workspace @aiphabee/worker`
