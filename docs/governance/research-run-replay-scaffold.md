# Research Run Replay Scaffold

> **Plan**: `plans/plan-research-run-replay-scaffold.md`
> **Task Contract**: `tasks/contracts/research-run-replay-scaffold.contract.md`
> **Local Contract**: `deploy/research/research-run-replay.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/research-runtime` | Owns saved-run replay and diff planning |
| `POST /research/runs/replay/plan` | Worker route for no-write replay planning |
| `POST /research/runs/save/plan` | Produces the saved snapshot consumed by replay |
| `deploy/research/research-run-replay.contract.json` | Guards RES-02 output fields and no-live posture |

Out of scope:

- `apps/web`
- live DB/R2 persistence
- live tool execution
- live model execution
- notification workflows

## P2: Concrete Trace

1. A saved run is produced by `POST /research/runs/save/plan`.
2. The saved run contains `snapshot_id`, question/tool/evidence/model snapshots,
   and `parameter_snapshot`.
3. A caller submits the saved run plus a `current_run` payload to
   `POST /research/runs/replay/plan`.
4. Worker normalizers convert snake_case/camelCase inputs into
   `@aiphabee/research-runtime` inputs.
5. `createResearchRunReplayPlan` builds a current no-write save plan and
   compares it to the saved snapshot.
6. The response returns:
   - `diff_summary.categories`
   - `diffs.data`
   - `diffs.model`
   - `diffs.parameters`
   - `old_report`
   - `replay_execution`
7. `old_report.preserved_snapshot_id` remains the saved snapshot ID, with
   `mutation_allowed=false` and `silent_rewrite_allowed=false`.

## P3: Decision Rationale

Why no-write replay planning:

- Sprint 2.2 needs a deterministic contract for replay and diff semantics before
  durable storage and UI rendering can safely depend on it.
- Existing repo patterns use no-write planners for account/session, usage,
  evidence, queue, eval, and saved-run scaffolds.
- Live execution would require storage, queues, billing, model providers, and
  tool orchestration that are broader later-sprint surfaces.

Tradeoff:

- The backend can now prove how saved vs current runs are compared.
- It does not claim live model/tool rerun execution.
- It does not render a research-library UI.

## Verification

Passed:

- `npm run check:research-run-replay`
- `npm run test -- packages/research-runtime/src/index.test.ts`
- `npm run test -- apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/research-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- Live DB/R2 research-run writes remain absent.
- Live replay execution remains absent.
- Frontend research library remains delegated.
