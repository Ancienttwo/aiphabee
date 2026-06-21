# Notes: localized-response-contract

> **Last Updated**: 2026-06-21 18:56 +08
> **Runtime Evidence**:
> `docs/governance/localized-response-contract.md`

## Decisions

- Implemented localization as an Agent answer-presentation contract because the
  runtime remains no-model/no-tool-execution.
- Treated locale and response depth as presentation-only choices that cannot
  change numeric values, source record IDs, evidence refs, methodology
  versions, currency, units, or conclusions.
- Added the terminology glossary to `answer_evidence_contract.presentation` so
  financial terms carry bilingual labels and methodology-note requirements
  next to evidence and claim-label rules.
- Kept frontend language/mode controls, generated translation, live model
  calls, and post-generation validation out of scope.

## Verification

- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:localized-response`
- `npm run typecheck`
- `npm run test`
- `npm run check` -> passes lint/typecheck/tests/golden/contracts, reaches
  `npm run build`, then fails only at delegated `@aiphabee/web` Vite build
  because Node v22.12.0 lacks `node:module.registerHooks`
- `git diff --check`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Frontend language/depth switching remains delegated.
- Actual generated-answer translation and locale post-validation remain absent.
- Live model execution remains disabled.
