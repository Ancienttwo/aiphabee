create schema if not exists core;
create schema if not exists governance;

create table if not exists core.mcp_protocol_release_gate (
  gate_id text primary key,
  request_id text not null,
  protocol_route text not null default 'POST /mcp' check (
    protocol_route = 'POST /mcp'
  ),
  gate_route text not null default 'POST /mcp/release-gates/protocol/plan' check (
    gate_route = 'POST /mcp/release-gates/protocol/plan'
  ),
  transport text not null default 'streamable_http' check (
    transport = 'streamable_http'
  ),
  target_protocol_version text not null default '2025-03-26' check (
    target_protocol_version = '2025-03-26'
  ),
  origin_required boolean not null default true check (
    origin_required = true
  ),
  origin_validation_enabled boolean not null default true check (
    origin_validation_enabled = true
  ),
  auth_enforced_before_tool_execution boolean not null default true check (
    auth_enforced_before_tool_execution = true
  ),
  rights_default_deny_enabled boolean not null default true check (
    rights_default_deny_enabled = true
  ),
  input_schema_validation_enabled boolean not null default true check (
    input_schema_validation_enabled = true
  ),
  output_schema_contract_enabled boolean not null default true check (
    output_schema_contract_enabled = true
  ),
  structured_content_required boolean not null default true check (
    structured_content_required = true
  ),
  live_oauth_provider_enabled boolean not null default false check (
    live_oauth_provider_enabled = false
  ),
  live_auth_middleware_enabled boolean not null default false check (
    live_auth_middleware_enabled = false
  ),
  live_client_e2e_passed boolean not null default false check (
    live_client_e2e_passed = false
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  live_db_writes_enabled boolean not null default false check (
    live_db_writes_enabled = false
  ),
  gate_status text not null default 'blocked_live_mcp_protocol_validation' check (
    gate_status in ('blocked_live_mcp_protocol_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.mcp_protocol_release_gate_contract (
  contract_name text not null default 'mcp_protocol_release_gate',
  contract_version text not null default '2026-06-21.phase3.mcp-protocol-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /mcp/runtime',
  gate_route text not null default 'POST /mcp/release-gates/protocol/plan',
  protocol_route text not null default 'POST /mcp',
  compatibility_status_route text not null default 'GET /mcp/compatibility/status',
  target_protocol_version text not null default '2025-03-26',
  streamable_http_required boolean not null default true check (
    streamable_http_required = true
  ),
  origin_required boolean not null default true check (
    origin_required = true
  ),
  auth_enforced_before_tool_execution boolean not null default true check (
    auth_enforced_before_tool_execution = true
  ),
  input_schema_validation_required boolean not null default true check (
    input_schema_validation_required = true
  ),
  output_schema_contract_required boolean not null default true check (
    output_schema_contract_required = true
  ),
  structured_content_required boolean not null default true check (
    structured_content_required = true
  ),
  live_oauth_provider_enabled boolean not null default false check (
    live_oauth_provider_enabled = false
  ),
  live_auth_middleware_enabled boolean not null default false check (
    live_auth_middleware_enabled = false
  ),
  live_client_e2e_passed boolean not null default false check (
    live_client_e2e_passed = false
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
