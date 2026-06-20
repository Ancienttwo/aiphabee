# Resolve Security Tool Scaffold

> **Status**: Verified no-live tool scaffold
> **Last Updated**: 2026-06-21 00:40 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-resolve-security-tool-scaffold.md`
> **Task Contract**:
> `tasks/contracts/resolve-security-tool-scaffold.contract.md`

This slice adds the first atomic Sprint 1.2 data tool scaffold. It resolves
synthetic security identifiers and names without reading the database, executing
SQL, loading partner rows, enabling MCP endpoints, or touching frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Security tools package | `packages/security-tools` | Owns no-live `resolveSecurity()` fixture resolver |
| Shared Tool Registry | `packages/tool-registry` | Marks `resolve_security` as scaffold-ready with live access disabled |
| Worker route | `POST /tools/resolve-security` | Exposes standard envelope result/error responses |
| Tool contract | `deploy/tools/resolve-security.contract.json` | Requires lookup forms, candidates, no silent guessing, and no SQL/URL |
| Live security master | Absent | Synthetic fixtures only; no Supabase/Hyperdrive reads |

## P2 Concrete Trace

Resolved trace:

1. Client sends `POST /tools/resolve-security` with `query=00700.HK`.
2. Worker calls `resolveSecurity()`.
3. Resolver normalizes the query and matches the synthetic security master
   alias set.
4. Resolver returns `status=resolved`,
   `selectedInstrumentId=eq_hk_00700`, one candidate, provenance, and zero
   credits.
5. Worker wraps the result in the shared success envelope.

Ambiguous trace:

1. Client sends `query=ABC`.
2. Resolver finds two synthetic candidates.
3. Resolver returns `status=ambiguous`, both candidates, and no
   `selectedInstrumentId`.
4. Worker returns `200 OK` so the caller can disambiguate instead of receiving
   a silent guess.

Error trace:

1. Unknown identifiers return `404 NOT_FOUND`.
2. Empty queries return `400 SCOPE_DENIED`.
3. Both paths use the shared error envelope and zero usage.

## P3 Design Decision

Selected a synthetic no-live resolver before live security master reads.

Reason:

- Sprint 1.2 needs `resolve_security` semantics before downstream tools can
  accept stable `instrument_id`.
- Partner-approved data rows and live Serving reads are still absent.
- Synthetic fixtures are enough to prove code/name/history matching and
  ambiguity behavior without expanding redistribution risk.

Tradeoff:

- The system now has one executable atomic tool scaffold.
- Production identifier coverage, DB-backed point-in-time lookup, and MCP/API
  tool-call integration remain incomplete.

## Verification

Passed:

- `npm run test -- packages/security-tools/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:security-tools`
- `npm run check:tool-registry`
- `npm run typecheck`
- `npm run test`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `POST /tools/resolve-security` -> `200 OK`
- `GET /tools/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed route fields:

```json
{
  "resolved": {
    "status": "resolved",
    "selectedInstrumentId": "eq_hk_00700",
    "liveDataAccess": false
  },
  "ambiguous": {
    "status": "ambiguous",
    "selectedInstrumentId": null,
    "candidateCount": 2
  },
  "runtime": {
    "handler_ready_tool_count": 1,
    "execution_ready": false
  }
}
```

## Residual Gaps

- Live security master reads are absent.
- Partner-approved security master rows are absent.
- MCP endpoint and protocol tool-call integration are absent.
- Other Sprint 1.2 tool handlers are absent.
- Evidence/Lineage service is absent.
