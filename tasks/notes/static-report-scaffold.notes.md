# static-report-scaffold Notes

## Decision

Implement RES-04 as a standalone static report artifact planner inside
`@aiphabee/research-runtime`, separate from the existing deep report Workflow.
Deep reports already have static-report metadata, but Sprint 3.2 needs a direct
contract for allowed-scope static report publication.

## Current Slice

- Added `createStaticReportPlan()`.
- Added `getStaticReportCapabilities()`.
- Added `POST /research/reports/static/plan`.
- Added `static_report_artifact` to `GET /research/runtime`.
- Added `deploy/research/static-report.contract.json`.
- Added `npm run check:static-report`.
- Added empty DB scaffold tables:
  - `core.static_report_artifact`
  - `audit.static_report_event`
  - `governance.static_report_contract`

## Verification Focus

- Metadata includes generated time, data delay, data version, methodology
  version, rights policy version, and disclaimer.
- Missing `exports.read` blocks the plan.
- Invalid/missing metadata blocks the plan.
- Artifact writes, persistent writes, frontend, live data access, live tool
  execution, and model calls remain disabled.

## Remaining Work

- Real report rendering and storage.
- Live rights-policy lookup.
- Download/view UI delegated to Claude.
