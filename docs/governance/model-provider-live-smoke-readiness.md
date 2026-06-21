# Model Provider Live Smoke Readiness

> **Status**: Ready, blocked on live Cloudflare env
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/model-provider-live-smoke-readiness.contract.md`

This slice prepares the live AI Gateway smoke path without claiming a live
model call has succeeded. It updates the model-provider contract to Cloudflare's
current AI Gateway REST API shape and adds a no-secret live smoke command.

References checked:

- [Cloudflare AI Gateway REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/):
  live chat-completion smoke uses `POST /accounts/{account_id}/ai/v1/chat/completions`
  with `Authorization` and `cf-aig-gateway-id`.
- [Cloudflare AI Gateway REST API changelog](https://developers.cloudflare.com/changelog/post/2026-05-21-rest-api/):
  confirms the unified AI REST API and the `cf-aig-gateway-id` header.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Provider contract | `deploy/model-providers/providers.contract.json` | Still planned/no model calls; now includes live smoke readiness metadata |
| Readiness contract | `deploy/model-providers/live-smoke-readiness.contract.json` | Defines endpoint, env, proof fields, and forbidden output fields |
| Live smoke script | `scripts/smoke-ai-gateway-live.mjs` | Sends one fixed prompt only when required env is present |
| Readiness checker | `scripts/check-model-provider-live-readiness.mjs` | No-network check for contract/script/env/tracker consistency |
| Tracker | A5 + Sprint 0.4 live rows | Remain unchecked until an actual live smoke succeeds |

## P2 Concrete Trace

1. `npm run check:model-provider-live-readiness` validates no-secret readiness:
   contract shape, provider contract linkage, env schema/template presence,
   smoke script, package scripts, and tracker not-yet-live state.
2. `npm run smoke:ai-gateway-live` requires:
   `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`,
   `AI_GATEWAY_NAME`, and `AI_GATEWAY_SMOKE_MODEL`.
3. If env is missing, the command exits with `missing_env` and lists names only.
4. If env is present, it sends a fixed minimal request to Cloudflare AI Gateway:
   `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions`.
5. Successful output includes only `http_status`, `gateway_id`, model name,
   latency, token counts, and response/output hashes. It does not print raw
   prompt text, raw model output, or secret values.

## P3 Design Decision

Selected a readiness harness instead of enabling Worker model execution.

Reason:

- Current repo contract has `model_calls_enabled=false`.
- This machine lacks `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and
  `AI_GATEWAY_NAME`.
- A live request is required before the tracker live smoke item can be checked.

Tradeoff:

- The proof command and expected no-secret evidence shape are now explicit.
- Sprint live smoke remains blocked until Cloudflare env and gateway access are
  provided and the smoke command succeeds.

## Verification

Required for this readiness slice:

- `npm run check:model-provider-live-readiness`
- `npm run check:model-provider`
- `npm run check:env`
- `node scripts/smoke-ai-gateway-live.mjs --dry-run`
- `npm run check`

Required before checking the live Sprint item:

- `npm run smoke:ai-gateway-live`
- Evidence must show `status=ok`, HTTP 2xx, gateway id, model id, latency,
  input/output/total tokens, and response/output hashes.

## Residual Gaps

- Live Cloudflare credentials are not configured in this machine environment.
- `AIPHABEE_AI_GATEWAY` remains unprovisioned in the binding contract.
- Worker `model_calls_enabled` remains false.
- `generateText` / `streamText` runtime integration is not enabled.
- AI Gateway fallback/cache/rate-limit log evidence is still missing.
