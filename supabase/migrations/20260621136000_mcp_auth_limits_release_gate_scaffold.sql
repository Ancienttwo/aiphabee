create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.mcp_auth_limits_release_gate (
  gate_id text primary key,
  request_id text not null,
  runtime_route text not null default 'GET /mcp/runtime' check (
    runtime_route = 'GET /mcp/runtime'
  ),
  protocol_route text not null default 'POST /mcp' check (
    protocol_route = 'POST /mcp'
  ),
  gate_route text not null default 'POST /mcp/release-gates/auth-limits/plan' check (
    gate_route = 'POST /mcp/release-gates/auth-limits/plan'
  ),
  oauth_pkce_method text not null default 'S256' check (
    oauth_pkce_method = 'S256'
  ),
  oauth_scope_grants_revocable boolean not null default true check (
    oauth_scope_grants_revocable = true
  ),
  oauth_revoke_denies_future_calls boolean not null default true check (
    oauth_revoke_denies_future_calls = true
  ),
  api_key_rotation_old_key_denied boolean not null default true check (
    api_key_rotation_old_key_denied = true
  ),
  api_key_revoke_denies_future_calls boolean not null default true check (
    api_key_revoke_denies_future_calls = true
  ),
  cursor_opaque boolean not null default true check (
    cursor_opaque = true
  ),
  cursor_bound_to_request boolean not null default true check (
    cursor_bound_to_request = true
  ),
  max_rows_enforced boolean not null default true check (
    max_rows_enforced = true
  ),
  time_range_enforced boolean not null default true check (
    time_range_enforced = true
  ),
  plan_or_rights_bypass_blocked boolean not null default true check (
    plan_or_rights_bypass_blocked = true
  ),
  standard_error_codes_stable boolean not null default true check (
    standard_error_codes_stable = true
  ),
  live_oauth_provider_enabled boolean not null default false check (
    live_oauth_provider_enabled = false
  ),
  live_auth_middleware_enabled boolean not null default false check (
    live_auth_middleware_enabled = false
  ),
  live_api_key_generation_enabled boolean not null default false check (
    live_api_key_generation_enabled = false
  ),
  live_limiter_enforcement_enabled boolean not null default false check (
    live_limiter_enforcement_enabled = false
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  live_db_writes_enabled boolean not null default false check (
    live_db_writes_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  gate_status text not null default 'blocked_live_mcp_auth_limits_validation' check (
    gate_status in ('blocked_live_mcp_auth_limits_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.mcp_auth_limits_release_gate_contract (
  contract_name text not null default 'mcp_auth_limits_release_gate',
  contract_version text not null default '2026-06-21.phase3.mcp-auth-limits-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /mcp/runtime',
  gate_route text not null default 'POST /mcp/release-gates/auth-limits/plan',
  protocol_route text not null default 'POST /mcp',
  oauth_scope_gate_required boolean not null default true check (
    oauth_scope_gate_required = true
  ),
  oauth_revoke_gate_required boolean not null default true check (
    oauth_revoke_gate_required = true
  ),
  api_key_rotation_gate_required boolean not null default true check (
    api_key_rotation_gate_required = true
  ),
  api_key_revoke_gate_required boolean not null default true check (
    api_key_revoke_gate_required = true
  ),
  cursor_pagination_gate_required boolean not null default true check (
    cursor_pagination_gate_required = true
  ),
  quota_limit_gate_required boolean not null default true check (
    quota_limit_gate_required = true
  ),
  standard_error_gate_required boolean not null default true check (
    standard_error_gate_required = true
  ),
  live_oauth_provider_enabled boolean not null default false check (
    live_oauth_provider_enabled = false
  ),
  live_auth_middleware_enabled boolean not null default false check (
    live_auth_middleware_enabled = false
  ),
  live_api_key_generation_enabled boolean not null default false check (
    live_api_key_generation_enabled = false
  ),
  live_limiter_enforcement_enabled boolean not null default false check (
    live_limiter_enforcement_enabled = false
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  live_db_writes_enabled boolean not null default false check (
    live_db_writes_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
