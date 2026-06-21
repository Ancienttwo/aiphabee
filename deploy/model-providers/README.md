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
```

## Boundary

- `POST /agent/runs/dry-run` remains the only wired Agent Runtime execution
  route.
- `POST /agent/runs/stream` is intentionally guarded until Cloudflare AI Gateway,
  secret stores, budget ledger, and evidence-binding checks are live.
- `npm run smoke:ai-gateway-live` is the real Cloudflare AI Gateway smoke command;
  it requires `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`,
  `AI_GATEWAY_NAME`, and `AI_GATEWAY_SMOKE_MODEL`, and does not print raw model
  output or secret values.
