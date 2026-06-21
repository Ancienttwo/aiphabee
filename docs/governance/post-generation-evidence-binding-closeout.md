# Post-Generation Evidence Binding Closeout

> **Status**: Verified local runtime closeout
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/post-generation-evidence-binding-closeout.contract.md`

This slice closes the local A3 requirement that generated answers must run a
post-generation evidence-binding validation step before concrete financial
numbers can be returned. The validator extracts numeric financial claims from a
candidate answer and blocks claims that do not bind to an evidence card, direct
source record, or deterministic calculation.

It does not enable live model generation, live tool execution, live evidence
record writes, frontend evidence-card rendering, or production sampling for the
`<0.1%` unsourced numeric quality target.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime | `packages/agent-runtime` | Owns `validatePostGenerationEvidenceBinding()` and `post_generation_evidence_binding` policy |
| Worker route | `POST /agent/runs/validate-answer` | Accepts candidate answer claims/evidence refs and returns pass/block result |
| ToolLoop plan | `POST /agent/runs/plan` | Exposes validator policy without model/tool execution |
| Product gate | `POST /agent/release-gates/product-agent/plan` | Runs sourced and unsourced probes through the local validator |
| Numeric guard contract | `deploy/agent/numeric-source-guard.contract.json` | Requires local deterministic post-generation validation |
| A3 governance gate | `deploy/governance/post-generation-evidence-binding.contract.json` | Cross-checks runtime, Worker route, tests, contracts, scripts, and tracker |

## P2 Concrete Trace

1. A model or no-model draft answer is represented as answer text or structured
   claims.
2. `POST /agent/runs/validate-answer` normalizes snake/camel case claims,
   evidence cards, and calculation refs.
3. `validatePostGenerationEvidenceBinding()` extracts concrete numeric values
   with financial context.
4. For each numeric claim, the validator requires one of:
   - evidence card with `source_record_id`, `data_version`,
     `methodology_version`;
   - direct claim lineage with `source_record_id`, `data_version`,
     `methodology_version`;
   - deterministic calculation with `calculation_id`,
     `methodology_version`, and source record ids.
5. Missing binding returns `blocked_unsourced_numeric_claim`,
   `output_allowed=false`, and failure code `UNSOURCED_NUMERIC_CLAIM`.

## P3 Design Decision

Selected a deterministic local validator instead of live evidence writes.

Reason:

- Existing `numeric_source_guard` already required tool/calculation sources but
  left post-generation validation as `"planned"`.
- A3 specifically needs the after-generation boundary, so the smallest coherent
  change is a reusable validator plus Worker route.
- Live evidence writes and model execution would cross external runtime and data
  boundaries that are not provisioned in this slice.

Tradeoff:

- Local generated-answer payloads can now be blocked deterministically.
- Production sampling and live evidence persistence remain separate A4/runtime
  work.

## Verification

Required:

- `npm run check:post-generation-evidence-binding`
- `npm run check:numeric-source-guard`
- `npm run check:product-agent-release-gate`
- `npm run test -- packages/agent-runtime apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check`

## Residual Gaps

- Live model generation is disabled.
- Live tool execution and live evidence record writes are disabled.
- Frontend evidence-card rendering is not claimed.
- Production unsourced numeric sampling `<0.1%` remains incomplete.
