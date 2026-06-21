# Task Contract: Model Provider Live Smoke Readiness

## Objective

Prepare a no-secret, executable live AI Gateway smoke path without claiming that
the live model-provider Sprint item is complete.

## Acceptance

- Add `deploy/model-providers/live-smoke-readiness.contract.json`.
- Add `scripts/smoke-ai-gateway-live.mjs`.
- Add `npm run check:model-provider-live-readiness`.
- Add `npm run smoke:ai-gateway-live` as the manual live command.
- Update `deploy/model-providers/providers.contract.json` with the Cloudflare AI
  REST API endpoint, `cf-aig-gateway-id` header, and live smoke proof fields.
- Add `AI_GATEWAY_SMOKE_MODEL` to env schema and blank env templates.
- Keep `model_calls_enabled=false` and all live Sprint checkboxes unchecked.
- Ensure smoke output excludes secrets, raw prompt text, and raw model output.

## Out Of Scope

- Enabling Worker model calls.
- Calling `generateText` or `streamText` from Worker runtime.
- Provisioning Cloudflare AI Gateway resources.
- Storing Cloudflare credentials.
- Checking the live AI Gateway tracker item.
- Frontend Ask rendering.
