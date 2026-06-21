# Get Event Timeline Tool Scaffold

> **Status**: Verified no-live tool scaffold
> **Last Updated**: 2026-06-21 18:06 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/get-event-timeline-tool-scaffold.contract.md`

This slice adds a Sprint 3.1 no-live `get_event_timeline` scaffold for PRD
§9.2. It returns synthetic company and market event rows with source-linked
related data. It does not read live partner rows, execute SQL, expose arbitrary
URLs, enable frontend UI, or complete the full 16-tool P0 catalog.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Event timeline package | `packages/event-timeline` | Owns no-live `getEventTimeline()` validation, fixture lookup, pagination, and capabilities |
| Shared Tool Registry | `packages/tool-registry` | Registers `get_event_timeline` with `events:read`, source data classes, schema IDs, and bounded retrieval metadata |
| Worker route | `POST /tools/get-event-timeline` | Exposes standard envelope success/error responses |
| MCP runtime | `packages/mcp-runtime` | Validates `tools/call` arguments and bounded retrieval metadata for the registered tool |
| Tool contracts | `deploy/tools/get-event-timeline.contract.json`, `deploy/tools/tool-schemas.contract.json` | Require no-live posture, strict input schema, standard errors, source records, related data, and max row limit |
| Golden fixtures | `tests/golden/tools/fixtures/tool_get_event_timeline_001.json` | Adds a static response fixture for regression coverage |

## P2 Concrete Trace

1. Client sends `POST /tools/get-event-timeline` with `instrument_id`,
   `from`, `to`, optional `types`, `limit`, and `cursor`.
2. Worker normalizes `instrument_id`/`instrumentId` and calls
   `getEventTimeline()`.
3. The tool validates instrument, date range, event types, limit, and cursor.
4. The tool filters synthetic announcement, market-event, financial-disclosure,
   and corporate-action rows.
5. The result includes source record IDs and related data source links, then the
   Worker wraps it in the standard success envelope.

Error trace:

1. Unsupported event types return `403 DATA_NOT_LICENSED`.
2. Held fixtures return `409 DATA_QUALITY_HOLD`.
3. Unsupported date windows return `422 OUT_OF_RANGE`.
4. Over-limit requests return `422 TOO_MANY_ROWS`.
5. Unknown instruments or empty filtered rows return `404 NOT_FOUND`.
6. Invalid input returns `400 SCOPE_DENIED`.

## P3 Design Decision

Selected a standalone `@aiphabee/event-timeline` package rather than extending
`@aiphabee/corporate-actions`.

Reason:

- PRD §9.2 defines `get_event_timeline` as a cross-source tool covering company
  and market events, not only corporate actions.
- Separate ownership keeps event composition, related-data links, and source
  record requirements isolated from the lower-level corporate-action tool.
- Synthetic rows are sufficient to prove schema, pagination, data-quality,
  source-link, and standard-error behavior before partner data rights exist.

Tradeoff:

- The repo now has ten registered no-live tool handlers.
- The full P0 catalog, live event feeds, real document/market integration,
  MCP live execution, and frontend timeline UI remain incomplete.

## Verification

Expected checks for this slice:

- `npm run test -- packages/event-timeline/src/index.test.ts`
- `npm run test -- packages/tool-registry/src/index.test.ts packages/mcp-runtime/src/index.test.ts packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:event-timeline`
- `npm run check:tool-registry`
- `npm run check:tool-schemas`
- `npm run check:mcp-tool-schema-validation`
- `npm run check:mcp-tool-versioning`
- `npm run check:mcp-pagination-limits`
- `npm run check:mcp-usage-envelope`
- `npm run test:golden`
- `npm run typecheck`
- `npm run test`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- Live event timeline reads are absent.
- The full 16-tool P0 catalog is not complete.
- `run_event_study` remains unimplemented.
- Multilingual/newbie-professional mode surfaces remain unimplemented.
- Frontend timeline rendering is delegated outside this Codex slice.
