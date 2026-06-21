# Agent Kill Switch Scaffold Contract

> Sprint: 2.4 subscription billing, Workflows, alerts, and correction surfaces
> Tracker item: US-O04 model/tool kill switch and safe degradation

## Scope

- Package: `@aiphabee/agent-runtime`
- Runtime route: `GET /agent/runtime`
- Kill switch route: `POST /agent/kill-switch/plan`
- Agent plan route: `POST /agent/runs/plan`
- Contract: `deploy/agent/kill-switch.contract.json`
- Checker: `npm run check:agent-kill-switch`

## Guarantees

- Model and tool kill switch inputs are normalized into one deterministic no-live plan.
- `POST /agent/kill-switch/plan` returns switch state, decision, and safe degradation metadata.
- `POST /agent/runs/plan` returns `degraded_kill_switch` and a single answer-contract step with no tool calls when tool execution is disabled.
- The scaffold keeps model calls, actual tool execution, live flag reads, frontend behavior, and persistent writes disabled.
- The scaffold records empty DB tables for future live state and governance contracts without enabling live runtime reads.

## Verification

- `npm run check:agent-kill-switch`
- `npm run check:database`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
