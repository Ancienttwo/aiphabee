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
2. Run `npm run check:live-smoke-operator-run-plan`.
3. Run `npm run check:live-smoke-capture-handoff`.
4. Run the credentialed live smoke commands:
   - `npm run smoke:cloudflare-resources-live`
   - `npm run smoke:cloudflare-bindings-wrangler-live`
   - `npm run smoke:ai-gateway-live`
   - `npm run smoke:ai-gateway-observability-live`
   - `npm run smoke:observability-live`
   - `npm run smoke:provider-secret-stores-live`
5. Save each command's already-redacted JSON output outside the repo, then run:

   ```bash
   node scripts/create-live-smoke-capture-packet.mjs \
     --capture-id <capture_id> \
     --redacted-output <redacted-output.json> \
     --runner <redacted-runner> \
     --source-locator <redacted-locator> \
     --exit-code 0
   ```

   Add one or more `--evidence-ref sha256:<hash>` values when the run has
   separate redacted evidence artifacts. If omitted, the generator uses the
   redacted output hash as the packet evidence ref.
6. For `provider_secret_store_rotation`, pass `--cleanup-verified` only after
   the synthetic Cloudflare/GitHub secret values are confirmed absent.
7. Run `npm run check:live-smoke-capture-packets`.
8. Run `npm run check:live-smoke-ledger-update-review` before changing the live
   smoke evidence ledger, then rerun `npm run check:live-smoke-capture-transition-review`
   and `npm run check:live-smoke-evidence-ledger`.

The generator computes `output_sha256`, rejects obvious secret-like redacted
outputs, writes only packet metadata, and reuses the same packet validator as
`npm run check:live-smoke-capture-packets`. Do not paste raw output, account IDs,
resource IDs, API tokens, OTLP headers, provider outputs, prompts, model output
text, or environment values into packet files.
