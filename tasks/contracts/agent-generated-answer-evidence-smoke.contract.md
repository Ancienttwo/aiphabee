# Agent Generated Answer Evidence Smoke Contract

## Goal

Add a guarded backend smoke for Sprint 1.3 that proves generated answer numeric
claims are allowed only when the generated answer is bound to evidence-card
provenance, while the same generated answer text is blocked when unsourced.

## Scope

- Add guarded `POST /agent/runs/generated-answer-evidence-smoke`.
- Require `x-aiphabee-smoke=agent-generated-answer-evidence-v1`.
- Require `AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN`.
- Execute the fixed Tencent `00700.HK` `get_quote_snapshot` Worker tool route.
- Build one deterministic generated-answer numeric claim.
- Bind the generated-answer claim to an evidence card using tool provenance.
- Validate the sourced answer with `validatePostGenerationEvidenceBinding()`.
- Validate the same answer text without source binding and require
  `UNSOURCED_NUMERIC_CLAIM`.
- Return a hash-only summary with no answer text, raw instrument, raw source id,
  raw tool payload, or token.
- Add contract/checker/test and connect to root `npm run check`.

## Explicit Non-Goals

- No frontend work.
- No live model-output corpus.
- No arbitrary user ToolLoop execution.
- No user-facing live model token streaming.
- No production/live unsourced numeric sampling.
- No live audit, evidence, or usage-ledger writes.

## Verification

- `npm run test -- apps/worker/src/agent-generated-answer-evidence-smoke.test.ts`
- `npm run check:agent-generated-answer-evidence-smoke`
- `npm run typecheck --workspace @aiphabee/worker`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
