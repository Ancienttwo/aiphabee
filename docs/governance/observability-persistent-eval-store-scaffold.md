# Observability Persistent Eval Store Scaffold

> **Status**: Verified guarded scaffold
> **Last Updated**: 2026-06-20 16:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-observability-persistent-eval-store-scaffold.md`
> **Task Contract**:
> `tasks/contracts/observability-persistent-eval-store-scaffold.contract.md`

This slice adds a no-secret scaffold for persistent eval records and OTLP
destination configuration. The D1 resource now exists by name, but this slice
does not export telemetry or write to the persistent store.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Eval-store schema | `packages/observability` | Projects `run.eval` into prompt-free records |
| Eval-store binding | `AIPHABEE_EVAL_STORE` | D1 resource provisioned by name; Worker binding, write/read smoke, and writes remain disabled |
| OTLP destination | `OTLP_EXPORTER_OTLP_ENDPOINT`, `OTLP_EXPORTER_OTLP_HEADERS` | Names-only env contract, no values |
| Runtime capability | `GET /observability/runtime` | Reports planned/configured status and disables writes/export |
| Contract checker | `scripts/check-observability-contract.mjs` | Validates event sinks, env schema, and binding manifest |
| Live export/write | Absent | No OTLP request, D1 write/read, dashboard, or alerting |

## P2 Concrete Trace

Eval-store projection trace:

1. Agent dry-run telemetry creates `run.audit` and `run.eval`.
2. `createEvalStoreTelemetrySink()` ignores `run.audit`.
3. For `run.eval`, it creates an `EvalStoreRecord` with:
   - event/run/request identifiers;
   - result, evidence-binding state, checks, and failed check count;
   - service/environment/route/outcome metadata.
4. The record excludes prompt text, API keys, tokens, secrets, and passwords.

Runtime capability trace:

1. Client calls `GET /observability/runtime`.
2. Worker checks whether `AIPHABEE_EVAL_STORE`,
   `OTLP_EXPORTER_OTLP_ENDPOINT`, and `OTLP_EXPORTER_OTLP_HEADERS` are present.
3. Worker returns:
   - `eval_store.status=planned` in local runtime until the Worker binding is
     configured, with `writes_enabled=false` by default;
   - `otlp_destination.status=planned` and `live_export_enabled=false` by
     default;
   - required env and binding names for future live setup.

## P3 Design Decision

Selected guarded scaffold over live OTLP/D1 writes.

Reason:

- No approved OTLP endpoint, header secret, Worker D1 binding, or eval
  write/read path is configured.
- Live export would create deployment/secret dependencies outside repo-local
  control.
- Current model execution is still guarded, so model token/cost metrics would be
  incomplete.

Tradeoff:

- CI now validates the destination and persistent-store contract.
- Runtime can show whether live wiring is configured.
- It still cannot prove production telemetry export, retention, dashboards, or
  eval analytics queries.

## Verification

Passed:

- `npm run check:observability`
- `npm run check:bindings`
- `npm run check:env`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /observability/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed `/observability/runtime` fields:

```json
{
  "eval_store": {
    "binding_configured": false,
    "binding_name": "AIPHABEE_EVAL_STORE",
    "binding_type": "d1",
    "persistent": true,
    "status": "planned",
    "writes_enabled": false
  },
  "otlp_destination": {
    "endpoint_configured": false,
    "headers_configured": false,
    "live_export_enabled": false,
    "status": "planned"
  }
}
```

## Residual Gaps

- Real OTLP destination and header secret are not configured.
- Worker D1 binding configuration, persistent write/read smoke, dashboards,
  alerting, and retention policy are absent.
- Real model token/cost/latency telemetry remains blocked until model execution
  exists.
