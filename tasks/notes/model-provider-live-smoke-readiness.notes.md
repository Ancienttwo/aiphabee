# Model Provider Live Smoke Readiness Notes

## Scope

- Prepared the real AI Gateway smoke command and no-secret evidence shape.
- Added `@aiphabee/agent-runtime` AI SDK OpenAI-compatible helper for
  `generateText` and `streamText`.
- Added guarded Worker `POST /agent/model-provider/live-smoke` route that returns
  missing env without secrets and only hash-based live proof on success.
- Updated provider contract to the current Cloudflare AI REST API endpoint.
- Added env/schema/template support for `AI_GATEWAY_SMOKE_MODEL`.
- Kept product model execution and tracker live checkboxes disabled.

## Evidence

- `deploy/model-providers/live-smoke-readiness.contract.json`
- `deploy/model-providers/providers.contract.json`
- `scripts/smoke-ai-gateway-live.mjs`
- `scripts/check-model-provider-live-readiness.mjs`
- `packages/agent-runtime/src/index.ts`
- `apps/worker/src/index.ts`
- `docs/governance/model-provider-live-smoke-readiness.md`

## Verification

- `npm run check:model-provider-live-readiness`
- `npm run check:model-provider`
- `npm run check:env`
- `node scripts/smoke-ai-gateway-live.mjs --dry-run`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check`

## Not Claimed

- Live AI Gateway request success.
- Product Worker model calls.
- Deployed Worker AI Gateway live smoke success.
- AI Gateway fallback/cache/rate-limit log verification.
- Persistent token/cost log writes.
