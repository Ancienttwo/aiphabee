# Model Routing Audit Scaffold

> **Status**: Verified no-live model routing audit scaffold
> **Last Updated**: 2026-06-21 04:39 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-model-routing-audit-scaffold.md`
> **Task Contract**: `tasks/contracts/model-routing-audit-scaffold.contract.md`

This slice adds an Agent planner policy for model routing, Cloudflare AI Gateway
audit fields, fallback model-change recording, and cache/redaction constraints.
It does not execute live model calls, stream tokens, write token/cost logs, or
touch frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime | `packages/agent-runtime` | Owns `model_routing_audit` capability and plan output |
| Worker planner | `POST /agent/runs/plan` | Returns model routing audit policy in the standard response envelope |
| Runtime capability | `GET /agent/runtime` | Advertises model routing audit scaffold |
| Model provider guard | `GET /agent/model-provider` | Keeps Cloudflare AI Gateway provider planned and model calls disabled |
| Guard contract | `deploy/agent/model-routing-audit.contract.json` | Requires routing tiers, fallback, audit fields, cache policy, and no-live flags |
| Frontend | Out of scope | No `apps/web` files changed |

## P2 Concrete Trace

1. Caller sends a plan request to `POST /agent/runs/plan`.
2. Worker normalizes the request into `AgentRunSkeletonInput`.
3. Runtime creates the no-model run context and planning policies.
4. Runtime derives `model_routing_audit` from the dry-run model context and
   failure recovery policy version.
5. Planner returns lightweight/main/deterministic-code routing tiers, AI Gateway
   planned provider fields, fallback triggers, model-change audit requirements,
   redacted audit fields, and safe-cache limits.
6. Because live model calls remain disabled, the trace proves audit/fallback
   shape without calling a provider or writing token/cost logs.

## P3 Design Decision

Selected planner-level audit policy instead of enabling live model routing.

Reason:

- Sprint 1.3 needs model routing and model-change audit semantics in the agent
  plan contract.
- Sprint 0.4 still has a separate live model provider execution smoke gap.
- Current runtime is no-model-execution and no-live-streaming.

Tradeoff:

- The policy is deterministic and testable now.
- Live provider execution still needs configured Cloudflare AI Gateway resources
  and secret management.

What fails first at 10x scale:

- Audit logs need compact, redactable hashes and stable model/prompt version
  identifiers before high-volume prompt/result logging can be enabled safely.

## Verification

Passed:

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

Local worker smoke:

- `POST /agent/runs/plan` returns
  `model_routing_audit.status=model_routing_audit_scaffold`,
  `model_calls=false`, `live_model_routing=false`,
  `fallback_policy.records_model_change=true`, and
  `gateway.provider=cloudflare_ai_gateway`.

## Residual Gaps

- Actual live model execution is absent.
- Real AI Gateway request smoke is absent.
- Live token/cost/fallback log writes are absent.
- Frontend Ask/evidence-card rendering remains out of scope.
