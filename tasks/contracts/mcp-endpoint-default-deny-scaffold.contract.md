# Contract: MCP Endpoint Default-Deny Scaffold

## Scope

This slice covers Sprint 2.3 MCP-01 backend scaffold only.

It must:

- expose `POST /mcp`;
- support planned `initialize`, `tools/list`, and `tools/call` method names;
- validate `Origin`;
- keep MCP/API redistribution rights default-denied;
- keep Web rights separate from MCP machine-readable redistribution rights;
- avoid live OAuth, API key issuance, and live tool execution.

## Ownership

- Package: `@aiphabee/mcp-runtime`
- Worker route: `POST /mcp`
- Runtime route: `GET /mcp/runtime`
- Contract: `deploy/mcp/endpoint.contract.json`
- Checker: `npm run check:mcp-endpoint`

## Acceptance

- Trusted-origin `initialize` returns a no-live execution plan.
- Trusted-origin `tools/list` returns an empty list while redistribution rights
  are unconfirmed.
- Untrusted-origin requests fail before tool discovery.
- Trusted-origin `tools/call` fails with `DATA_NOT_LICENSED` while
  redistribution rights are unconfirmed.
- Contract checker passes with no secret-like payloads.

## Out Of Scope

- OAuth + PKCE, API key rotation, Developer Console, live MCP client smoke,
  runtime ledger writes, and live tool execution remain separate Sprint 2.3
  slices.
