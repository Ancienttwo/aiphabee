# Model Providers

`deploy/model-providers/` contains no-secret model provider contracts. It fixes
the planned Cloudflare AI Gateway + AI SDK v7 execution boundary without
committing API keys, account IDs, gateway IDs, provider keys, or model-call
outputs.

## Verification

```bash
npm run check:model-provider
npm run check:model-provider-live-readiness
node scripts/smoke-ai-gateway-live.mjs --dry-run
node scripts/smoke-ai-gateway-observability-live.mjs --dry-run
```

## Boundary

- `POST /agent/runs/dry-run` remains the only wired Agent Runtime execution
  route.
- `POST /agent/runs/stream` is intentionally guarded until Cloudflare AI Gateway,
  secret stores, budget ledger, and evidence-binding checks are live.
- `POST /agent/model-provider/live-smoke` is a guarded smoke-only route that uses
  the AI SDK OpenAI-compatible provider and returns hash-only evidence.
- `npm run smoke:ai-gateway-live` is the real Cloudflare AI Gateway smoke command;
  it requires `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`,
  `AI_GATEWAY_NAME`, and `AI_GATEWAY_SMOKE_MODEL`, and does not print account
  IDs, gateway IDs, model IDs, raw model output, or secret values.
- The deployed Worker route smoke can be run through
  `npm run smoke:cloudflare-bindings-wrangler-live`; it injects a dedicated
  temporary `AI_GATEWAY_LIVE_SMOKE_TOKEN` Worker secret and removes that smoke
  secret after the route call.
- `npm run smoke:ai-gateway-observability-live` is read-only and checks AI
  Gateway Logs API plus GraphQL analytics. It requires `AI Gateway Read` and
  `Account Analytics Read` permission to return `status=ok`.
