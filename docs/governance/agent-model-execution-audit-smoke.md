# Agent Model Execution Audit Smoke

> **Status**: Verified guarded backend smoke
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/agent-model-execution-audit-smoke.contract.md`

This slice adds a guarded Agent backend smoke route that executes the existing
Cloudflare AI Gateway live smoke and turns the result into a redacted
`run.audit` preview. It proves the Agent backend can collect model-call token
counts, latency, output hashes, and model-provider fields from a real
`generateText` plus `streamText` execution path.

It does not read AI Gateway logs, prove cost/cache/rate-limit/fallback records,
write usage-ledger rows, write persistent audit rows, bind generated model
output to evidence cards, or render frontend Ask.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Worker smoke route | `POST /agent/runs/model-execution-audit-smoke` | Guarded by `x-aiphabee-smoke` plus `AIPHABEE_AGENT_MODEL_AUDIT_SMOKE_TOKEN` |
| Model provider helper | `runAiGatewayLiveSmoke()` | Executes AI SDK `generateText` and `streamText` through Cloudflare AI Gateway |
| Model routing audit policy | `deploy/agent/model-routing-audit.contract.json` | Supplies required audit fields and fallback policy expectations |
| Observability contract | `deploy/observability/events.contract.json` | Supplies `run.audit` required fields and forbidden payload classes |
| Frontend | Out of scope | No `apps/web` changes |

## P2 Concrete Trace

1. Operator calls the smoke route with the fixed header and bearer token.
2. Worker rejects missing header, missing env, or wrong bearer token before any
   model request.
3. Authorized route calls `runAiGatewayLiveSmoke()` with configured AI Gateway
   account, gateway, model, and token.
4. The helper executes one `generateText` request and one `streamText` request.
5. Worker sums input/output/total token counts and latency from both calls.
6. Worker returns a hash-only `run.audit` preview with model-provider fields,
   model/prompt/output hashes, token counts, and explicit AI Gateway log
   evidence blockers.

## P3 Design Decision

Selected a guarded Agent audit smoke instead of declaring the existing provider
route sufficient.

Reason:

- Sprint 1.3 needs Agent run audit readiness, not only provider reachability.
- Existing AI Gateway smoke already proves request execution, so the smallest
  coherent step is to convert that proof into an Agent audit preview.
- AI Gateway Logs API and GraphQL analytics still require external permissions,
  so cost/cache/rate-limit/fallback evidence must remain blocked rather than
  guessed from the request response.

Tradeoff:

- The Agent backend can now prove live model execution feeds redacted audit
  fields.
- Release still needs AI Gateway read permissions and persistent log/evidence
  writes before the A5/Sprint 1.3 live audit claim can close.

## Verification

Required:

- `npm run test -- apps/worker/src/agent-model-execution-audit-smoke.test.ts`
- `npm run check:agent-model-execution-audit-smoke`
- `npm run typecheck --workspace @aiphabee/worker`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- AI Gateway log/cost/cache/rate-limit/fallback evidence is blocked by missing
  `AI Gateway Read` and `Account Analytics Read` permissions.
- No persistent audit, evidence, or usage-ledger writes are enabled.
- No generated-answer evidence binding is claimed by this smoke.
- Frontend Ask rendering remains delegated.
