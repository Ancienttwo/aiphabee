# Notes: MCP Tool Versioning Scaffold

Date: 2026-06-21

## Completed

- Added Tool Registry lifecycle metadata for all 9 registered tools.
- Added public `tool@1` versions independent of package `version`.
- Added breaking-change policy:
  - `breakingChangesRequireNewMajor=true`
  - `minimumNoticeDays=90`
  - `previousMajorSupportWindowDays=180`
  - `oldMajorAvailableDuringNotice=true`
- Projected lifecycle metadata into MCP `tools/list` descriptors.
- Added `deploy/mcp/tool-versioning.contract.json`.
- Added `npm run check:mcp-tool-versioning`.

## Trace

1. Tool Registry attaches lifecycle metadata to each registered tool definition.
2. `/tools/runtime` reports versioning/deprecation readiness.
3. MCP runtime capability reports versioning/deprecation readiness.
4. MCP `tools/list` descriptors include `public_version`, `major_version`,
   breaking-change policy, and deprecation metadata when rights are confirmed.
5. Checker validates all registered tools and policy windows.

## Verification

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
