# Agent Model Execution Audit Smoke Contract

## Goal

Add a guarded backend smoke for Sprint 1.3 that proves live model execution can
feed a redacted Agent `run.audit` preview without claiming persistent audit,
evidence, usage-ledger, or frontend completion.

## Scope

- Add guarded `POST /agent/runs/model-execution-audit-smoke`.
- Require `x-aiphabee-smoke=agent-model-execution-audit-v1`.
- Require `AIPHABEE_AGENT_MODEL_AUDIT_SMOKE_TOKEN`.
- Reuse `runAiGatewayLiveSmoke()` to execute one `generateText` call and one
  `streamText` call through Cloudflare AI Gateway.
- Return hash-only model/provider/prompt/output references, token counts,
  latency, and a redacted `run.audit` preview.
- Keep AI Gateway log/cost/cache/rate-limit/fallback evidence explicitly
  blocked by missing read permissions.
- Add contract/checker/test and connect to root `npm run check`.

## Explicit Non-Goals

- No frontend work.
- No general ToolLoop live execution.
- No generated-answer evidence-card binding.
- No AI Gateway Logs API or GraphQL analytics read claim.
- No live evidence, audit, or usage-ledger writes.
- No fallback/cost/cache/rate-limit verification beyond explicit blockers.

## Verification

- `npm run test -- apps/worker/src/agent-model-execution-audit-smoke.test.ts`
- `npm run check:agent-model-execution-audit-smoke`
- `npm run typecheck --workspace @aiphabee/worker`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
