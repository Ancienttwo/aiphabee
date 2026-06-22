# MCP Client Maturity Scaffold Contract

## Objective

Complete the Phase 4 backend-only scaffold for evaluating whether MCP
resources, prompts, or interactive MCP Apps are mature enough for AiphaBee,
without enabling those surfaces live.

## Required Surfaces

- Runtime metadata: `GET /mcp/runtime`
- Plan route: `POST /mcp/client-maturity/plan`
- Contract: `deploy/mcp/client-maturity.contract.json`
- Checker: `npm run check:mcp-client-maturity`
- Migration scaffold: `supabase/migrations/20260622011000_mcp_client_maturity_scaffold.sql`

## Required Guarantees

- Use standard response envelopes.
- Evaluate Inspector, TypeScript SDK, Claude Desktop, Cursor, and ChatGPT
  Connector across tools, resources, prompts, and interactive Apps.
- Link to existing MCP compatibility status and target-clients Console release
  gate.
- Keep tools-only fallback documented for every target client.
- Keep resources, prompts, component widgets, embedded resources, interactive
  Apps, live tool execution, model calls, persistent writes, SQL, and frontend
  rendering disabled.
- Return blockers for missing live resources e2e, live prompts e2e, interactive
  Apps client stability, client capability version matrix, and Apps SDK security
  review.
- Preserve default-deny in database scaffold.

## Acceptance

- Contract checker passes.
- Database migration checker passes.
- MCP Runtime and Worker targeted tests pass.
- MCP Runtime and Worker typecheck pass.
- Sprint tracker row is checked.
