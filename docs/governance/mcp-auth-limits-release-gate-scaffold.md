# MCP Auth And Limits Release Gate Scaffold

Date: 2026-06-21

## Scope

This scaffold closes the Sprint 3.3 local release-gate item for OAuth scope/revoke, API key rotation/revoke, cursor and limit bypass protection, and stable MCP standard errors.

It does not enable live OAuth, token storage, API key secret generation, limiter windows, usage-ledger writes, or live tool execution.

## Runtime Surface

| Surface | Purpose |
| --- | --- |
| `GET /mcp/runtime` | Reports `mcp_auth_limits_release_gate_*` readiness fields |
| `POST /mcp/release-gates/auth-limits/plan` | Composes existing MCP planners into no-write release evidence |
| `deploy/mcp/auth-limits-release-gate.contract.json` | Local contract for release-gate behavior and linked checks |
| `npm run check:mcp-auth-limits-release-gate` | Verifies contract shape, migration registry, no-live flags, and no secret-like payloads |
| `aiphabee_core.mcp_auth_limits_release_gate`, `aiphabee_governance.mcp_auth_limits_release_gate_contract` | Empty future persistence scaffolds with no-live defaults |

## Evidence Gates

1. OAuth authorize exposes `S256` PKCE and revocable scope grants for `security.read`, `market.read`, and `analytics.run`.
2. OAuth revoke marks future calls denied; a revoked OAuth connection maps to `AUTH_REQUIRED` before `tools/call`.
3. API key rotation denies the old key and does not generate live secret material.
4. API key revoke marks future calls denied without live invalidation.
5. `get_price_history` bounded retrieval exposes opaque, request-bound cursor metadata and blocks plan/rights bypass.
6. Row-limit and time-window bypass probes map to `TOO_MANY_ROWS` and `OUT_OF_RANGE`.
7. Stable MCP error mapping covers auth, scope, rights, row limit, time range, rate limit, and budget errors.

## Blockers

The release gate remains `blocked_live_mcp_auth_limits_validation` until live OAuth provider, token store, API key generation, limiter window reads, and usage-ledger writes are enabled and signed off.
