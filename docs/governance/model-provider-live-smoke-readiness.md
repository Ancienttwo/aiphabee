# Model Provider Live Smoke Readiness

> **Status**: CLI and deployed Worker live smoke passed; log evidence still open
> **Last Updated**: 2026-06-22 07:31 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/model-provider-live-smoke-readiness.contract.md`

This slice proves the live AI Gateway smoke path without enabling product model
calls. It updates the model-provider contract to Cloudflare's current AI
Gateway REST API shape, wires an AI SDK OpenAI-compatible
`generateText`/`streamText` helper, and exposes a guarded Worker live-smoke
route.

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
| Tracker | A5 + Sprint 0.4 live rows | Remain unchecked until AI Gateway log/cost/cache/rate-limit/fallback evidence is complete |

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
- Transient Wrangler OAuth can execute the CLI smoke without committing
  Cloudflare credentials.
- The tracker live smoke item still requires AI Gateway
  request/cost/cache/rate-limit/fallback logs.

Tradeoff:

- The proof command, Worker route, and expected no-secret evidence shape are now
  explicit and covered by local fake-provider tests.
- Sprint live smoke remains blocked until AI Gateway logs/cost/fallback
  evidence are captured.

## Latest CLI Live Evidence

Observed at `2026-06-22 07:20 +08` using transient Wrangler OAuth env only:

- `status=ok`
- `http_statuses=[200, 200]`
- `generateText.exact_output_match=true`
- `streamText.exact_output_match=true`
- `generateText` tokens: input `49`, output `12`, total `61`
- `streamText` tokens: input `49`, output `12`, total `61`
- `streamText.chunk_count=11`
- `gateway_id_hash=sha256:37a8eec1ce19687d132fe29051dca629d164e2c4958ba141d5f4133a33f0688f`
- `model_hash=sha256:e5c87fd81654a8c59736a9c1394a42ce28a88b09561b9faef7cc3a9d7523e2a2`
- `output_hash=sha256:52d2532a33eb1ce82ca41f0a425edd6a975af763e53a8657ed096a1847e6a590`
- `response_hash=sha256:ff2af979fe25d61a65e71f92ce920fce59aa86ac24409cae7071ac277c143f3d`

## Latest Deployed Worker Evidence

Observed at `2026-06-22 07:31 +08` through Wrangler OAuth live harness:

- route: `POST /agent/model-provider/live-smoke`
- worker: `aiphabee-worker`
- `status=ok`
- operation count: `2`
- temporary `AI_GATEWAY_LIVE_SMOKE_TOKEN` secret injected by Wrangler
  `--secrets-file`
- dedicated smoke secret cleanup verified: `true`
- response hash:
  `sha256:908a43d9a0b52e15f06ae890db0c7f131a0c661958a5ac25eb37d449c1cf3a9d`

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

- Evidence must show `status=ok`, HTTP 2xx, gateway/model hashes,
  `generateText`/`streamText` token counts, and response/output hashes.
- AI Gateway logs must show real request, cost/token, rate-limit/cache/fallback
  evidence before the A5 and Sprint live checkboxes can be checked.

## Residual Gaps

- Long-lived live Cloudflare credentials are not configured in this machine
  environment or committed to repo artifacts.
- Product Worker `model_calls_enabled` remains false.
- CLI and deployed Worker `generateText` / `streamText` integration are
  live-verified against Cloudflare.
- AI Gateway fallback/cache/rate-limit log evidence is still missing.
