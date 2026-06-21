# Research Run Save Scaffold Contract

## Objective

Complete the backend-only Sprint 2.2 RES-01 research run save scaffold:

- capture the user question
- capture tool inputs
- capture evidence snapshot records
- capture model and prompt versions
- produce an immutable snapshot ID and replay seed

## Required Surfaces

- Package: `@aiphabee/research-runtime`
- Runtime route: `GET /research/runtime`
- Save-plan route: `POST /research/runs/save/plan`
- Contract: `deploy/research/research-run-save.contract.json`
- Checker: `npm run check:research-run-save`

## Required Guarantees

- Use standard response envelopes.
- Keep live DB writes disabled in this scaffold.
- Keep SQL emission disabled.
- Return `question_snapshot`, `tool_input_snapshot`, `evidence_snapshot`, and
  `model_snapshot`.
- Require `question`, `tool_calls`, `evidence_records`, `model_version`, and
  `prompt_version`.
- Return `replay_seed` with a stable snapshot ID.
- Return `immutable_report_snapshot=true`.
- Return `old_report_mutation_allowed=false`.
- Keep frontend rendering disabled.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves complete save-plan payload and missing-field
  rejection.
- Sprint tracker row is checked only for RES-01; replay execution,
  data/model/parameter diffing, old-report immutability workflow, and frontend
  UI remain open.
