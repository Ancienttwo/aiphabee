# Task Contract: static-report-scaffold

> **Sprint**: 3.2
> **PRD Trace**: RES-04
> **Capability ID**: sprint32-static-report

## Objective

Create a backend-only scaffold for allowed-scope static reports that always
includes generated time, data delay, version metadata, and disclaimer.

## Acceptance Evidence

- `@aiphabee/research-runtime` exposes:
  - `getStaticReportCapabilities()`
  - `createStaticReportPlan()`
- Worker exposes `POST /research/reports/static/plan`.
- `GET /research/runtime` reports `static_report_artifact`.
- Static report plans require:
  - `generated_at`
  - `data_delay_minutes`
  - `data_version`
  - `methodology_version`
  - `rights_policy_version`
  - `disclaimer`
- Static report plans require `exports.read`.
- Static report plans keep:
  - `raw_partner_data_embedded=false`
  - `artifact_writes=false`
  - `persistent_writes=false`
  - `live_tool_execution=false`
  - `live_data_access=false`
  - `model_calls=false`
  - `frontend=false`
- DB scaffold covers:
  - `core.static_report_artifact`
  - `audit.static_report_event`
  - `governance.static_report_contract`

## Verification Commands

- `npm run typecheck --workspace @aiphabee/research-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:static-report`
- `npm run check:database`
- `npx vitest run packages/research-runtime/src/index.test.ts apps/worker/src/index.test.ts`

## Non-Goals

- No real report file generation.
- No R2 writes.
- No persistent report writes.
- No frontend report viewer or download UI.
