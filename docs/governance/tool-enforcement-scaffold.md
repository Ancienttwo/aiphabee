# Tool Enforcement Scaffold

> **Status**: Verified no-live Agent tool enforcement scaffold
> **Last Updated**: 2026-06-21 04:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-tool-enforcement-scaffold.md`
> **Task Contract**: `tasks/contracts/tool-enforcement-scaffold.contract.md`

This slice adds explicit Agent planner enforcement for registered, versioned,
permission-aware tools. It does not execute tools, call models, serve MCP schemas,
or touch frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Tool Registry | `packages/tool-registry` | Authoritative source for tool names, versions, schemas, permissions, execution flags, and data classes |
| Agent runtime | `packages/agent-runtime` | Projects registry metadata into run context, planned tool calls, and `tool_enforcement` |
| Worker planner | `POST /agent/runs/plan` | Returns enforcement state inside the standard response envelope |
| Worker dry-run | `POST /agent/runs/dry-run` | Rejects unregistered SQL/URL tool names before planning |
| Enforcement contract | `deploy/agent/tool-enforcement.contract.json` | Requires registration, version, schema, permission, no-SQL/URL, and no-live checks |
| Frontend | Out of scope | No `apps/web` files changed |

## P2 Concrete Trace

1. Caller sends `tools` to `POST /agent/runs/plan` or `/agent/runs/dry-run`.
2. Worker normalizes the request into `AgentRunSkeletonInput`.
3. Runtime validates requested tool names through Tool Registry.
4. If a requested tool is unregistered, runtime throws `UNREGISTERED_TOOL`; Worker
   returns `403` with standard `SCOPE_DENIED`.
5. For registered tools, runtime loads registry metadata into `run_context.toolset`.
6. Planned tool calls carry version, schema IDs, required scope, data classes,
   rights-aware flag, no SQL/URL flags, and no-live execution state.
7. Planner returns `tool_enforcement` with all required checks and per-tool
   `allowed` status.

## P3 Design Decision

Selected planner-level enforcement metadata instead of live executor enforcement.

Reason:

- The system still has no live tool execution boundary.
- Existing Tool Registry is already the authoritative source for tool version,
  schema, permission, and execution posture.
- Future live executor can consume the same `tool_enforcement` shape instead of
  rediscovering policy.

Tradeoff:

- AGT-04 now has a testable no-live contract.
- Enforcement is still a planning contract; runtime execution-time checks must be
  repeated when actual tools are enabled.

What fails first at 10x scale:

- Registry metadata and live entitlement decisions must be cached and audited per
  run once many tenants and channels are active.

## Verification

Passed:

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:tool-enforcement`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- `npm run check:agent-run-context && npm run check:tool-loop-agent && npm run check:pre-tool-call-resolution && npm run check:budget-stop-policy && npm run check:tool-enforcement`
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /agent/runs/plan` registered tools -> `tool_enforcement.status=allowed`
- `POST /agent/runs/dry-run` `sql.query` / `http.fetch` -> `403 SCOPE_DENIED`
- `git diff --name-only -- apps/web` returned no changed files

Observed route fields:

```json
{
  "allowed": {
    "status": "allowed",
    "registeredToolCount": 9,
    "allChecksPassed": true,
    "deniedTools": [],
    "toolCallNoSqlUrl": true
  },
  "denied": {
    "status": 403,
    "error": "SCOPE_DENIED",
    "tools": ["sql.query", "http.fetch"]
  }
}
```

## Residual Gaps

- Actual tool execution is absent.
- Runtime schema serving and MCP protocol endpoints are absent.
- Live entitlement DB reads are absent.
- Frontend Ask and evidence cards remain out of scope.
