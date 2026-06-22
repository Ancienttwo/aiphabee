# MCP Developer Console Backend Scaffold Notes

Date: 2026-06-22

## Decision

Implement MCP-09 as a backend Developer Console plan route, not as a live
Console product claim.

## Why

The repo already has no-live Remote MCP OAuth/API-key/protocol/usage contracts
and a target-client Console release gate. What the frontend needs next is a
stable UI payload for connection guide, credential operations, scope catalog,
quota fields, request logs, and examples.

## Boundary

`planned_no_live_developer_console` means the backend returns a renderable
contract. It does not mean users can manage live keys, authorize live OAuth,
read live usage logs, or complete a real target-client first call.

`apps/web` remains out of scope for this slice because frontend work is
delegated to Claude.

## Verification Surface

- `deploy/mcp/developer-console.contract.json`
- `scripts/check-mcp-developer-console-contract.mjs`
- `packages/mcp-runtime/src/index.test.ts`
- `apps/worker/src/index.test.ts`
- `npm run check:mcp-developer-console`
