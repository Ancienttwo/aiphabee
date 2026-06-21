# Task Contract: Run/Tool Audit Fields Closeout

## Objective

Close the local A5 requirement that every run and planned/denied tool call has a
complete non-sensitive audit-field payload.

## Acceptance

- Add `deploy/governance/run-tool-audit-fields.contract.json`.
- Add `npm run check:run-tool-audit-fields`.
- Extend `deploy/observability/events.contract.json` so `run.audit` declares
  required run-level audit fields and per-tool-call required fields.
- Extend `createAgentDryRunTelemetry()` with user, workspace, tool versions,
  data/methodology version, model fields, token counts, cost, latency, and
  output hash.
- Ensure `POST /agent/runs/dry-run`, `POST /agent/runs/plan`, and
  `POST /agent/workflows/tasks/plan` pass Agent runtime identity and tool
  versions into telemetry.
- Ensure denied tools emit `denied_pre_execution` tool-call audit records.
- Update only the A5 run/tool-call audit checkbox; keep live AI Gateway
  logging/cost/fallback item unchecked.

## Out Of Scope

- Live AI Gateway request logs.
- Live model execution.
- Live token/cost/fallback writes.
- Actual tool execution.
- Persistent audit sink.
- Frontend Ask rendering.
