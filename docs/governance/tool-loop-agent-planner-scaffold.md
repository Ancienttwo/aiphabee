# Tool Loop Agent Planner Scaffold

> **Status**: Verified no-model planner scaffold
> **Last Updated**: 2026-06-21 03:14 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-tool-loop-agent-planner-scaffold.md`
> **Task Contract**:
> `tasks/contracts/tool-loop-agent-planner-scaffold.contract.md`

This slice adds a no-model ToolLoopAgent planner and a backend public progress
stream. It plans phased tool steps, public progress events, parallel read-only
limits, stop/retry rules, and emits those events over Server-Sent Events. It
does not execute tools, call a model, stream model tokens, expose chain of
thought, read live entitlements, write usage ledger rows, or touch frontend.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime package | `packages/agent-runtime` | Owns no-model ToolLoopAgent planning |
| Shared Tool Registry | `packages/tool-registry` | Source of tool names, versions, schemas, scopes, and live-data flags |
| Worker capabilities | `GET /agent/runtime` | Reports planner readiness and no-model/no-execution posture |
| Worker planner | `POST /agent/runs/plan` | Returns standard envelope with planned steps and progress event contract |
| Worker progress stream | `POST /agent/runs/stream` | Returns `text/event-stream` public progress events derived from the no-model plan |
| Planner contract | `deploy/agent/tool-loop-planner.contract.json` | Requires no-model flags, max parallelism, phases, events, stop conditions, and retry policy |
| Frontend | Out of scope | No `apps/web` files changed |

## P2 Concrete Trace

1. Caller sends `POST /agent/runs/plan` with prompt, tools, user/workspace, plan,
   channel, and budgets.
2. Worker calls `createToolLoopAgentPlan()`.
3. The runtime first creates the verified dry-run context, including tool
   versions, schema IDs, scopes, and default-deny entitlement posture.
4. The planner groups tools into phases:
   - security resolution;
   - entitlement gate;
   - data fetch chunks of at most 3 read-only tools;
   - evidence binding;
   - answer contract.
5. The planner returns `status=planned_no_model`, public progress event names,
   stop conditions, retry policy, and no execution side effects.
6. `POST /agent/runs/stream` derives a stream report from the same plan and
   serializes only public event names, step labels, tool names, request/run IDs,
   and no-call execution status as Server-Sent Events.

## P3 Design Decision

Selected a no-model planner before live ToolLoop execution.

Reason:

- Sprint 1.3 requires multi-step orchestration, but model provider execution is
  still guarded and frontend Ask is out of scope for Codex.
- Planning can prove max-step, max-parallel, stop/retry, and no-reasoning-leak
  invariants without consuming model/tool budget.
- Tool Registry already owns schema/version/scope facts, so the Agent planner
  should derive from it instead of duplicating metadata.

Tradeoff:

- The Agent runtime can now produce a deterministic multi-step plan.
- It still cannot run tools, stream model tokens, or generate a final answer.

What fails first at 10x scale:

- Public progress events now have a backend streaming transport, but persistent
  run state and frontend rendering must land before concurrent live Agent runs
  can be resumed or audited.

## Verification

Passed:

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:tool-loop-agent`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- `npm run check` reached and passed lint/typecheck/test/golden/contracts,
  including `check:tool-loop-agent`, then failed at the out-of-scope
  `@aiphabee/web` Vite build because `node:module.registerHooks` is unavailable
  under the current Node runtime; `apps/web` has no diff.
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `GET /agent/runtime` -> `200 OK`
- `POST /agent/runs/plan` -> `200 OK`
- `POST /agent/runs/stream` -> `200 OK text/event-stream`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, `packages`, and `tests`
- `git diff --name-only -- apps/web` returned no changed files
- `scripts/check-task-workflow.sh --strict`

Observed route fields:

```json
{
  "runtime": {
    "status": "tool_loop_agent_planner_scaffold",
    "plannerReady": true,
    "modelCalls": false
  },
  "plan": {
    "status": "planned_no_model",
    "plannedStepCount": 6,
    "maxParallelTools": 3,
    "phases": [
      "security_resolution",
      "entitlement_gate",
      "data_fetch",
      "data_fetch",
      "evidence_binding",
      "answer_contract"
    ],
    "chainOfThoughtExposed": false,
    "actualToolExecution": false,
    "modelCalls": false
  }
}
```

## Residual Gaps

- Frontend Ask/progress rendering is absent.
- Live model token streaming remains absent.
- Actual tool execution is absent.
- Real model calls remain guarded.
- Live entitlement reads and usage ledger writes are absent.
- Post-generation evidence binding remains absent.
- Frontend Ask and evidence cards remain out of scope for this Codex slice.
- Root all-workspace build remains blocked by the frontend Vite/Cloudflare
  plugin runtime mismatch until the frontend lane aligns Node/tooling.
