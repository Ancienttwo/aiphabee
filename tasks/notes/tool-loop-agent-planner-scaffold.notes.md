# Notes: tool-loop-agent-planner-scaffold

> **Last Updated**: 2026-06-21 03:14 +08
> **Plan**: `plans/plan-tool-loop-agent-planner-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/tool-loop-agent-planner-scaffold.md`

## Decisions

- Added planner behavior inside `@aiphabee/agent-runtime` so it can reuse the
  verified run context and Tool Registry metadata.
- Added `POST /agent/runs/plan` instead of changing the dry-run route shape
  again; dry-run remains the context preview, plan is the ToolLoopAgent plan.
- Added backend SSE serialization for public progress events while keeping model
  token streaming and frontend rendering out of scope.
- Kept model calls, actual tool execution, chain-of-thought exposure, live
  entitlement reads, usage ledger writes, and frontend out of scope.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:tool-loop-agent`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- `npm run check` attempted: lint/typecheck/test/golden/contracts including
  `check:tool-loop-agent` passed, then root build failed in out-of-scope
  `@aiphabee/web` Vite build because the current Node runtime lacks
  `node:module.registerHooks`; `apps/web` has no diff.
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `GET /agent/runtime` -> `200 OK`, `tool_loop_agent.status=tool_loop_agent_planner_scaffold`,
  `planner_ready=true`, `model_calls=false`
- `POST /agent/runs/plan` -> `200 OK`, `status=planned_no_model`,
  `planned_step_count=6`, `max_parallel_tools=3`, `chain_of_thought_exposed=false`,
  `actual_tool_execution=false`, `model_calls=false`
- `POST /agent/runs/stream` -> `200 OK text/event-stream`, public run/tool
  progress events, no prompt text, `actual_tool_execution=false`, `model_calls=false`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, `packages`, and `tests`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`
- No lingering current-repo `wrangler dev`, `workerd`, or workflow helper
  process after verification

## Residual Blockers

- Live model token streaming is absent.
- Actual tool execution is absent.
- Real model calls remain guarded.
- Live entitlement reads and usage ledger writes are absent.
- Post-generation evidence binding remains absent.
- Frontend Ask and evidence cards remain out of scope for this Codex slice.
- Root all-workspace build remains blocked by the frontend Vite/Cloudflare
  plugin runtime mismatch until the frontend lane aligns Node/tooling.
