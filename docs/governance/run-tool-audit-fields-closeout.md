# Run/Tool Audit Fields Closeout

> **Status**: Verified local audit-field closeout
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/run-tool-audit-fields-closeout.contract.md`

This slice closes the local A5 requirement that every run and planned/denied
tool-call audit event carries the required non-sensitive audit dimensions:
user, workspace, tool version, data version, methodology version, model fields,
token counts, cost, latency, and output hash.

It does not enable live model execution, real AI Gateway request logs, live
token/cost/fallback logs, actual tool execution, frontend Ask rendering, or a
persistent audit store.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Observability package | `packages/observability` | Owns `run.audit` event type, tool-call audit payload, and console/eval sinks |
| Worker agent routes | `POST /agent/runs/dry-run`, `POST /agent/runs/plan`, `POST /agent/workflows/tasks/plan` | Pass `run_context` identity and tool versions into telemetry |
| Agent runtime | `packages/agent-runtime` | Owns user/workspace defaults, model dry-run state, and registered tool context |
| Event contract | `deploy/observability/events.contract.json` | Declares run-level and tool-call required audit fields |
| A5 governance gate | `deploy/governance/run-tool-audit-fields.contract.json` | Cross-checks source, tests, event contract, scripts, and tracker |

## P2 Concrete Trace

1. A caller posts to an Agent route with prompt, user/workspace, and tool list.
2. Worker normalizes the request through existing Agent runtime planners.
3. `run_context.user`, `run_context.workspace`, and `run_context.toolset.tools`
   become the source of truth for audit identity and tool versions.
4. Worker calls `createAgentDryRunTelemetry()` with route/run/request identity,
   requested tools, model dry-run fields, and tool versions.
5. `run.audit` emits a run-level audit payload and one tool-call audit item per
   requested tool. Denied tools are marked `denied_pre_execution`; planned tools
   are marked `planned_no_execution`.
6. No prompt content, API keys, raw secrets, live model output, or live tool
   response content is written to the telemetry payload.

## P3 Design Decision

Selected an additive event-contract expansion instead of a separate audit log
surface.

Reason:

- `run.audit` already exists and is emitted from all Agent planning paths.
- Agent runtime already owns user/workspace defaults and tool registry versions.
- A separate audit surface would duplicate source-of-truth fields and leave the
  existing observability contract weak.

Tradeoff:

- Local no-model/no-tool execution can now prove complete audit field shape.
- Real AI Gateway token/cost/fallback logs remain a separate live runtime item.

## Verification

Required:

- `npm run check:run-tool-audit-fields`
- `npm run check:observability`
- `npm run test -- packages/observability apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/observability`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check`

## Residual Gaps

- Live AI Gateway request logging is not enabled.
- Live model token/cost/fallback logs are not written.
- Actual tool execution and persistent audit storage are not enabled.
- Frontend Ask rendering is owned by the separate web track.
