# Research Run Save Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 13:11 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-research-run-save-scaffold.md`
> **Task Contract**: `tasks/contracts/research-run-save-scaffold.contract.md`

This slice continues Sprint 2.2 with a backend-only RES-01 surface for saving a
complete research run snapshot.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/research-runtime` | Owns research run save/replay snapshot scaffolds |
| Runtime route | `GET /research/runtime` | Reports save-plan capability |
| Save route | `POST /research/runs/save/plan` | Plans an immutable research run snapshot |
| Contract | `deploy/research/research-run-save.contract.json` | Guards required snapshot fields and no-write posture |
| Evidence | Existing evidence IDs/source records | Referenced as immutable snapshot inputs, not rewritten |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /research/runs/save/plan` with a question, tool calls,
   evidence records, model version, and prompt version.
2. The Worker normalizes snake/camel request fields and JSON-safe tool inputs.
3. `createResearchRunSavePlan()` validates the required RES-01 fields.
4. The package stores the question snapshot, tool input snapshots, evidence
   snapshot records, and model/prompt snapshot in the planned response.
5. Stable hashes produce `question_hash`, tool `input_hash`, evidence
   `snapshot_hash`, and `snapshot_id`.
6. The response returns a replay seed that points to
   `POST /research/runs/replay/plan`.
7. The persistence plan remains `planned_no_write`, with SQL and live DB writes
   disabled.

## P3 Design Decision

Selected a no-write save-plan scaffold instead of live persistence.

Reason:

- PRD RES-01 requires a complete captured run shape before replay and report UI
  can be correct.
- The repo already uses no-write planners for account/session, usage, evidence,
  high-cost queue, and eval scaffolds.
- Live storage choices for D1/R2/DO/Workflows are still broader Sprint 2.4/3.x
  surfaces.

Tradeoff:

- The run snapshot payload, required fields, immutable snapshot ID, and replay
  seed are executable and testable now.
- This is not yet a durable DB write.
- RES-02 replay/diff planning is covered by
  `docs/governance/research-run-replay-scaffold.md`; live replay execution and
  frontend rendering remain separate.

## Verification

Passed:

- `npm run check:research-run-save`
- `npm run test -- packages/research-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/research-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/research-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`

Observed save-plan behavior:

```json
{
  "toolName": "save_research_run",
  "status": "planned_no_write",
  "immutable_report_snapshot": true,
  "schema_validation": {
    "required_fields": [
      "question",
      "tool_calls",
      "evidence_records",
      "model_version",
      "prompt_version"
    ],
    "valid": true
  },
  "replay_seed": {
    "replay_route": "POST /research/runs/replay/plan",
    "replay_status": "planned"
  },
  "live_db_writes": false,
  "sql_emitted": false
}
```

Observed root check residual:

- Root `npm run check` passed all lint/typecheck/test/golden/contract checks,
  including `check:research-run-save`, before failing at `@aiphabee/web`
  `vite build` because the current Node runtime does not export
  `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.

## Residual Gaps

- Live DB/R2 writes are not implemented.
- Live replay execution is not implemented.
- Old-report mutation is blocked in replay planning; notification workflow is
  not implemented.
- Frontend research-library UI remains delegated.
