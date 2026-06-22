# Tool Route Replay

> **Status**: Local Worker route replay verified
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/tool-route-replay.contract.md`

This slice exercises every PRD §9.2 P0 golden tool fixture through the actual
Worker route surface. It closes the local server-orchestrated route replay gap
without claiming MCP live protocol execution, live DB writes, partner source
rows, or frontend work.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Worker entrypoint | `apps/worker/src/index.ts` | Owns Hono route handlers and response envelopes |
| Route replay test | `apps/worker/src/tool-route-replay.test.ts` | Calls `app.request()` for 16 tool fixtures |
| Golden manifest | `tests/golden/tools/manifest.json` | Owns fixture request and canonical expected response projection |
| Replay contract | `deploy/governance/sprint1-tool-route-replay.contract.json` | Owns 16-tool route map and no-live claims |
| Contract checker | `scripts/check-tool-route-replay-contract.mjs` | Cross-checks route map, fixtures, test source, Worker source, and root check wiring |
| Readiness ledger | `deploy/governance/sprint1-tool-route-replay-readiness.contract.json` | Consumes replay contract and keeps remaining release blockers explicit |

## P2 Concrete Trace

1. `npm run test -- apps/worker/src/tool-route-replay.test.ts` loads
   `tests/golden/tools/manifest.json`.
2. Each manifest sample loads its fixture request and expected response.
3. The test maps the fixture `tool_name` to the real Worker route, then calls
   `app.request(route, POST, json, x-request-id=<golden request_id>)`.
4. The route handler parses the same request body used by the fixture and
   returns a standard success envelope.
5. The test asserts HTTP 200, `Cache-Control: no-store`, stable request id,
   provenance, schema/data version, methodology version, status,
   `liveDataAccess=false`, and usage rows.
6. Runtime-only fields are normalized: dynamic envelope `as_of` is asserted as a
   string, route capability metadata is ignored, and camelCase route
   `dataVersion`/`methodologyVersion` are projected to fixture snake_case.

## P3 Design Decision

Selected a Worker-level replay harness instead of rewriting tool handlers to
emit fixture-shaped payloads.

The route response is a superset of the golden fixture: runtime routes expose
capability metadata and handler-native camelCase fields, while golden fixtures
store a canonical response projection for regression checks. Preserving this
boundary keeps existing route consumers stable while proving that each P0 route
still returns the same canonical status, lineage, version, and no-live posture.

At 10x scale, drift fails first in `TOOL_ROUTES` versus the manifest. The
contract checker blocks missing routes, missing fixtures, stale root-check
wiring, and Worker route removals before the readiness ledger can advance.

## Verification

- `npm run test -- apps/worker/src/tool-route-replay.test.ts`
- `npm run check:tool-route-replay`
- `npm run check:tool-route-replay-readiness`
- `npm run check:tool-route-replay-readiness-fixtures`
- `npm run test:golden`
- `npm run check`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- MCP live protocol execution is absent.
- Evidence/Lineage live DB writes are absent.
- Partner source rows and data-owner signoff are absent.
- Partner-approved production corpus remains separate from synthetic golden
  route replay.
