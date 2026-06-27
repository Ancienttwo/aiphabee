# Live Smoke Capture Handoff Templates

These templates are for the operator who has credentialed external env. They
validate as `missing_env` packets before execution and must be copied into
`deploy/governance/live-smoke-capture-packets` only after replacing the template
metadata with the redacted result from a real command run.

Required non-inferable env names:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `AI_GATEWAY_SMOKE_MODEL`
- `OTLP_EXPORTER_OTLP_ENDPOINT`
- `OTLP_EXPORTER_OTLP_HEADERS`
- `GITHUB_REPOSITORY`
- `GITHUB_ENVIRONMENT`

Operator order:

1. Run `npm run check:live-smoke-external-env-preflight`.
2. Run `npm run check:live-smoke-capture-handoff`.
3. Run the credentialed live smoke commands:
   - `npm run smoke:cloudflare-resources-live`
   - `npm run smoke:cloudflare-bindings-wrangler-live`
   - `npm run smoke:ai-gateway-live`
   - `npm run smoke:ai-gateway-observability-live`
   - `npm run smoke:observability-live`
   - `npm run smoke:provider-secret-stores-live`
4. Copy each matching template to `deploy/governance/live-smoke-capture-packets`
   as `<capture_id>.capture.json`.
5. Replace `observed_at`, `runner`, `exit_code`, `status`, `output_sha256`,
   `source_locator`, `evidence_refs`, and `cleanup_verified` with redacted
   metadata from the real run. Use `sha256:` refs only. Do not paste raw output,
   account IDs, resource IDs, API tokens, OTLP headers, provider outputs, prompts,
   model output text, or environment values.
6. Run `npm run check:live-smoke-capture-packets`.

The provider secret store template may set `cleanup_verified=true` only after
the synthetic Cloudflare/GitHub secret values are confirmed absent.
