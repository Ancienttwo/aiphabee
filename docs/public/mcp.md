# AiphaBee Remote MCP Reference

Status: local publication draft.

## Streamable HTTP Endpoint

Remote MCP uses the single `/mcp` Streamable HTTP endpoint. The runtime supports
`initialize`, `tools/list`, and `tools/call` planning surfaces, with Origin
validation and default-deny redistribution controls.

## OAuth And API Keys

OAuth uses PKCE with explicit scope consent. Server-to-server access uses API key
planning surfaces with rotation and revoke semantics. Raw key material is not
stored in local scaffold outputs.

## Tool Schema Versions

Tools are registered through the shared Tool Registry. Public MCP tools expose
versioned names, input schema identifiers, output schema identifiers, and
deprecation metadata so client integrations can avoid silent breaking changes.

## Limits Usage And Errors

MCP calls must respect cursor pagination, time range limits, row limits, and
package quota. Responses expose usage metadata and stable error codes such as
`DATA_NOT_LICENSED`, `SCOPE_DENIED`, `RATE_LIMITED`, `BUDGET_EXCEEDED`, and
`INTERNAL_ERROR`.

## Current Publication Limits

This draft describes contract-ready MCP behavior. Live OAuth provider exchange,
live credential storage, live tool execution, and target-client end-to-end
certification are not proven by this draft.
