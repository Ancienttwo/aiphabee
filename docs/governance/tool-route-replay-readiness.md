# Tool Route Replay Readiness

> **Status**: Blocked live route replay, locally guarded
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/tool-route-replay-readiness.contract.md`

This slice adds a Sprint 1.2 readiness ledger for moving from static golden
fixtures to live route replay. It does not enable MCP live protocol execution,
live route replay, live DB writes, or partner source rows. Runtime schema
serving is now represented by the `mcp_runtime_schema_snapshot` validated
surface and remains no-live.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| P0 catalog | `deploy/tools/p0-tool-catalog.contract.json` | Owns 16-tool cross-surface consistency |
| Tool schemas | `deploy/tools/tool-schemas.contract.json` | Owns strict local input/output envelopes |
| MCP contracts | `deploy/mcp/*.contract.json` | Own local schema/runtime-schema/version/pagination/usage/protocol posture |
| Agent enforcement | `deploy/agent/tool-enforcement.contract.json` | Owns registered-tool/no-arbitrary-SQL/URL guard |
| Evidence service | `deploy/evidence/service.contract.json` | Owns no-write evidence/source-ref planner |
| Golden manifest | `tests/golden/tools/manifest.json` | Owns one synthetic fixture per P0 tool |
| Readiness ledger | `deploy/governance/sprint1-tool-route-replay-readiness.contract.json` | Owns remaining live-route blockers and no-release claim |

## P2 Concrete Trace

1. `npm run check:tool-route-replay-readiness` reads the readiness contract.
2. The checker loads the P0 catalog, registry, tool schema, MCP schema
   validation/runtime-schema/versioning/pagination/usage/protocol, Agent
   enforcement, Evidence/Lineage service, Evidence/Lineage tools, and golden
   manifest.
3. It verifies all 16 PRD §9.2 tool names still align across the local catalog
   surfaces.
4. It verifies the live blockers remain explicit:
   `mcp_live_protocol_execution`, `live_route_replay`, `live_db_writes`, and
   `partner_source_rows`.
5. It keeps `release_transition_allowed=false` and requires the Sprint 1.2 DoD
   line to remain unchecked until the live evidence exists.

## P3 Design Decision

Selected a blocker ledger instead of pretending static fixtures prove live route
parity.

The local registry/schema/MCP/golden surfaces are useful and deterministic, but
they do not exercise a server orchestration path or real partner rows. The
smallest coherent change is to make that boundary machine-checkable so future
work can replace the blocker values with evidence-backed transitions.

At 10x scale, tool drift fails first at the P0 catalog and readiness checker:
adding a tool to schemas, MCP, golden fixtures, or enforcement without keeping
the route replay ledger in sync blocks the root check.

## Verification

Expected checks for this slice:

- `npm run check:tool-route-replay-readiness`
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
- Server-orchestrated live route replay is absent.
- Evidence/Lineage live DB writes are absent.
- Partner source rows and data-owner signoff are absent.
