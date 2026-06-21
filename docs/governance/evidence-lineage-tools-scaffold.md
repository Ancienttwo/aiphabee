# Evidence Lineage Tools Scaffold

> **Status**: Verified no-live tool scaffold
> **Last Updated**: 2026-06-21 02:33 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-evidence-lineage-tools-scaffold.md`
> **Task Contract**:
> `tasks/contracts/evidence-lineage-tools-scaffold.contract.md`

This slice adds the final two registered Sprint 1.2 tool handlers:
`get_data_lineage` and `get_entitlements`. They return synthetic evidence
lineage and entitlement scope without reading the database, executing SQL,
loading partner/vendor rows, enabling MCP endpoints, implementing durable
Evidence/Lineage service storage, or touching frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Evidence-lineage package | `packages/evidence-lineage` | Owns no-live lineage fixtures and entitlement tool facade |
| Data Access Gateway | `packages/data-access-gateway` | Compiles synthetic entitlement rows and evaluates field decisions |
| Shared Tool Registry | `packages/tool-registry` | Marks `get_data_lineage` and `get_entitlements` as scaffold-ready with live access disabled |
| Worker routes | `POST /tools/get-data-lineage`, `POST /tools/get-entitlements` | Expose standard envelope result/error responses |
| Tool contract | `deploy/tools/evidence-lineage.contract.json` | Requires lineage/scope fields, status coverage, standard errors, and no SQL/URL |
| Live evidence source | Absent | Synthetic fixtures only; no durable service tables or partner rows |

## P2 Concrete Trace

Lineage trace:

1. Client sends `POST /tools/get-data-lineage` with `evidence_id` or
   `record_id`.
2. Worker calls `getDataLineage()`.
3. The tool validates lookup and optional `as_of`.
4. The tool returns synthetic source, batch, record, version, formula,
   quality-state, and upstream lineage metadata.
5. Worker wraps found results in the shared success envelope, maps held lineage
   to `DATA_QUALITY_HOLD`, unknown lookups to `NOT_FOUND`, and invalid lookup
   input to `SCOPE_DENIED`.

Entitlements trace:

1. Client sends `POST /tools/get-entitlements` with workspace, channel, tool or
   dataset, fields, limits, and optional time range.
2. Worker calls `getEntitlements()`.
3. The tool compiles synthetic data/workspace/subscription entitlement rows
   through `createPolicyFromEntitlementRows()`.
4. The tool evaluates requested fields through `evaluateDataAccessRequest()`.
5. Worker wraps scope results in the shared success envelope, maps denied
   scope, unlicensed data, row limits, time limits, and invalid input to
   standard errors.

## P3 Design Decision

Selected no-live self-check tools rather than a durable Evidence/Lineage
service.

Reason:

- Sprint 1.2 requires the registered tool set to be executable before the
  Agent runtime can rely on tool metadata consistently.
- Gateway entitlement compiler already exists and should remain the single
  policy-evaluation source.
- Synthetic lineage fixtures prove source/batch/version/formula shape without
  committing to service storage or partner-source semantics.

Tradeoff:

- The system now has nine executable no-live registered tool handlers.
- Durable evidence storage, precise JSON Schema files, per-tool golden fixture
  artifacts, MCP protocol integration, and live source rows remain incomplete.

## Verification

Passed:

- `npm run test -- packages/evidence-lineage/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:evidence-lineage`
- `npm run check:tool-registry`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /tools/get-data-lineage` -> `200 OK`
- `POST /tools/get-entitlements` -> `200 OK`
- `GET /tools/runtime` -> `200 OK`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`
- `git diff --name-only -- apps/web` returned no changed files
- `scripts/check-task-workflow.sh --strict`

Observed route fields:

```json
{
  "data_lineage": {
    "status": "found",
    "dataset": "financial_facts",
    "sourceBatchId": "batch-financial-facts-20240401",
    "liveDataAccess": false
  },
  "entitlements": {
    "status": "found",
    "decision": "allow_with_redactions",
    "allowedFields": ["revenue"],
    "deniedFields": ["capital_expenditure"],
    "liveDataAccess": false
  },
  "runtime": {
    "handler_ready_tool_count": 9,
    "get_data_lineage": "scaffold",
    "get_entitlements": "scaffold"
  }
}
```

## Residual Gaps

- Durable Evidence/Lineage service storage is absent.
- Live entitlement DB reads are absent.
- Partner/vendor source records and redistribution rights are absent.
- MCP endpoint and protocol tool-call integration are absent.
- Tool JSON Schema bodies and golden fixture files remain incomplete.
