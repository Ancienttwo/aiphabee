# Evidence Lineage Service Scaffold

> **Status**: Verified no-write service scaffold
> **Last Updated**: 2026-06-21 02:54 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-evidence-lineage-service-scaffold.md`
> **Task Contract**:
> `tasks/contracts/evidence-lineage-service-scaffold.contract.md`

This slice adds the Sprint 1.2 Evidence/Lineage service scaffold. It can plan
how a tool call maps to source records, data version, methodology version, and
a user-visible citation. It does not write to the database, emit SQL, load
partner rows, expose an MCP protocol endpoint, serve runtime schemas, replay
live tool routes, or touch frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Evidence-lineage package | `packages/evidence-lineage` | Owns no-write evidence record and source-ref planner |
| Worker runtime | `GET /evidence/runtime` | Reports service capabilities and live-write disabled state |
| Worker planner | `POST /evidence/records/plan` | Converts tool/source metadata into standard no-write response envelope |
| Evidence contract | `deploy/evidence/service.contract.json` | Requires routes, tables, citation fields, and no-live booleans |
| Database schema | `supabase/migrations/20260621024500_evidence_lineage_service_scaffold.sql` | Creates empty evidence/source-ref/governance tables only |
| Database contract | `deploy/database/migrations.contract.json` | Registers the migration as local contract state |
| Frontend | Out of scope | No `apps/web` files changed |

## P2 Concrete Trace

1. Caller sends `POST /evidence/records/plan` with `tool_name`,
   `request_id`, tool schema IDs, `data_version`, `methodology_version`, and
   one or more `source_records`.
2. Worker normalizes snake_case/camelCase input and calls
   `createEvidenceRecordPlan()`.
3. The planner validates `toolName`, `requestId`, `asOf`, and source records.
4. The planner creates a stable `evidenceRecordId`, source ref IDs, default-deny
   rights state, and user-visible citation metadata.
5. Worker returns a standard success envelope with `status=planned_no_write`,
   `liveDbWrites=false`, `sqlEmitted=false`, provenance, usage, and no DB side
   effect.

## P3 Design Decision

Selected a no-write service planner plus empty durable schema before live
persistence.

Reason:

- Sprint 1.2 needs service-level linkage between tool calls and evidence before
  Agent answers can make citation claims.
- The system should prove the exact lineage envelope before partner source rows
  and rights rules are authorized.
- Live DB writes would make rights/default-deny and partner-data semantics too
  easy to blur at this stage.

Tradeoff:

- Tool-call lineage shape is now executable and contract-checked.
- The service is still not a live audit log, MCP endpoint, schema-serving
  surface, or frontend evidence card backend.

What fails first at 10x scale:

- Static source record inputs will not be enough; the next scalable step is a
  real source-record catalog and idempotent write path with rights checks.

## Verification

Passed:

- `npm run test -- packages/evidence-lineage/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:evidence-service`
- `npm run check:database`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `GET /evidence/runtime` -> `200 OK`
- `POST /evidence/records/plan` -> `200 OK`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, `packages`, and `tests`
- `git diff --name-only -- apps/web` returned no changed files
- `scripts/check-task-workflow.sh --strict`

Observed route fields:

```json
{
  "runtime": {
    "status": "evidence_lineage_service_scaffold",
    "tables": ["aiphabee_core.evidence_record", "aiphabee_core.evidence_source_ref"],
    "liveDbWrites": false,
    "sourceRecordLinking": true
  },
  "plan": {
    "status": "planned_no_write",
    "toolName": "get_financial_facts",
    "sourceRefs": 1,
    "citation": "FY2023 financial facts",
    "liveDbWrites": false,
    "sqlEmitted": false
  }
}
```

## Residual Gaps

- Live DB writes are disabled.
- Partner/vendor source records are absent.
- MCP protocol endpoint integration is absent.
- Runtime schema serving is absent.
- Live route replay is absent.
- Frontend citation/evidence card rendering is out of scope for this Codex
  slice.
