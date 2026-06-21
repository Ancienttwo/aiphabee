# Task Contract: Model Provider Live Smoke Readiness

## Objective

Prepare a no-secret, executable live AI Gateway smoke path and guarded Worker
runtime route without claiming that the live model-provider Sprint item is
complete.

## Acceptance

- Add `deploy/model-providers/live-smoke-readiness.contract.json`.
- Add `scripts/smoke-ai-gateway-live.mjs`.
- Add `npm run check:model-provider-live-readiness`.
- Add `npm run smoke:ai-gateway-live` as the manual live command.
- Add `@aiphabee/agent-runtime` helper coverage for AI SDK
  `generateText`/`streamText` through Cloudflare AI Gateway's OpenAI-compatible
  REST shape.
- Add guarded Worker `POST /agent/model-provider/live-smoke` route that returns
  names-only missing env and hash-only success/failure evidence.
- Update `deploy/model-providers/providers.contract.json` with the Cloudflare AI
  REST API endpoint, `cf-aig-gateway-id` header, and live smoke proof fields.
- Add `AI_GATEWAY_SMOKE_MODEL` to env schema and blank env templates.
- Keep `model_calls_enabled=false` and all live Sprint checkboxes unchecked.
- Ensure smoke output excludes secrets, raw prompt text, and raw model output.

## Out Of Scope

- Enabling product Worker model calls.
- Proving deployed Worker live smoke against real Cloudflare env.
- Provisioning Cloudflare AI Gateway resources.
- Storing Cloudflare credentials.
- Checking the live AI Gateway tracker item.
- Frontend Ask rendering.
