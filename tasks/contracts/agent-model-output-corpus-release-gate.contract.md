# Agent Model Output Corpus Release Gate Contract

## Intent

Create a no-write release gate that links local unsourced numeric sampling,
generated-answer evidence binding, model execution audit, live model streaming
readiness, eval v1, and live-smoke evidence ledger before any production/live
model output corpus sampling claim.

## In Scope

- Add `POST /agent/release-gates/model-output-corpus/plan`.
- Expose `agent_model_output_corpus_release_gate` from `GET /agent/runtime`.
- Link:
  - `deploy/observability/unsourced-numeric-sampling.contract.json`
  - `deploy/agent/generated-answer-evidence-smoke.contract.json`
  - `deploy/agent/model-execution-audit-smoke.contract.json`
  - `deploy/agent/live-model-streaming-release-gate.contract.json`
  - `deploy/observability/eval-v1.contract.json`
  - `deploy/governance/live-smoke-evidence-ledger.contract.json`
- Return `linked_evidence`, `evidence_requirements`, `release_checks`,
  `release_gate`, and `validation`.
- Keep `live_model_output_corpus_enabled=false`.
- Keep `production_sampling_enabled=false`.
- Keep `persistent_eval_writes=false`.
- Keep `model_calls=false`.
- Keep `frontend_rendering=false`.
- Keep `persistent_writes=false`.
- Keep `release_transition_allowed=false`.
- Add migration, deploy contract, checker, unit tests, and tracker/todo updates.

## Out of Scope

- Live model output corpus ingestion.
- Partner-approved production corpus.
- Production/live generated-answer sampling.
- Persistent eval writes.
- Raw model output storage.
- Frontend Ask or evidence-card rendering.
- Production model-routing cutover.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts`
- `npm run test -- apps/worker/src/index.test.ts`
- `npm run check:agent-model-output-corpus-release-gate`
- `npm run check:unsourced-numeric-sampling`
- `npm run check:agent-generated-answer-evidence-smoke`
- `npm run check:agent-model-execution-audit-smoke`
- `npm run check:agent-live-model-streaming-release-gate`
- `npm run check:eval-v1`
- `npm run check:live-smoke-evidence-ledger`
- `npm run check:database`
