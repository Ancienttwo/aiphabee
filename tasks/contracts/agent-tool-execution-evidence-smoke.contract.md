# Agent Tool Execution Evidence Smoke Contract

## Goal

Add a guarded backend smoke for Sprint 1.3 that proves an Agent-controlled path
can execute one registered Worker tool route and bind the returned provenance to
the post-generation evidence validator.

## Scope

- Add guarded `POST /agent/runs/tool-execution-evidence-smoke`.
- Require `x-aiphabee-smoke=agent-tool-execution-evidence-v1`.
- Require `AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN`.
- Execute fixed sample tool `get_quote_snapshot` through the registered Worker
  route map.
- Return hash-only tool/evidence identifiers.
- Run one sourced numeric validation and one unsourced numeric blocking probe.
- Add contract/checker/test and connect to root `npm run check`.

## Explicit Non-Goals

- No frontend work.
- No live model execution or token streaming.
- No live evidence or usage-ledger writes.
- No generic arbitrary tool execution proxy.
- No production/live sampling claim.

## Verification

- `npm run test -- apps/worker/src/agent-tool-execution-evidence-smoke.test.ts`
- `npm run check:agent-tool-execution-evidence-smoke`
- `npm run typecheck --workspace @aiphabee/worker`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
