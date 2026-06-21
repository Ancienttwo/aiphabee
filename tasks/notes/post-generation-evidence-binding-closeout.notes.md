# Post-Generation Evidence Binding Closeout Notes

## What Changed

- Added `validatePostGenerationEvidenceBinding()` to `@aiphabee/agent-runtime`.
- Added `post_generation_evidence_binding` policy to ToolLoop Agent plans.
- Added `POST /agent/runs/validate-answer` in the Worker.
- Upgraded `numeric-source-guard` from planned validation to local deterministic
  post-generation validation.
- Updated product Agent release gate probes so unsourced numeric claims are
  blocked and evidence-card / deterministic-calculation claims pass.
- Added `check:post-generation-evidence-binding` and wired it into root
  `npm run check`.

## Verification

- `npm run check:post-generation-evidence-binding`
- `npm run check:numeric-source-guard`
- `npm run check:product-agent-release-gate`
- `npm run test -- packages/agent-runtime apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:task-sync`
- `npm run check`

## Remaining Gaps

Live model generation, live tool execution, live evidence writes, frontend
rendering, and production `<0.1%` unsourced numeric sampling are not claimed.
