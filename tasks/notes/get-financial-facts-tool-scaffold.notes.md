# Notes: get-financial-facts-tool-scaffold

> **Last Updated**: 2026-06-21 02:15 +08
> **Plan**: `plans/plan-get-financial-facts-tool-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/get-financial-facts-tool-scaffold.md`

## Decisions

- Started `get_financial_facts` as a no-live synthetic scaffold in
  `@aiphabee/financial-facts`.
- Reused the existing restatement and point-in-time vocabulary without enabling
  live financial fact storage reads.
- Kept partner/vendor fact rows, filing ingestion, derived ratios, MCP
  endpoints, and frontend out of scope.

## Verification

- `npm run test -- packages/financial-facts/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:financial-facts`
- `npm run check:tool-registry`
- `npm run typecheck`
- `npm run test` -> 13 files, 134 tests passed
- `npm run check`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /tools/get-financial-facts` -> `200 OK`, `status=found`,
  `rowCount=4`, `liveDataAccess=false`
- `GET /tools/runtime` -> `200 OK`, `handler_ready_tool_count=7`,
  `get_financial_facts.status=scaffold`

## Residual Blockers

- Live financial fact reads are absent.
- Partner/vendor financial fact rows and redistribution rights are absent.
- Filing ingestion and document extraction are absent.
- Derived ratio/metric tooling is absent.
- MCP endpoint and protocol tool-call integration are absent.
- Evidence/Lineage service is absent.
