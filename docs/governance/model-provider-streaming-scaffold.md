# Model Provider Streaming Scaffold

> **Status**: Verified guarded scaffold
> **Last Updated**: 2026-06-20 15:25 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-model-provider-streaming-scaffold.md`
> **Task Contract**: `tasks/contracts/model-provider-streaming-scaffold.contract.md`

This slice defines the no-secret model provider and streaming execution boundary
for Agent Runtime. It does not make model calls.

References checked:

- [AI SDK v7 Cloudflare Workers AI provider](https://ai-sdk.dev/v7/providers/community-providers/cloudflare-workers-ai):
  `generateText` and `streamText` are the relevant text execution APIs.
- [AI SDK v7 `stopWhen` / `isStepCount`](https://ai-sdk.dev/v7/cookbook/guides/rag-chatbot):
  multi-step calls use `stopWhen: isStepCount(...)`.
- [Cloudflare AI Gateway REST API update](https://developers.cloudflare.com/changelog/post/2026-05-21-rest-api/):
  AI Gateway exposes unified REST endpoints including OpenAI-compatible chat,
  responses, and Anthropic-compatible messages.
- [Cloudflare AI Gateway logging](https://developers.cloudflare.com/ai-gateway/integrations/coding-agents/):
  live validation should confirm gateway logs include model, token count, and
  latency.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Model provider contract | `deploy/model-providers/providers.contract.json` | AI SDK v7 APIs, Cloudflare AI Gateway plan, execution modes, and policy |
| Contract checker | `scripts/check-model-provider-contract.mjs` | Validates no-secret provider shape and disabled model-call policy |
| Shared error code | `MODEL_PROVIDER_NOT_CONFIGURED` | Standard error when streaming is requested before provider provisioning |
| Capability route | `GET /agent/model-provider` | Reports AI Gateway planned, `generateText` planned, `streamText` guarded |
| Stream guard | `POST /agent/runs/stream` | Returns 503 without reading provider secrets or calling a model |
| Live model execution | Absent | No `generateText`, `streamText`, AI Gateway REST call, token usage, or model output |

## P2 Concrete Trace

Model provider contract trace:

1. `npm run check:model-provider` runs
   `scripts/check-model-provider-contract.mjs`.
2. The checker reads `deploy/model-providers/providers.contract.json`.
3. It confirms:
   - AI SDK target is `7.0.0-beta.182`;
   - execution APIs include `generateText` and `streamText`;
   - Cloudflare AI Gateway is planned with required env names;
   - dry-run is wired, generate text is planned, stream text is guarded;
   - live model calls and streaming are disabled;
   - no token-like or secret-like values are committed.
4. It returns `status=ok`.

Runtime capability trace:

1. `GET /agent/model-provider` enters the Hono Worker.
2. Worker returns a success envelope with:
   - `ai_gateway.provider=cloudflare_ai_gateway`;
   - `ai_gateway.status=planned`;
   - `model_calls_enabled=false`;
   - `streaming_enabled=false`;
   - `execution_modes.stream_text.status=guarded`.

Stream guard trace:

1. `POST /agent/runs/stream` enters the Hono Worker.
2. Worker does not parse model/provider credentials and does not call AI SDK.
3. Worker returns 503 with `MODEL_PROVIDER_NOT_CONFIGURED`.

## P3 Design Decision

Selected a guarded streaming scaffold instead of real `streamText` execution.

Reason:

- Cloudflare AI Gateway and provider secrets are not provisioned.
- Budget ledger and evidence-binding checks are not implemented.
- PRD financial-output controls require generated numbers to be evidence-bound;
  a live model call before those gates would widen risk without completing a
  safe user-visible path.

Tradeoff:

- This completes the Sprint 0.4 model-provider/streaming contract leaf.
- It does not complete live streaming, token/cost logging, fallback, budget
  enforcement, or generated-output validation.

## Verification

Passed:

- `npm run check:model-provider`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /agent/model-provider` -> `200 OK`
- `POST /agent/runs/stream` -> `503 MODEL_PROVIDER_NOT_CONFIGURED`
- `scripts/check-task-workflow.sh --strict`

Observed `/agent/model-provider` response fields:

```json
{
  "ai_gateway": {
    "provider": "cloudflare_ai_gateway",
    "status": "planned",
    "unified_billing": true
  },
  "model_calls_enabled": false,
  "streaming_enabled": false
}
```

## Residual Gaps

- Live Cloudflare AI Gateway request is not executed.
- `generateText` / `streamText` are not called.
- Token/cost/latency logging through AI Gateway is not verified.
- Budget ledger, fallback policy, and evidence-binding validation remain absent.
