# Model Providers

`deploy/model-providers/` contains no-secret model provider contracts. It fixes
the planned Cloudflare AI Gateway + AI SDK v7 execution boundary without
committing API keys, account IDs, gateway IDs, provider keys, or model-call
outputs.

## Verification

```bash
npm run check:model-provider
```

## Boundary

- `POST /agent/runs/dry-run` remains the only wired Agent Runtime execution
  route.
- `POST /agent/runs/stream` is intentionally guarded until Cloudflare AI Gateway,
  secret stores, budget ledger, and evidence-binding checks are live.
