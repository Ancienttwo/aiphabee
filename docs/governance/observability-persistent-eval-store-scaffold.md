# Observability Persistent Eval Store Scaffold

> **Status**: Verified guarded scaffold
> **Last Updated**: 2026-06-22 08:35 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-observability-persistent-eval-store-scaffold.md`
> **Task Contract**:
> `tasks/contracts/observability-persistent-eval-store-scaffold.contract.md`

This slice adds a no-secret scaffold for persistent eval records and OTLP
destination configuration. The D1 resource now exists by name, and the
Cloudflare smoke path can write/read/delete a prompt-free `run.eval`
`EvalStoreRecord`. Product runtime eval writes and OTLP export remain disabled.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Eval-store schema | `packages/observability` | Projects `run.eval` into prompt-free records |
| Eval-store binding | `AIPHABEE_EVAL_STORE` | D1 resource provisioned by name; guarded Worker/Wrangler smoke writes and reads synthetic eval records; product writes remain disabled |
| OTLP destination | `OTLP_EXPORTER_OTLP_ENDPOINT`, `OTLP_EXPORTER_OTLP_HEADERS` | Names-only env contract, no values |
| Runtime capability | `GET /observability/runtime` | Reports planned/configured status and disables writes/export |
| Contract checker | `scripts/check-observability-contract.mjs` | Validates event sinks, env schema, and binding manifest |
| Live export/write | Partial smoke only | No OTLP request, product D1 writes, dashboard, or alerting |

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

Guarded eval-store smoke trace:

1. The smoke path creates dry-run telemetry with no prompt text.
2. `createEvalStoreRecord()` projects `run.eval` into an `EvalStoreRecord`.
3. D1 smoke creates `aiphabee_eval_store_smoke`, writes record metadata and
   `record_json`, reads back `schema_version`, `result`, and `record_json`, then
   deletes/drops the synthetic smoke table.
4. The response returns only status, operation counts, and hashes.

## P3 Design Decision

Selected guarded eval-store smoke over product live OTLP/D1 writes.

Reason:

- No approved OTLP endpoint or header secret is configured.
- Product eval-store writes would create persistence semantics before retention,
  dashboard, and review jobs exist.
- Live export would create deployment/secret dependencies outside repo-local
  control.
- Current model execution is still guarded, so model token/cost metrics would be
  incomplete.

Tradeoff:

- CI now validates the destination and persistent-store contract.
- Runtime can show whether live wiring is configured.
- It still cannot prove production telemetry export, retention, dashboards,
  eval analytics queries, or a post-upgrade live Cloudflare rerun.

## Verification

Passed:

- `npm run check:observability`
- `npm run check:bindings`
- `npm run check:env`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `node scripts/smoke-cloudflare-bindings-wrangler-live.mjs --dry-run`
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
- Product eval-store writes, dashboards, alerting, and retention policy are
  absent. D1 resource-level synthetic write/read has passed in the Cloudflare
  resource smoke slice; the eval-record-specific path is implemented and awaits
  a live rerun with Cloudflare env/account selection.
- Real model token/cost/latency telemetry remains blocked until model execution
  exists.
