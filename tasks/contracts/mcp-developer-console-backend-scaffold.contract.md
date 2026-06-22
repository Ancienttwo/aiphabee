# MCP Developer Console Backend Scaffold Contract

## Objective

Complete the backend-only MCP-09 Developer Console payload for Claude web
integration, without enabling frontend rendering or live MCP credential/log
surfaces.

## Required Surfaces

- Runtime metadata: `GET /mcp/runtime`
- Plan route: `POST /mcp/developer-console/plan`
- Contract: `deploy/mcp/developer-console.contract.json`
- Checker: `npm run check:mcp-developer-console`
- Migration scaffold: `supabase/migrations/20260622014000_mcp_developer_console_scaffold.sql`

## Required Guarantees

- Use the standard response envelope.
- Expose a connection guide artifact and target-client rows with a 10 minute
  first-call target.
- Link API key create/rotate/revoke plans and OAuth authorize/token/revoke
  plans without generating live credential material.
- Expose the MCP scope catalog and revocable scope metadata.
- Expose request-id-visible quota fields without live usage ledger reads.
- Expose request-log schema fields for request, workspace, client, credential,
  scope, tool, usage, error, and provenance reconciliation.
- Exclude raw keys, OAuth material, prompts, generated answers, documents,
  payment identifiers, and contact details from request logs.
- Include initialize, tools/list, and tools/call examples without live
  execution.
- Keep frontend rendering, live Console UI, live log store, live usage ledger
  reads, live OAuth provider, live API key generation, live tool execution,
  persistent writes, model calls, and SQL disabled.

## Acceptance

- Contract checker passes.
- Database migration checker passes.
- MCP Runtime and Worker targeted tests pass.
- MCP Runtime and Worker typecheck pass.
- Sprint tracker is updated without marking MCP-09 complete until the frontend
  Console UI and live evidence surfaces exist.
