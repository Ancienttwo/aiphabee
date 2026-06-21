# MCP Tool Versioning Scaffold

> **Plan**: `plans/plan-mcp-tool-versioning-scaffold.md`
> **Task Contract**: `tasks/contracts/mcp-tool-versioning-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/tool-versioning.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/tool-registry` | Owns tool lifecycle, public versions, and deprecation policy |
| `@aiphabee/mcp-runtime` | Projects lifecycle metadata into MCP `tools/list` descriptors |
| `GET /tools/runtime` | Reports registry versioning/deprecation readiness |
| `GET /mcp/runtime` | Reports MCP versioning/deprecation readiness |
| `POST /mcp` `tools/list` | Returns versioned tool descriptors when rights are confirmed |
| `deploy/mcp/tool-versioning.contract.json` | Guards MCP-05 version/deprecation posture |

Out of scope:

- `apps/web`
- live Developer Console version UI
- multiple historical major versions
- live client compatibility smoke
- live MCP tool execution

## P2: Concrete Trace

1. Tool Registry defines lifecycle metadata for each registered tool:
   `publicVersion`, `majorVersion`, deprecation status, minimum notice, and
   old-major support window.
2. `GET /tools/runtime` exposes versioning and deprecation policy readiness.
3. MCP runtime capabilities expose `tool_versioning_ready=true`,
   `deprecation_policy_ready=true`, and `breaking_changes_require_new_major=true`.
4. When rights are confirmed for `tools/list`, MCP descriptors include
   `public_version`, `major_version`, deprecation metadata, and the breaking
   change policy.
5. Contract checker verifies all 9 registered tools are covered and the notice
   window is at least 90 days.

## P3: Decision Rationale

Why lifecycle belongs in Tool Registry:

- Tool Registry is the source of tool names, schemas, permissions, and versions.
- MCP descriptors should project that authority rather than creating parallel
  version metadata.
- Keeping package version separate from public tool version avoids churn in
  package-level tests while giving integrators stable `tool@major` handles.

Tradeoff:

- The scaffold establishes current-major policy and deprecation windows.
- Historical major-version routing and migration examples remain later work.

## Verification

Passed:

- `npm run check:tool-registry`
- `npm run check:mcp-tool-versioning`
- `npm run test -- packages/tool-registry/src/index.test.ts packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts packages/agent-runtime/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/tool-registry`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`

## Residual Gaps

- No historical major-version routing.
- No hosted migration examples.
- No Developer Console version/deprecation UI.
- No live client compatibility smoke.
