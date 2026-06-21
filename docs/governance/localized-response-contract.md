# Localized Response Contract

> **Status**: Verified no-live answer presentation contract
> **Last Updated**: 2026-06-21 18:56 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/localized-response-contract.contract.md`

This slice adds a Sprint 3.1 no-live Agent response-presentation contract for
AGT-11, AGT-12, US-W07, and PRD §12.4. It advertises Traditional Chinese,
Simplified Chinese, and English output modes, supports newbie/professional
response depth, and exposes a bilingual financial terminology glossary. It
does not call models, translate live text, render frontend controls, or change
underlying data/evidence.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime | `packages/agent-runtime` | Owns supported locales, response-depth modes, terminology glossary, and data/methodology invariants |
| Worker planner | `POST /agent/runs/plan` | Accepts locale/depth inputs and returns normalized presentation contract in the standard envelope |
| Runtime capability | `GET /agent/runtime` | Advertises `response_presentation` readiness and supported modes |
| Contract gate | `deploy/agent/localized-response.contract.json` | Requires AGT-11/AGT-12/§12.4 coverage, glossary terms, validation rules, and no-live posture |
| Frontend | Out of scope | No `apps/web` files changed; UI language/mode switch remains delegated |

## P2 Concrete Trace

1. Caller sends `POST /agent/runs/plan` with `locale`/`response_locale` or
   `language`, plus optional `response_depth`.
2. Worker normalizes snake_case/camelCase request fields into
   `AgentRunSkeletonInput`.
3. Agent runtime validates the dry-run context, tool plan, numeric guard, and
   answer evidence contract.
4. `answer_evidence_contract.presentation` normalizes locale to `zh-Hant`,
   `zh-Hans`, or `en`, and depth to `newbie` or `professional`.
5. The returned contract states that locale/depth changes preserve numeric
   values, source record IDs, evidence refs, methodology versions, currency,
   units, and conclusions.
6. The glossary returns bilingual/English terms with methodology-note and
   source-record requirements for numeric claims.

## P3 Design Decision

Selected an Agent planner contract instead of generated translation output.

Reason:

- Current Agent runtime is explicitly no-model/no-tool-execution.
- The PRD acceptance risk is data drift across language or depth switches, not
  UI copy quality.
- The answer/evidence contract already owns claim labels, evidence refs, and
  numeric-source requirements, so presentation invariants belong there.

Tradeoff:

- The repo can prove language/depth requests preserve data/evidence contract
  shape.
- It cannot yet prove live translation quality, rendered language toggles, or
  generated answer copy.

## Verification

Expected checks for this slice:

- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:localized-response`
- `npm run typecheck`
- `npm run test`
- `npm run check`
- `git diff --check`
- `git diff --name-only -- apps/web`
- `scripts/check-task-workflow.sh --strict`

Known local blocker:

- `npm run check` reaches `npm run build` after passing lint, typecheck, tests,
  golden regression, and contract checks, then fails only at delegated
  `@aiphabee/web` Vite build because Node v22.12.0 lacks
  `node:module.registerHooks`.

## Residual Gaps

- Frontend language/mode controls remain delegated.
- Actual generated-answer translation and post-generation locale validation
  remain absent.
- Live model execution remains disabled.
