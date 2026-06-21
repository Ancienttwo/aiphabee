# Notes: get-corporate-actions-tool-scaffold

> **Last Updated**: 2026-06-21 02:03 +08
> **Plan**: `plans/plan-get-corporate-actions-tool-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/get-corporate-actions-tool-scaffold.md`

## Decisions

- Added `get_corporate_actions` as a no-live synthetic scaffold in
  `@aiphabee/corporate-actions`.
- Reused the existing action type and adjustment methodology vocabulary without
  expanding live adjustment factor generation.
- Implemented synthetic dividend, split, consolidation, rights, placement, and
  buyback timeline rows.
- Supported type subsets and deterministic limit/cursor pagination.
- Returned adjustment-impact metadata for split-adjusted and
  total-return-adjusted price series.
- Returned standard error states for unlicensed types, quality hold, out of
  range, too many rows, not found, and invalid input.
- Added `POST /tools/get-corporate-actions` with standard success/error
  envelopes.
- Marked `get_corporate_actions` as scaffold-ready in the shared registry.
- Kept partner/vendor rows, live DB reads, public benchmark parity, MCP
  endpoints, and frontend out of scope.

## Verification

- Passed: `npm run test -- packages/corporate-actions/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run check:corporate-actions`
- Passed: `npm run check:tool-registry`
- Passed: `npm run typecheck`
- Passed: `npm run check`
- Passed: `git diff --check`
- Passed: secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`.
- Passed: `scripts/check-task-workflow.sh --strict`
- Passed: Wrangler smoke for `/tools/get-corporate-actions` and `/tools/runtime`.

## Residual Blockers

- Live corporate-action reads are absent.
- Partner/vendor corporate-action rows and redistribution rights are absent.
- Public benchmark parity is absent.
- MCP endpoint and protocol tool-call integration are absent.
- Evidence/Lineage service is absent.
