# Tool Schema Contract Scaffold

> **Status**: Verified local schema contract
> **Last Updated**: 2026-06-21 02:39 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-tool-schema-contract-scaffold.md`
> **Task Contract**:
> `tasks/contracts/tool-schema-contract-scaffold.contract.md`

This slice adds a local JSON Schema contract for all 9 registered Sprint 1.2
tools. It fixes input/output schema IDs, standard response envelope fields, and
machine-readable error codes without enabling runtime validation, MCP protocol
schema serving, generated types, live data access, or frontend changes.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Schema contract | `deploy/tools/tool-schemas.contract.json` | Owns local input/output JSON Schema objects for all registered tools |
| Contract checker | `scripts/check-tool-schemas-contract.mjs` | Validates schema IDs, envelope fields, error enum, and no SQL/URL inputs |
| Shared Tool Registry | `packages/tool-registry` | Continues to advertise schema IDs; runtime behavior is unchanged |
| Runtime validation | Absent | No request validation or MCP schema serving is enabled in this slice |

## P2 Concrete Trace

1. `npm run check:tool-schemas` reads
   `deploy/tools/tool-schemas.contract.json`.
2. The checker verifies every registered tool has `tool.<tool>.input.v0` and
   `tool.<tool>.output.v0`.
3. The checker verifies output schemas require `ok`, `request_id`, `as_of`,
   `market_status`, `provenance`, `usage`, and `data`.
4. The checker verifies the error schema contains machine-readable standard
   error codes.
5. The checker rejects arbitrary `sql`, `sql_text`, `url`, or `endpoint` input
   properties.

## P3 Design Decision

Selected a local schema contract before runtime schema serving.

Reason:

- All 9 no-live handlers are now present, so schema consistency is the next
  acceptance gap.
- The registry already names schema IDs; a local contract closes the metadata
  gap without changing runtime behavior.
- Runtime validators and MCP schema serving need a separate compatibility pass.

Tradeoff:

- Schema IDs and envelope/error shape are now checkable.
- The system still does not validate live requests against JSON Schema or serve
  schemas through MCP.

## Verification

Passed:

- `npm run check:tool-schemas`
- `npm run check`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`
- `git diff --name-only -- apps/web` returned no changed files
- `scripts/check-task-workflow.sh --strict`

Observed checker fields:

```json
{
  "schema_pairs": 9,
  "status": "ok",
  "tools": 9
}
```

## Residual Gaps

- Runtime JSON Schema validation is absent.
- MCP protocol schema serving is absent.
- Generated TypeScript types are absent.
- Per-tool golden fixture files and response validation remain absent.
- Durable Evidence/Lineage service storage is absent.
