# Agent Generated Answer Evidence Smoke

> **Status**: Verified guarded backend smoke
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/agent-generated-answer-evidence-smoke.contract.md`

This slice adds a guarded Agent backend smoke route that exercises generated
answer post-processing against the existing post-generation evidence validator.
It executes the fixed `get_quote_snapshot` Worker route, binds the generated
answer numeric claim to an evidence card built from tool provenance, and proves
the same generated answer text is blocked when no source binding is supplied.

It is not a frontend Ask integration, live model-output corpus, production
sampling job, arbitrary user ToolLoop executor, or persistent evidence/audit
writer.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Worker smoke route | `POST /agent/runs/generated-answer-evidence-smoke` | Guarded by `x-aiphabee-smoke` plus `AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN` |
| Tool execution | `executeRegisteredWorkerToolRouteSmoke()` | Executes fixed `get_quote_snapshot` through the registered Worker route map |
| Source binding | `getFirstSmokeSourceRecord()` | Reads source/data/methodology ids from tool provenance and only returns hashes to callers |
| Validator | `validatePostGenerationEvidenceBinding()` | Allows sourced generated-answer numeric claims and blocks unsourced generated-answer numeric claims |
| Frontend | Out of scope | No `apps/web` changes |

## P2 Concrete Trace

1. Operator calls the smoke route with the fixed header and bearer token.
2. Worker rejects missing header, missing env, or wrong bearer token before tool
   execution or answer validation.
3. Worker executes the fixed Tencent `00700.HK` quote tool route.
4. Worker builds a generated answer numeric claim from the smoke answer text.
5. Worker binds that claim to an evidence card using the tool provenance
   `source_record_id`, `data_version`, and `methodology_version`.
6. Worker validates the sourced claim and expects `output_allowed=true`.
7. Worker validates the same generated answer text without claims/evidence cards
   and expects `UNSOURCED_NUMERIC_CLAIM`.
8. Worker returns only status, counts, hashes, and explicit non-claims.

## P3 Design Decision

Selected a deterministic generated-answer smoke instead of using live model text.

Reason:

- The product invariant is source binding after answer generation; the current
  validator already owns that contract.
- Live model text is nondeterministic and would make the smoke flaky without
  adding evidence-binding coverage.
- The fixed Worker tool route supplies real local provenance while the response
  remains hash-only.

Tradeoff:

- The backend now proves generated-answer numeric claims can be accepted only
  when bound to tool provenance and evidence cards.
- Live model output corpus sampling, frontend evidence-card rendering, and
  persistent writes remain separate slices.

## Verification

- `npm run test -- apps/worker/src/agent-generated-answer-evidence-smoke.test.ts`
- `npm run check:agent-generated-answer-evidence-smoke`
- `npm run typecheck --workspace @aiphabee/worker`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- No live model-output corpus.
- No production/live unsourced numeric sampling.
- No frontend Ask or evidence-card rendering.
- No persistent audit, evidence, or usage-ledger writes.
