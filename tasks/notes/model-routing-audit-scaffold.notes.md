# Model Routing Audit Scaffold Notes

> **Date**: 2026-06-21
> **Owner**: Codex
> **Sprint**: 1.3
> **Tracker Item**: Model routing + AI Gateway audit/fallback

## Summary

Added a no-live `model_routing_audit` policy to the Agent planner. It defines
planned model routing tiers, Cloudflare AI Gateway audit linkage, fallback
model-change recording, safe cache constraints, and redacted audit fields while
keeping model execution disabled.

## Implementation Notes

- `GET /agent/runtime` now advertises `model_routing_audit`.
- `POST /agent/runs/plan` now returns `model_routing_audit`.
- Routing tiers are:
  - `lightweight`: intent detection, security-resolution assist, simple
    formatting, summary draft;
  - `main`: research planning, evidence synthesis, cross-document explanation;
  - `deterministic_code`: financial calculation, screening, structured
    transform, with `model_calls=false`.
- Fallback triggers are `MODEL_TIMEOUT`, `RATE_LIMITED`, and `UPSTREAM_5XX`.
- The policy requires recording fallback model changes.
- Audit fields cover user/workspace/token client/IP risk, tool/version/input
  summary hash/auth policy, dataset/data version/source/cache, model/provider/
  prompt/tokens/cost/latency, output hash, errors, retries, fallback models, and
  human intervention.
- Cache policy allows only safe reusable non-sensitive results.

## Verification

- `npm run check:model-routing-audit`
- `npm run check:model-provider`
- `npm run check:agent-run-context`
- `npm run check:tool-loop-agent`
- `npm run check:pre-tool-call-resolution`
- `npm run check:budget-stop-policy`
- `npm run check:tool-enforcement`
- `npm run check:numeric-source-guard`
- `npm run check:answer-evidence-contract`
- `npm run check:failure-recovery-policy`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `POST /agent/runs/plan` smoke through local `wrangler dev` returned
  `ok=true`, `status=planned_no_model`,
  `model_routing_audit.status=model_routing_audit_scaffold`,
  `live_model_routing=false`, `modelCalls=false`,
  `fallback_policy.records_model_change=true`, and
  `gateway.provider=cloudflare_ai_gateway`.

## Residual Gaps

- No live model calls exist yet.
- No real Cloudflare AI Gateway request smoke exists yet.
- No live token/cost/fallback log writes exist yet.
- Frontend Ask/evidence-card rendering remains out of scope.
