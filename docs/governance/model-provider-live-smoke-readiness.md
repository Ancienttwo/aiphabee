# Model Provider Live Smoke Readiness

> **Status**: Ready, blocked on live Cloudflare env
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/model-provider-live-smoke-readiness.contract.md`

This slice prepares the live AI Gateway smoke path without claiming a live
Cloudflare model call has succeeded. It updates the model-provider contract to
Cloudflare's current AI Gateway REST API shape, wires an AI SDK
OpenAI-compatible `generateText`/`streamText` helper, and exposes a guarded
Worker live-smoke route.

References checked:

- [Cloudflare AI Gateway REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/):
  live chat-completion smoke uses `POST /accounts/{account_id}/ai/v1/chat/completions`
  with `Authorization` and `cf-aig-gateway-id`.
- [Cloudflare AI Gateway REST API changelog](https://developers.cloudflare.com/changelog/post/2026-05-21-rest-api/):
  confirms the unified AI REST API and the `cf-aig-gateway-id` header.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Provider contract | `deploy/model-providers/providers.contract.json` | Product model calls remain disabled; now includes live smoke readiness metadata |
| Readiness contract | `deploy/model-providers/live-smoke-readiness.contract.json` | Defines endpoint, env, proof fields, and forbidden output fields |
| Agent Runtime helper | `packages/agent-runtime/src/index.ts` | Uses AI SDK `createOpenAICompatible`, `generateText`, and `streamText` with `cf-aig-gateway-id` |
| Worker route | `POST /agent/model-provider/live-smoke` | Guarded by `x-aiphabee-smoke: model-provider-live-v1`; returns missing env without secrets |
| Live smoke script | `scripts/smoke-ai-gateway-live.mjs` | Runs the same SDK execution boundary only when required env is present |
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
4. If env is present, it creates an AI SDK OpenAI-compatible provider with
   base URL `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1`
   and header `cf-aig-gateway-id`.
5. The smoke executes both `generateText` and `streamText` against
   `/ai/v1/chat/completions` with one fixed minimal prompt.
6. Successful output includes only status, HTTP status list, gateway/model/prompt
   hashes, token counts, latency, operation count, and response/output hashes.
   It does not print raw prompt text, raw model output, account ID, model ID,
   gateway ID, or secret values.

## P3 Design Decision

Selected a guarded smoke-only runtime path instead of enabling product Worker
model execution.

Reason:

- Current product runtime contract has `model_calls_enabled=false`.
- This machine lacks `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and
  `AI_GATEWAY_NAME`.
- A live request is required before the tracker live smoke item can be checked.

Tradeoff:

- The proof command, Worker route, and expected no-secret evidence shape are now
  explicit and covered by local fake-provider tests.
- Sprint live smoke remains blocked until Cloudflare env/gateway access are
  provided, the live command succeeds, and deployed Worker smoke evidence plus
  AI Gateway logs/cost/fallback evidence are captured.

## Verification

Required for this readiness slice:

- `npm run check:model-provider-live-readiness`
- `npm run check:model-provider`
- `npm run check:env`
- `node scripts/smoke-ai-gateway-live.mjs --dry-run`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check`

Required before checking the live Sprint item:

- `npm run smoke:ai-gateway-live`
- Deployed Worker `POST /agent/model-provider/live-smoke` must return
  `status=ok` with no raw identifiers or model output.
- Evidence must show `status=ok`, HTTP 2xx, gateway/model hashes,
  `generateText`/`streamText` token counts, and response/output hashes.
- AI Gateway logs must show real request, cost/token, rate-limit/cache/fallback
  evidence before the A5 and Sprint live checkboxes can be checked.

## Residual Gaps

- Live Cloudflare credentials are not configured in this machine environment.
- `AIPHABEE_AI_GATEWAY` remains unprovisioned in the binding contract.
- Product Worker `model_calls_enabled` remains false.
- `generateText` / `streamText` integration is locally tested through fake
  OpenAI-compatible responses but not live-verified against Cloudflare.
- AI Gateway fallback/cache/rate-limit log evidence is still missing.
