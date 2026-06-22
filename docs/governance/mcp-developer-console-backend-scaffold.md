# MCP Developer Console Backend Scaffold

> **Task Contract**: `tasks/contracts/mcp-developer-console-backend-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/developer-console.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/mcp-runtime` | Owns the no-live Developer Console plan and request-log schema |
| `GET /mcp/runtime` | Advertises `mcp_developer_console_*` capability metadata |
| `POST /mcp/developer-console/plan` | Returns UI-ready Console payload for Claude web integration |
| `POST /mcp` | Provides no-live initialize/tools examples |
| `GET /mcp/compatibility/status` | Provides target protocol and target-client status source |
| `deploy/mcp/developer-console.contract.json` | Guards MCP-09 backend contract |

Out of scope:

- `apps/web`
- live Console UI
- live Console log store
- live usage ledger reads
- live API key material generation
- live OAuth provider
- live MCP tool execution

## P2: Concrete Trace

1. A caller posts to `POST /mcp/developer-console/plan`.
2. Worker normalizes client, workspace, and usage inputs.
3. Runtime calls `createMcpDeveloperConsolePlan()`.
4. The plan composes compatibility status, target-client Console gate,
   no-live protocol examples, credential route metadata, scope catalog, quota
   fields, and request-log schema.
5. Worker wraps the result in the standard envelope with provenance and no
   live reads or writes.
6. `npm run check:mcp-developer-console` validates the contract, route, runtime
   source, migration scaffold, and package script wiring.

## P3: Decision Rationale

MCP-09 asks for a Developer Console with connection guide, keys, scopes, quota,
logs, and examples. The user delegated frontend work to Claude, and the repo
does not yet have live credential storage or usage log reads. The smallest
coherent slice is therefore a backend payload that gives the web implementation
a stable shape while preserving the no-live invariant.

At 10x scale this fails first at request-log and credential lifecycle
consistency, so this slice locks the reconciliation fields and future table
names before enabling any live store.

## Verification

Expected local checks:

- `npm run check:mcp-developer-console`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`

## Residual Gaps

- Frontend Developer Console UI remains unimplemented in this repo.
- Live target-client e2e is not run.
- Live Console request logs are not stored or read.
- Live usage ledger reads are not enabled.
- Live API key generation and live OAuth provider are not enabled.
