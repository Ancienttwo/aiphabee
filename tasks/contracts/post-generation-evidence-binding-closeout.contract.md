# Task Contract: Post-Generation Evidence Binding Closeout

## Objective

Close the local A3 requirement that generated answers are checked after
generation and unsourced concrete financial numbers are blocked.

## Acceptance

- Add `deploy/governance/post-generation-evidence-binding.contract.json`.
- Add `npm run check:post-generation-evidence-binding`.
- Export `validatePostGenerationEvidenceBinding()` from
  `@aiphabee/agent-runtime`.
- Expose `POST /agent/runs/validate-answer` in the Worker.
- Upgrade `numeric_source_guard.post_generation_validation` from `planned` to
  `local_deterministic`.
- Ensure unsourced financial numeric claims return
  `UNSOURCED_NUMERIC_CLAIM` and `output_allowed=false`.
- Ensure evidence-card and deterministic-calculation bound numeric claims pass.
- Update only the A3 AGT-05 checkbox; keep the A4 `<0.1%` production sampling
  target unchecked.

## Out Of Scope

- Live model generation.
- Live tool execution.
- Live evidence record writes.
- Frontend evidence-card rendering.
- Production answer sampling / QA statistics.
