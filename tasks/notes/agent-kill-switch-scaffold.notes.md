# Notes: Agent kill switch scaffold

## Completed

- Added `AGENT_KILL_SWITCH_VERSION` and `createAgentKillSwitchPlan()` in `@aiphabee/agent-runtime`.
- Added `kill_switch` readiness to `GET /agent/runtime`.
- Added `POST /agent/kill-switch/plan` in the Worker.
- Extended `POST /agent/runs/plan` so `tool_kill_switch` returns `degraded_kill_switch` with one safe answer-contract step and no tool calls.
- Added `deploy/agent/kill-switch.contract.json` and `npm run check:agent-kill-switch`.
- Added empty `core.agent_kill_switch_state` and `governance.agent_kill_switch_contract` scaffolds.

## Boundaries

- No frontend implementation.
- No live feature flag source reads.
- No model provider calls.
- No actual tool execution.
- No persistent writes.

## Verification

- Passed: `npm run typecheck --workspace @aiphabee/agent-runtime`
- Passed: `npm run typecheck --workspace @aiphabee/worker`
- Passed: `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run check:agent-kill-switch`
- Passed: `npm run check:database`
- Passed: related Agent contract checks (`check:agent-workflow-task`, `check:tool-loop-agent`, `check:tool-enforcement`, `check:failure-recovery-policy`, `check:model-routing-audit`)
- Passed: `npm run build --workspace @aiphabee/agent-runtime`
- Passed: `npm run build --workspace @aiphabee/worker`
- Passed: `git diff --check`
- Passed: `scripts/check-task-workflow.sh --strict`
- Passed: `npm run lint && npm run typecheck && npm run test && npm run test:golden`
- Caveat: `npm run check` reaches `npm run build` and fails only in `@aiphabee/web` because `@cloudflare/vite-plugin` imports `node:module.registerHooks`; frontend work is delegated and `apps/web` was not changed in this slice.
