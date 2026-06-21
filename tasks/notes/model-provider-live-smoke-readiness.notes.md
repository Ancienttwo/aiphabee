# Model Provider Live Smoke Readiness Notes

## Scope

- Prepared the real AI Gateway smoke command and no-secret evidence shape.
- Added `@aiphabee/agent-runtime` AI SDK OpenAI-compatible helper for
  `generateText` and `streamText`.
- Added guarded Worker `POST /agent/model-provider/live-smoke` route that returns
  missing env without secrets and only hash-based live proof on success.
- Ran the CLI live smoke through transient Wrangler OAuth env; both
  `generateText` and `streamText` returned HTTP 200, exact output match, and
  token counts.
- Ran the deployed Worker live-smoke route through the Wrangler functional
  smoke harness; `POST /agent/model-provider/live-smoke` returned `status=ok`
  with hash-only evidence.
- Injected `AI_GATEWAY_LIVE_SMOKE_TOKEN` as a dedicated temporary Worker secret
  through Wrangler `--secrets-file` and verified cleanup by secret-list boolean
  check.
- Added read-only AI Gateway observability probe for Logs API and GraphQL
  analytics. Current Wrangler OAuth can execute model requests but returns
  permission-denied evidence for Logs API / account analytics reads.
- Updated provider contract to the current Cloudflare AI REST API endpoint.
- Added env/schema/template support for `AI_GATEWAY_SMOKE_MODEL`.
- Kept product model execution and tracker live checkboxes disabled.

## Evidence

- `deploy/model-providers/live-smoke-readiness.contract.json`
- `deploy/model-providers/providers.contract.json`
- `scripts/smoke-ai-gateway-live.mjs`
- `scripts/smoke-ai-gateway-observability-live.mjs`
- `scripts/check-model-provider-live-readiness.mjs`
- `packages/agent-runtime/src/index.ts`
- `apps/worker/src/index.ts`
- `docs/governance/model-provider-live-smoke-readiness.md`

## Verification

- `npm run check:model-provider-live-readiness`
- `npm run check:model-provider`
- `npm run check:env`
- `node scripts/smoke-ai-gateway-live.mjs --dry-run`
- `node scripts/smoke-ai-gateway-observability-live.mjs --dry-run`
- Current live observability probe: `status=permission_denied`, Logs API HTTP
  `403`, GraphQL HTTP `200` with authorization error.
- `CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... AI_GATEWAY_NAME=... AI_GATEWAY_SMOKE_MODEL=... npm run smoke:cloudflare-bindings-wrangler-live`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check`

## Claimed

- CLI AI Gateway live request success through `npm run smoke:ai-gateway-live`
  equivalent env.
- AI SDK `generateText` and `streamText` both live-verified through Cloudflare AI
  Gateway with hash-only evidence.
- Deployed Worker `POST /agent/model-provider/live-smoke` success with
  hash-only evidence.

## Not Claimed

- Product Worker model calls.
- AI Gateway Logs API read success.
- GraphQL AI Gateway analytics read success.
- AI Gateway fallback/cache/rate-limit log verification.
- Persistent token/cost log writes.
