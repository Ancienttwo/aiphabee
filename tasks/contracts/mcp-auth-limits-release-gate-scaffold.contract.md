# MCP Auth Limits Release Gate Scaffold Contract

## Scope

- `@aiphabee/mcp-runtime` exposes `mcp_auth_limits_release_gate`
  readiness through `GET /mcp/runtime`:
  - `mcp_auth_limits_release_gate_ready`
  - `mcp_auth_limits_release_gate_route`
  - `mcp_auth_limits_release_gate_version`
  - `mcp_auth_limits_release_gate_required_checks`
- Worker exposes `POST /mcp/release-gates/auth-limits/plan`.
- Contract checker is `npm run check:mcp-auth-limits-release-gate`.
- Migration registers empty no-live tables:
  - `core.mcp_auth_limits_release_gate`
  - `governance.mcp_auth_limits_release_gate_contract`

## Required Checks

- `oauth_scope_catalog_and_pkce_ready`
- `oauth_revoke_denies_future_calls`
- `api_key_rotation_denies_old_key`
- `api_key_revoke_denies_future_calls`
- `cursor_pagination_bypass_blocked`
- `quota_and_limit_bypass_blocked`
- `standard_error_codes_stable`

## Non-Goals

- No live OAuth provider.
- No live token/key store writes.
- No live API key secret generation.
- No live limiter window reads.
- No live usage-ledger writes.
- No live tool execution.
- No frontend Developer Console changes.
