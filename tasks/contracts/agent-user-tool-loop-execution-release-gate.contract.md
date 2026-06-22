# Agent User ToolLoop Execution Release Gate Contract

## Intent

Create a no-write release gate that links the existing planning, policy,
guarded fixed execution, and persistence-readiness surfaces before any arbitrary
user ToolLoop execution cutover.

## In Scope

- Add `POST /agent/release-gates/user-tool-loop-execution/plan`.
- Expose `agent_user_tool_loop_execution_release_gate` from
  `GET /agent/runtime`.
- Link:
  - `POST /agent/runs/plan`
  - `POST /agent/runs/preflight`
  - `POST /agent/runs/tool-execution-evidence-smoke`
  - `POST /agent/runs/live-tool-loop-smoke`
  - `POST /agent/release-gates/user-run-persistence/plan`
- Return `linked_evidence`, `evidence_requirements`, `release_checks`,
  `release_gate`, and `validation`.
- Keep `actual_tool_execution=false`.
- Keep `arbitrary_user_tool_loop_execution=false`.
- Keep `live_tool_execution=false`.
- Keep `live_model_execution=false`.
- Keep `frontend_rendering=false`.
- Keep `persistent_writes=false`.
- Keep `release_transition_allowed=false`.
- Add migration, deploy contract, checker, unit tests, and tracker/todo updates.

## Out of Scope

- Arbitrary user ToolLoop execution.
- User-prompt live tool execution route.
- Live model execution.
- Frontend Ask rendering.
- Persistent user-run state.
- Production user-run persistence cutover.
- Live entitlement DB reads.
- Raw tool-result return.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts`
- `npm run test -- apps/worker/src/index.test.ts`
- `npm run check:agent-user-tool-loop-execution-release-gate`
- `npm run check:tool-loop-agent`
- `npm run check:pre-tool-call-resolution`
- `npm run check:tool-enforcement`
- `npm run check:budget-stop-policy`
- `npm run check:failure-recovery-policy`
- `npm run check:agent-tool-execution-evidence-smoke`
- `npm run check:agent-live-tool-loop-smoke`
- `npm run check:agent-user-run-persistence-release-gate`
- `npm run check:database`
