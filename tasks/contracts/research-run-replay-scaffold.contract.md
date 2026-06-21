# Contract: Research Run Replay Scaffold

## Scope

This slice covers Sprint 2.2 RES-02 backend replay/diff planning only.

It must:

- accept a saved run snapshot and current replay input;
- return a replay snapshot ID without mutating the saved snapshot;
- classify diffs into data, model, and parameters;
- expose old-report immutability metadata;
- remain no-write and no-live-execution.

## Ownership

- Package: `@aiphabee/research-runtime`
- Worker route: `POST /research/runs/replay/plan`
- Contract: `deploy/research/research-run-replay.contract.json`
- Checker: `npm run check:research-run-replay`

## Acceptance

- `diff_summary.categories` can include `data`, `model`, and `parameters`.
- `old_report.mutation_allowed=false`.
- `old_report.silent_rewrite_allowed=false`.
- `replay_execution.live_model_call=false`.
- `replay_execution.live_tool_execution=false`.
- `live_db_writes=false` and `sql_emitted=false`.

## Out Of Scope

- Live persistence, replay execution, model calls, tool calls, notification jobs,
  and frontend display remain outside this backend scaffold.
