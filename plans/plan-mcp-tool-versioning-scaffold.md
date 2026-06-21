# Plan: MCP Tool Versioning Scaffold

## Scope

- Sprint: 2.3
- Requirement: MCP-05 / US-M06
- Packages:
  - `@aiphabee/tool-registry`
  - `@aiphabee/mcp-runtime`
- Protocol route: `POST /mcp`
- Contract: `deploy/mcp/tool-versioning.contract.json`
- Checker: `npm run check:mcp-tool-versioning`

## Task Breakdown

- [x] Add lifecycle metadata to every registered tool
- [x] Define public `tool@major` versions independent of package version
- [x] Require breaking changes to use a new major
- [x] Define active deprecation status and minimum notice window
- [x] Project lifecycle metadata into MCP `tools/list` descriptors
- [x] Add contract checker, tests, and tracker updates

## Explicit Non-Goals

- No historical major-version routing
- No hosted migration examples
- No Developer Console version UI
- No live client compatibility smoke
