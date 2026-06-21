# Answer Evidence Contract Scaffold

> **Status**: Verified no-live answer/evidence contract scaffold
> **Last Updated**: 2026-06-21 04:17 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-answer-evidence-contract-scaffold.md`
> **Task Contract**: `tasks/contracts/answer-evidence-contract-scaffold.contract.md`

This slice adds an Agent planner contract for PRD 8.3 answer structure,
AGT-06 claim labels, and AGT-07 evidence-card payloads. It does not render
frontend cards, execute tools, bind live evidence, or call models.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime | `packages/agent-runtime` | Owns `answer_evidence_contract` capability and plan output |
| Worker planner | `POST /agent/runs/plan` | Returns answer/evidence contract in the standard response envelope |
| Runtime capability | `GET /agent/runtime` | Advertises answer/evidence contract scaffold |
| Guard contract | `deploy/agent/answer-evidence-contract.contract.json` | Requires ordered sections, claim labels, evidence-card fields, and validation rules |
| Frontend | Out of scope | No `apps/web` files changed; rendering/click behavior is delegated |

## P2 Concrete Trace

1. Caller sends a plan request to `POST /agent/runs/plan`.
2. Worker normalizes the request into `AgentRunSkeletonInput`.
3. Runtime validates run context, preflight, budgets, tool enforcement, and
   numeric source guard.
4. Runtime derives `answer_evidence_contract` from PRD 8.3 and planned tool
   sources.
5. Planner returns ordered answer sections, claim label rules, evidence
   strength values, evidence-card required fields, planned card sources, and
   validation rules.
6. Because no tools or model are executed, the contract only proves payload and
   validation shape; it does not produce user-visible answers or cards.

## P3 Design Decision

Selected planner-level contract scaffold instead of generated-answer parsing or
frontend card rendering.

Reason:

- AGT-06/AGT-07 require stable labels and evidence-card shape before live
  generation can safely emit research answers.
- Current runtime is still no-model/no-tool-execution.
- The planner already knows the answer step, planned data sources, numeric guard
  version, and validation rules that downstream answer generation must obey.

Tradeoff:

- Backend payload shape and validation rules are testable now.
- Actual clickable evidence cards remain a frontend integration task.

What fails first at 10x scale:

- Evidence-card payloads need compact claim/card indexes so large answers do not
  duplicate source metadata per sentence.

## Verification

Passed:

- `npm run test`
- `npm run test:golden`
- `npm run check:answer-evidence-contract`
- `npm run check:agent-run-context`
- `npm run check:tool-loop-agent`
- `npm run check:pre-tool-call-resolution`
- `npm run check:budget-stop-policy`
- `npm run check:tool-enforcement`
- `npm run check:numeric-source-guard`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `git diff --name-only -- apps/web` returned no frontend diff.

Local worker smoke:

- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /agent/runs/plan` with quote snapshot, price history, financial facts,
  and lineage tools returned `ok=true`, `status=planned_no_model`,
  `modelCalls=false`, `answer_evidence_contract.status=answer_evidence_contract_scaffold`,
  and `frontend_rendering=false`.

Observed contract fields:

```json
{
  "status": "answer_evidence_contract_scaffold",
  "frontendRendering": false,
  "orderedSections": [
    "direct_answer",
    "data_status",
    "key_evidence",
    "explanation",
    "counter_evidence_risks",
    "sources_methods",
    "next_steps",
    "disclaimer"
  ],
  "requiredClaimLabels": ["fact", "calculation", "inference", "unknown"],
  "evidenceCardPayload": "planned",
  "plannedCardSources": [
    "get_security_profile",
    "get_quote_snapshot",
    "get_price_history",
    "get_financial_facts",
    "get_data_lineage"
  ]
}
```

## Residual Gaps

- Actual frontend evidence-card rendering/click behavior is absent.
- Live tool results and live evidence binding are absent.
- Generated-answer parsing and post-generation validation are absent.
