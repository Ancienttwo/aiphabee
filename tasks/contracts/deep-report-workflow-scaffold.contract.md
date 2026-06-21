# Deep Report Workflow Scaffold Contract

## Objective

Complete the backend-only Sprint 2.4 scaffold for PRD §6.5 and RES-04 deep
reports: plan fetch, deterministic analysis, section generation, citation
validation, evidence index creation, static report metadata, and rerun seed.

## Required Surfaces

- Package: `@aiphabee/research-runtime`
- Runtime route: `GET /research/runtime`
- Planner route: `POST /research/reports/deep/plan`
- Linked Workflow task route: `POST /agent/workflows/tasks/plan`
- Rerun route contract: `POST /research/runs/replay/plan`
- Contract: `deploy/research/deep-report-workflow.contract.json`
- Checker: `npm run check:deep-report-workflow`
- Report snapshot table scaffold: `core.deep_report_snapshot`
- Evidence index table scaffold: `core.deep_report_evidence_index`

## Required Guarantees

- Use standard response envelopes.
- Return the linked `task_id` / `workflow_task_id`.
- Preserve the stage order: data fetch, deterministic analysis, section
  generation, citation validation, evidence index, rerun seed.
- Require evidence for every claim and label unsupported claims as `unknown`.
- Include static report metadata: generated time, as-of time, data delay,
  version, and disclaimer.
- Include an evidence index with `source_record_id`, `data_version`, and
  `methodology_version` linkage.
- Include a rerun seed that points to research-run replay diff semantics.
- Include a high-cost usage estimate without debiting credits.
- Do not start live Cloudflare Workflows.
- Do not execute tools or model calls.
- Do not write DB/R2/checkpoint rows.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes deep report snapshot and evidence index
  table scaffolds.
- Package and Worker targeted tests pass.
- Worker and Research Runtime typecheck/build pass.
- Sprint tracker row is checked and Sprint 2.4 count is updated.
