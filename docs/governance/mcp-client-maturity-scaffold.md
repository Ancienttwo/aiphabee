# MCP Client Maturity Scaffold

Status: local contract complete

This slice closes the Phase 4 backlog item for evaluating MCP resources,
prompts, and interactive MCP Apps client maturity. It does not publish MCP
resources, MCP prompts, embedded widgets, or interactive Apps.

## Scope

- Package: `@aiphabee/mcp-runtime`
- Plan route: `POST /mcp/client-maturity/plan`
- Runtime metadata: `GET /mcp/runtime`
- Contract: `deploy/mcp/client-maturity.contract.json`
- Migration scaffold: `supabase/migrations/20260622011000_mcp_client_maturity_scaffold.sql`
- Gate: `npm run check:mcp-client-maturity`

## Current Protocol Context

- MCP resources are application-driven context exposed through `resources/list`,
  `resources/read`, and resource templates.
- MCP prompts are user-controlled prompt templates exposed through
  `prompts/list` and `prompts/get`.
- OpenAI Apps SDK uses MCP tools plus returned resources/metadata for ChatGPT UI
  components and server-wide instructions.

Reference URLs:

- `https://modelcontextprotocol.io/specification/2025-11-25/server/resources`
- `https://modelcontextprotocol.io/specification/2025-11-25/server/prompts`
- `https://developers.openai.com/apps-sdk/concepts/mcp-server`

## Invariants

- Target clients are evaluated as a maturity matrix only: Inspector, TypeScript
  SDK, Claude Desktop, Cursor, and ChatGPT Connector.
- Tools remain the fallback mode for all target clients.
- Resources, prompts, embedded resources, component widgets, and interactive
  Apps are not published live by this scaffold.
- Live client e2e, live tool execution, model calls, persistent writes, SQL,
  and frontend rendering remain false.
- Existing target-client Console release gate and MCP compatibility status stay
  linked, but are not converted into live evidence.

## Verification

Run:

```sh
npm run check:mcp-client-maturity
npx vitest run packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts
```
