# Tool Route Replay Readiness

> **Status**: Blocked on live protocol, DB writes, and partner rows
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/tool-route-replay-readiness.contract.md`

This slice adds a Sprint 1.2 readiness ledger for moving from static golden
fixtures to route replay and live execution. It now consumes the local
Worker-level route replay contract, but it still does not enable MCP live
protocol execution, live DB writes, or partner source rows. Runtime schema
serving is represented by the `mcp_runtime_schema_snapshot` validated surface
and remains no-live.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| P0 catalog | `deploy/tools/p0-tool-catalog.contract.json` | Owns 16-tool cross-surface consistency |
| Tool schemas | `deploy/tools/tool-schemas.contract.json` | Owns strict local input/output envelopes |
| MCP contracts | `deploy/mcp/*.contract.json` | Own local schema/runtime-schema/version/pagination/usage/protocol posture |
| Agent enforcement | `deploy/agent/tool-enforcement.contract.json` | Owns registered-tool/no-arbitrary-SQL/URL guard |
| Evidence service | `deploy/evidence/service.contract.json` | Owns no-write evidence/source-ref planner |
| Golden manifest | `tests/golden/tools/manifest.json` | Owns one synthetic fixture per P0 tool |
| Tool route replay | `deploy/governance/sprint1-tool-route-replay.contract.json` | Owns local Worker route replay evidence |
| Readiness ledger | `deploy/governance/sprint1-tool-route-replay-readiness.contract.json` | Owns remaining live blockers and no-release claim |

## P2 Concrete Trace

1. `npm run check:tool-route-replay-readiness` reads the readiness contract.
2. The checker loads the P0 catalog, registry, tool schema, MCP schema
   validation/runtime-schema/versioning/pagination/usage/protocol, Agent
   enforcement, Evidence/Lineage service, Evidence/Lineage tools, tool route
   replay contract, and golden manifest.
3. It verifies all 16 PRD §9.2 tool names still align across the local catalog
   surfaces.
4. It verifies local server-orchestrated route replay is backed by
   `apps/worker/src/tool-route-replay.test.ts` and
   `deploy/governance/sprint1-tool-route-replay.contract.json`.
5. It verifies the remaining live blockers remain explicit:
   `mcp_live_protocol_execution`, `live_db_writes`, and `partner_source_rows`.
6. It keeps `release_transition_allowed=false` and requires the Sprint 1.2 DoD
   line to remain unchecked until the live evidence exists.

## P3 Design Decision

Selected a blocker ledger that can advance one evidence surface at a time.

The local registry/schema/MCP/golden surfaces are useful and deterministic, but
static fixtures alone did not exercise a server route. The route replay contract
now proves local Worker route replay against the canonical golden projection,
while the readiness ledger keeps MCP live protocol execution, live DB writes,
and partner source rows blocked until their own evidence exists.

At 10x scale, tool drift fails first at the P0 catalog and readiness checker:
adding a tool to schemas, MCP, golden fixtures, or enforcement without keeping
the route replay/readiness ledgers in sync blocks the root check.

## Verification

Expected checks for this slice:

- `npm run check:tool-route-replay-readiness`
- `npm run check:tool-route-replay`
- `npm run check:tool-route-replay-readiness-fixtures`
- `npm run check:p0-tool-catalog`
- `npm run check:tool-schemas`
- `npm run check:mcp-tool-schema-validation`
- `npm run check:mcp-runtime-schema-snapshot`
- `npm run check:mcp-protocol-release-gate`
- `npm run check:evidence-service`
- `npm run test:golden`
- `npm run check`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- MCP live protocol execution is absent.
- Evidence/Lineage live DB writes are absent.
- Partner source rows and data-owner signoff are absent.
