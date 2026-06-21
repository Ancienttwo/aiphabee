# Model Provider Live Smoke Readiness Notes

## Scope

- Prepared the real AI Gateway smoke command and no-secret evidence shape.
- Updated provider contract to the current Cloudflare AI REST API endpoint.
- Added env/schema/template support for `AI_GATEWAY_SMOKE_MODEL`.
- Kept live model execution and tracker live checkboxes disabled.

## Evidence

- `deploy/model-providers/live-smoke-readiness.contract.json`
- `deploy/model-providers/providers.contract.json`
- `scripts/smoke-ai-gateway-live.mjs`
- `scripts/check-model-provider-live-readiness.mjs`
- `docs/governance/model-provider-live-smoke-readiness.md`

## Verification

- `npm run check:model-provider-live-readiness`
- `npm run check:model-provider`
- `npm run check:env`
- `node scripts/smoke-ai-gateway-live.mjs --dry-run`
- `npm run check`

## Not Claimed

- Live AI Gateway request success.
- Worker model calls.
- `generateText` / `streamText` runtime integration.
- AI Gateway fallback/cache/rate-limit log verification.
- Persistent token/cost log writes.
