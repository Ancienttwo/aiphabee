# Numeric Source Guard Scaffold

> **Status**: Verified no-live numeric source guard scaffold
> **Last Updated**: 2026-06-21 04:09 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-numeric-source-guard-scaffold.md`
> **Task Contract**: `tasks/contracts/numeric-source-guard-scaffold.contract.md`

This slice adds an Agent planner guard for concrete financial numbers. It proves
that answer contracts may only use numbers from tool results or deterministic
calculations, and that no-source/model-memory numbers are blocked. It does not
call models, execute tools, bind live evidence, or touch frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime | `packages/agent-runtime` | Owns `numeric_source_guard` capability and plan output |
| Worker planner | `POST /agent/runs/plan` | Returns guard in the standard response envelope |
| Runtime capability | `GET /agent/runtime` | Advertises numeric source guard scaffold |
| Guard contract | `deploy/agent/numeric-source-guard.contract.json` | Requires allowed/blocked sources, answer contract fields, and validation rules |
| Frontend | Out of scope | No `apps/web` files changed |

## P2 Concrete Trace

1. Caller sends a plan request to `POST /agent/runs/plan`.
2. Worker normalizes the request into `AgentRunSkeletonInput`.
3. Runtime validates tools, preflight context, budget policy, and tool
   enforcement.
4. Runtime derives planned numeric source tools from the registered toolset.
5. Runtime derives deterministic calculation gates from price-history and
   financial-facts tools.
6. Planner returns `numeric_source_guard` with current
   `concrete_claims_allowed_now=false` because no actual tool results exist yet.
7. Any future unsupported numeric claim must be blocked with
   `UNSOURCED_NUMERIC_CLAIM` or labeled `unknown`.

## P3 Design Decision

Selected planner-level answer-contract guard instead of real post-generation
validation.

Reason:

- AGT-05 requires a hard source policy before generated answers can safely emit
  financial numbers.
- Current runtime is still no-model/no-tool-execution.
- The planner already knows which tool results and deterministic calculations
  will be eligible numeric sources later.

Tradeoff:

- The contract prevents no-source numeric claims now.
- Actual extraction from generated text must be implemented when model generation
  is enabled.

What fails first at 10x scale:

- Source refs and calculation refs need compact indexes so answer validation does
  not scan large tool result payloads.

## Verification

Passed:

- `npm run test`
- `npm run test:golden`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:agent-run-context`
- `npm run check:tool-loop-agent`
- `npm run check:pre-tool-call-resolution`
- `npm run check:budget-stop-policy`
- `npm run check:tool-enforcement`
- `npm run check:numeric-source-guard`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `git diff --name-only -- apps/web` returned no frontend diff.

Local worker smoke:

- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /agent/runs/plan` with quote snapshot, price history, financial facts,
  and lineage tools returned `ok=true`, `status=planned_no_model`,
  `modelCalls=false`, and `numeric_source_guard.status=guarded_no_actual_results`.

Observed guard fields:

```json
{
  "status": "guarded_no_actual_results",
  "allowedSources": ["tool_result", "deterministic_calculation"],
  "blockedSources": ["model_memory", "training_data", "unverified_prompt", "unstated_source"],
  "failureCode": "UNSOURCED_NUMERIC_CLAIM",
  "concreteClaimsAllowedNow": false,
  "plannedSources": ["get_quote_snapshot", "get_price_history", "get_financial_facts"],
  "calculations": [
    "deterministic_return_risk_v0",
    "deterministic_financial_growth_v0",
    "deterministic_adjusted_price_v0"
  ]
}
```

## Residual Gaps

- Actual tool execution and live tool results are absent.
- Post-generation numeric extraction is absent.
- Live evidence binding is absent.
- Frontend evidence cards and labels remain out of scope.
