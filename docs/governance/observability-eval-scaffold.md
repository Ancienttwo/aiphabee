# Observability Eval Scaffold

> **Status**: Verified local event contract; persistent scaffold added
> **Last Updated**: 2026-06-20 16:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-observability-eval-scaffold.md`
> **Task Contract**: `tasks/contracts/observability-eval-scaffold.contract.md`

This slice adds a local observability/eval scaffold for the Worker Agent Runtime
dry-run route. It is now extended by
`docs/governance/observability-persistent-eval-store-scaffold.md`, which adds
the no-secret OTLP/eval-store destination scaffold.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Wrangler observability | `apps/worker/wrangler.jsonc` enables Workers Logs and traces | Local/runtime config only; no destination IDs or secrets |
| Observability package | `packages/observability` | Builds `run.audit` and `run.eval` events plus console/in-memory/eval-store sinks |
| Event contract | `deploy/observability/events.contract.json` | Names event types, required fields, forbidden prompt/secret fields, sink status, OTLP env names, and eval-store binding |
| Contract check | `scripts/check-observability-contract.mjs` | Validates manifest shape, env schema, Cloudflare binding, and required event/sink coverage |
| Worker route | `POST /agent/runs/dry-run` | Emits structured events for success, validation rejection, and unexpected errors |
| External sinks | Guarded scaffold | OTLP endpoint and D1 eval store are named, but live export/write remains disabled |

## P2 Concrete Trace

Dry-run success trace:

1. Client sends `POST /agent/runs/dry-run` with `x-request-id`.
2. Worker validates prompt, `max_steps`, and registered tool allowlist through
   `@aiphabee/agent-runtime`.
3. Worker calls `createAgentDryRunTelemetry()` with route, request id, run id,
   requested tools, step budget, environment, and `outcome=success`.
4. `@aiphabee/observability` creates two events:
   - `run.audit` records method/version, requested tools, denied tools, credits,
     and `model_provider=not_configured`;
   - `run.eval` records allowlist/model-call/evidence-binding checks.
5. Worker records events through `createConsoleTelemetrySink(console)`.
6. Response returns `x-aiphabee-telemetry-event-count: 2` and
   `x-aiphabee-telemetry-run-id`.

Policy-denial trace:

1. An unregistered tool raises `AgentRuntimeInputError`.
2. Worker maps the error to `SCOPE_DENIED`.
3. Telemetry is emitted with `outcome=rejected`, denied tool names, and a failed
   `registered_tool_allowlist` eval check.

## P3 Design Decision

Selected a local event contract and console sink instead of external telemetry
export.

Reason:

- The repo has no approved OTLP endpoint, eval database, retention policy, or
  deployment secret store.
- The current Agent Runtime still performs no real model calls, so token/cost
  metrics would be fabricated.
- A local event contract gives CI and Wrangler smoke tests a stable observable
  surface while preserving the no-secret Phase 0 boundary.

Tradeoff:

- This completes the Sprint 0.4 local OTel/log/eval scaffold leaf.
- It does not complete persistent eval analytics, dashboards, alerts, or external
  telemetry export.

## Verification

Passed:

- `npm run check`
- `npm run check:observability`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `POST /agent/runs/dry-run` -> `200 OK`
- Response header `x-aiphabee-telemetry-event-count: 2`
- Console emitted `run.audit` and `run.eval` JSON events.

Smoke request:

```bash
curl -i -X POST http://localhost:8787/agent/runs/dry-run \
  -H 'content-type: application/json' \
  -H 'x-request-id: req-smoke-otel' \
  --data '{"prompt":"Explain 00700.HK trend","tools":["resolve_security"]}'
```

Observed headers:

```http
x-aiphabee-telemetry-event-count: 2
x-aiphabee-telemetry-run-id: dry_req-smoke-otel
```

## Residual Gaps

- Live OTLP destination and credentials are not configured.
- Persistent eval store write/read smoke and retention policy are not implemented.
- Real model token/cost/latency metrics remain blocked until model execution
  exists.
- Dashboarding, alerting, and production log routing remain unimplemented.
