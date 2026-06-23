# Deep Report Workflow Scaffold Notes

## Summary

Implemented the Sprint 2.4 backend scaffold for deep report Workflow planning.

## Current State

- `@aiphabee/research-runtime` exposes `deep_report_workflow` capabilities.
- `POST /research/reports/deep/plan` returns a deterministic no-write deep
  report plan linked to an Agent Workflow task.
- The plan covers fetch, deterministic analysis, section generation, citation
  validation, evidence index, static report snapshot metadata, rerun seed, and
  high-cost usage estimate.
- `aiphabee_core.deep_report_snapshot` and `aiphabee_core.deep_report_evidence_index` exist as
  empty schema scaffolds for future persistence.
- The local contract checker verifies stage order, no live Workflow execution,
  no tool/model execution, no writes, citation validation, evidence index,
  static report metadata, rerun route, and database contract linkage.

## Non-Goals

- No live Cloudflare Workflows execution.
- No model calls.
- No live tool execution.
- No DB/R2/checkpoint writes.
- No frontend report rendering or rerun UI.

## Verification

Passed:

- `npm run check:deep-report-workflow`
- `npm run check:database`
- `npm run check:agent-workflow-task`
- `npm run check:research-run-save`
- `npm run check:research-run-replay`
- `npm run test -- packages/research-runtime/src/index.test.ts apps/worker/src/index.test.ts packages/agent-runtime/src/index.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:golden`
- `npm run typecheck --workspace @aiphabee/research-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/research-runtime`
- `npm run build --workspace @aiphabee/worker`
