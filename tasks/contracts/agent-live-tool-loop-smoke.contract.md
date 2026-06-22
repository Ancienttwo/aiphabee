# Agent Live ToolLoop Smoke Contract

## Goal

Add a guarded backend smoke for Sprint 1.3 that proves one run-level Agent path
can bind planning, fixed tool execution, evidence validation, live model
execution, and audit preview without claiming general user ToolLoop completion.

## Scope

- Add guarded `POST /agent/runs/live-tool-loop-smoke`.
- Require `x-aiphabee-smoke=agent-live-tool-loop-v1`.
- Require `AIPHABEE_AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN`.
- Create a fixed ToolLoop plan for Tencent `00700.HK` using `get_quote_snapshot`.
- Execute the fixed Worker tool route through the existing Agent tool execution
  smoke helper.
- Reuse the existing model execution audit smoke helper for Cloudflare AI
  Gateway `generateText` and `streamText`.
- Return a hash-only run-level orchestration summary.
- Add contract/checker/test and connect to root `npm run check`.

## Explicit Non-Goals

- No frontend work.
- No arbitrary user tool execution.
- No user-facing live model token streaming.
- No generated-answer evidence-card binding.
- No AI Gateway Logs API or GraphQL analytics read claim.
- No live audit, evidence, or usage-ledger writes.

## Verification

- `npm run test -- apps/worker/src/agent-live-tool-loop-smoke.test.ts`
- `npm run check:agent-live-tool-loop-smoke`
- `npm run typecheck --workspace @aiphabee/worker`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
