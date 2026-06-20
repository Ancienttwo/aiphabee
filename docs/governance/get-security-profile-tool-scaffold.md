# Get Security Profile Tool Scaffold

> **Status**: Verified no-live tool scaffold
> **Last Updated**: 2026-06-21 01:05 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-get-security-profile-tool-scaffold.md`
> **Task Contract**:
> `tasks/contracts/get-security-profile-tool-scaffold.contract.md`

This slice adds the second atomic Sprint 1.2 data tool scaffold. It returns
synthetic security profile metadata without reading the database, executing SQL,
loading partner rows, enabling MCP endpoints, implementing Evidence/Lineage, or
touching frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Security tools package | `packages/security-tools` | Owns no-live `getSecurityProfile()` fixture lookup |
| Shared Tool Registry | `packages/tool-registry` | Marks `get_security_profile` as scaffold-ready with live access disabled |
| Worker route | `POST /tools/get-security-profile` | Exposes standard envelope result/error responses |
| Tool contract | `deploy/tools/get-security-profile.contract.json` | Requires profile fields, listing states, coverage metadata, and no SQL/URL |
| Live security master | Absent | Synthetic fixtures only; no Supabase/Hyperdrive reads |

## P2 Concrete Trace

Listed trace:

1. Client sends `POST /tools/get-security-profile` with
   `instrument_id=eq_hk_00700`.
2. Worker calls `getSecurityProfile()`.
3. The tool finds the synthetic profile fixture.
4. The tool returns `status=found`, `listingStatus=listed`, `currency=HKD`,
   coverage metadata, provenance, and zero credits.
5. Worker wraps the result in the shared success envelope.

Suspended trace:

1. Client sends `instrument_id=eq_hk_08001`.
2. The tool returns the synthetic suspended profile and marks quote snapshot
   coverage as unavailable.
3. Worker returns `200 OK` with live data disabled.

Error trace:

1. Unknown `instrument_id` returns `404 NOT_FOUND`.
2. Empty `instrument_id` returns `400 SCOPE_DENIED`.
3. Both paths use the shared error envelope and zero usage.

## P3 Design Decision

Selected synthetic no-live profile fixtures before live security master reads.

Reason:

- Sprint 1.2 needs `get_security_profile` after `resolve_security` so
  downstream tools can depend on stable `instrument_id` profile metadata.
- Partner-approved rows and live Serving reads are still absent.
- Listed/suspended/delisted fixtures are enough to prove profile status,
  currency, lifecycle, and coverage semantics without expanding redistribution
  risk.

Tradeoff:

- The system now has two executable atomic tool scaffolds.
- Production profile coverage, DB-backed point-in-time lookup, Evidence/Lineage,
  and MCP/API tool-call integration remain incomplete.

## Verification

Passed:

- `npm run test -- packages/security-tools/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check`
- `npm run check:security-tools`
- `npm run check:tool-registry`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`
- `scripts/check-task-workflow.sh --strict`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `POST /tools/get-security-profile` -> `200 OK`
- `GET /tools/runtime` -> `200 OK`

Observed route fields:

```json
{
  "profile": {
    "status": "found",
    "listingStatus": "listed",
    "currency": "HKD",
    "liveDataAccess": false
  },
  "suspended": {
    "status": "found",
    "listingStatus": "suspended",
    "quoteSnapshotCoverage": "unavailable"
  },
  "runtime": {
    "handler_ready_tool_count": 3,
    "execution_ready": false
  }
}
```

## Residual Gaps

- Live security master reads are absent.
- Partner-approved security master rows are absent.
- MCP endpoint and protocol tool-call integration are absent.
- Quote, price, corporate action, financial facts, lineage, and entitlement
  handlers are absent.
- Evidence/Lineage service is absent.
