# Agent User ToolLoop Execution Release Gate

## Scope

This slice adds a no-write release gate for arbitrary user ToolLoop execution
readiness. It links the existing ToolLoop planner, pre-tool-call resolution,
tool enforcement, budget/stop, failure recovery, guarded fixed tool execution
smoke, guarded fixed live ToolLoop smoke, and user-run persistence gate into one
machine-readable plan.

It is not arbitrary user ToolLoop execution, a user prompt live execution route,
frontend Ask rendering, live DB persistence, live model execution, or a
production persistence cutover.

## P1: Architecture Map

| Surface | File | Role |
|---|---|---|
| Runtime contract | `packages/agent-runtime/src/index.ts` | Exposes capability and pure no-write release gate plan |
| Worker route | `apps/worker/src/index.ts` | Serves `POST /agent/release-gates/user-tool-loop-execution/plan` in the standard envelope |
| Contract | `deploy/agent/user-tool-loop-execution-release-gate.contract.json` | Machine-readable linked evidence, blockers, flags, tables, and non-claims |
| Migration | `supabase/migrations/20260622021000_agent_user_tool_loop_execution_release_gate.sql` | No-write gate and governance contract scaffolds |
| Checker | `scripts/check-agent-user-tool-loop-execution-release-gate-contract.mjs` | Verifies runtime, Worker, tests, migration, package wiring, linked contracts, and non-claims |

## P2: Concrete Trace

1. `GET /agent/runtime` reports
   `agent_user_tool_loop_execution_release_gate`.
2. `POST /agent/release-gates/user-tool-loop-execution/plan` accepts optional
   request-local evidence flags for planner, preflight, enforcement, budget,
   recovery, fixed tool execution smoke, fixed live ToolLoop smoke, user auth
   and entitlement, and user-run persistence gate acceptance.
3. The runtime links these proof surfaces:
   - `deploy/agent/tool-loop-planner.contract.json`
   - `deploy/agent/pre-tool-call-resolution.contract.json`
   - `deploy/agent/tool-enforcement.contract.json`
   - `deploy/agent/budget-stop-policy.contract.json`
   - `deploy/agent/failure-recovery-policy.contract.json`
   - `deploy/agent/tool-execution-evidence-smoke.contract.json`
   - `deploy/agent/live-tool-loop-smoke.contract.json`
   - `deploy/agent/user-run-persistence-release-gate.contract.json`
4. The plan returns `linked_evidence`, `evidence_requirements`,
   `release_checks`, `release_gate`, and `validation`.
5. Even when every request-local evidence flag is true, the plan keeps
   `release_transition_allowed=false` and reports
   `route_does_not_accept_arbitrary_user_tool_loop` because this route does not
   accept a user prompt for live tool execution.

## P3: Decision Rationale

Sprint 1.3 already proves many fixed or no-write pieces: planning, policy,
guarded fixed tool execution, fixed ToolLoop orchestration, and persistence
readiness. The missing boundary is the release decision for arbitrary user
ToolLoop execution. The smallest coherent change is a no-write gate that links
the existing proof chain and keeps the live execution cutover blocked.

The invariant is that fixed smokes and request-local acceptance flags must not
be treated as permission to run arbitrary user prompts through tools. At 10x
scale, the first failure would be enabling live user tool calls before auth,
entitlement, budget, persistence, retry, and evidence guarantees are accepted;
this gate makes those dependencies explicit.

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

## Residual Gaps

- No arbitrary user ToolLoop execution route is enabled.
- No live user prompt tool execution is enabled.
- No live model execution is enabled.
- No frontend Ask rendering is enabled.
- No persistent user-run state or production persistence cutover is enabled.
- No live entitlement DB reads are enabled.
