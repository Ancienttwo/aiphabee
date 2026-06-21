# Answer Evidence Contract Scaffold Notes

> **Date**: 2026-06-21
> **Owner**: Codex
> **Sprint**: 1.3
> **Tracker Items**: answer structure, AGT-06, AGT-07

## Summary

Added a no-live `answer_evidence_contract` to the Agent planner. It locks PRD
8.3 answer order, AGT-06 claim labels, evidence strength values, and AGT-07
evidence-card payload fields while keeping frontend rendering out of scope.

## Implementation Notes

- `GET /agent/runtime` now advertises `answer_evidence_contract`.
- `POST /agent/runs/plan` now returns `answer_evidence_contract`.
- Ordered answer sections follow PRD 8.3.
- Claim labels are `fact`, `calculation`, `inference`, and `unknown`.
- Facts require evidence cards; calculations require calculation refs;
  inferences require evidence strength; unknowns require missing reasons.
- Evidence-card payloads require source record, data point, document location,
  `as_of`, data version, methodology version, currency, unit, strength, and
  warnings.
- The contract links back to `numeric_source_guard` so unsupported specific
  numbers remain blocked.

## Verification

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
- `POST /agent/runs/plan` smoke through local `wrangler dev` returned
  `ok=true`, `status=planned_no_model`,
  `answer_evidence_contract.status=answer_evidence_contract_scaffold`,
  `frontend_rendering=false`, and `modelCalls=false`.
- `git diff --name-only -- apps/web` returned no frontend diff.

## Residual Gaps

- No live tool results exist yet.
- No post-generation answer parser exists yet.
- No live evidence binding exists yet.
- Frontend evidence-card click behavior remains out of scope.
