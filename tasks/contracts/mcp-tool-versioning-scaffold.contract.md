# Contract: MCP Tool Versioning Scaffold

## Scope

This slice covers Sprint 2.3 MCP-05 backend versioning and deprecation policy
for registered MCP tools.

It must:

- give every registered tool a stable public `tool@major` version;
- expose the current major version in MCP tool descriptors;
- require breaking changes to ship as a new major;
- expose deprecation status and minimum notice metadata;
- keep old major versions available during the notice window in policy;
- keep live execution disabled.

## Ownership

- Registry package: `@aiphabee/tool-registry`
- MCP package: `@aiphabee/mcp-runtime`
- Protocol route: `POST /mcp`
- Contract: `deploy/mcp/tool-versioning.contract.json`
- Checker: `npm run check:mcp-tool-versioning`

## Acceptance

- All 9 registered tools expose lifecycle metadata.
- All 9 registered tools expose `publicVersion=<tool>@1`.
- MCP `tools/list` descriptors include `public_version` and `major_version`.
- MCP descriptors include deprecation metadata.
- Contract checker verifies a minimum 90-day deprecation notice and 180-day old
  major support window.

## Out Of Scope

Historical major-version routing, hosted migration examples, Developer Console
version UI, live client compatibility smoke, and live MCP tool execution remain
separate slices.
