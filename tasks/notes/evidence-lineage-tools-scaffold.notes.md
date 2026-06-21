# Notes: evidence-lineage-tools-scaffold

> **Last Updated**: 2026-06-21 02:33 +08
> **Plan**: `plans/plan-evidence-lineage-tools-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/evidence-lineage-tools-scaffold.md`

## Decisions

- Added `@aiphabee/evidence-lineage` as the no-live package for both
  `get_data_lineage` and `get_entitlements`.
- Reused `createPolicyFromEntitlementRows()` and `evaluateDataAccessRequest()`
  for entitlement scope checks instead of introducing a second entitlement
  evaluator.
- Kept durable Evidence/Lineage storage, live entitlement DB reads,
  partner/vendor source rows, MCP endpoints, and frontend out of scope.

## Verification

- `npm run test -- packages/evidence-lineage/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:evidence-lineage`
- `npm run check:tool-registry`
- `npm run typecheck`
- `npm run check` -> 14 files, 148 tests passed
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /tools/get-data-lineage` -> `200 OK`, `status=found`,
  `dataset=financial_facts`, `liveDataAccess=false`
- `POST /tools/get-entitlements` -> `200 OK`, `status=found`,
  `decision=allow_with_redactions`, `liveDataAccess=false`
- `GET /tools/runtime` -> `200 OK`, `handler_ready_tool_count=9`,
  `get_data_lineage.status=scaffold`, `get_entitlements.status=scaffold`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`
- No lingering `wrangler dev`, `workerd`, or workflow helper process after
  verification

## Residual Blockers

- Durable Evidence/Lineage service storage is absent.
- Live entitlement DB reads are absent.
- Partner/vendor source records and redistribution rights are absent.
- MCP endpoint and protocol tool-call integration are absent.
- Per-tool precise JSON Schema bodies and golden fixture files remain absent.
