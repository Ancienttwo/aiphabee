create schema if not exists core;
create schema if not exists governance;

create table if not exists core.mcp_developer_console_request_log (
  request_log_id text primary key,
  request_id text not null,
  workspace_id text not null,
  client_name text not null,
  client_version text not null,
  credential_kind text not null check (
    credential_kind in ('oauth_connection', 'api_key')
  ),
  credential_reference text not null,
  scope text not null,
  tool_name text not null,
  tool_version text not null,
  status text not null,
  standard_error_code text,
  credits integer not null default 0 check (
    credits >= 0
  ),
  credits_remaining integer not null default 0 check (
    credits_remaining >= 0
  ),
  usage_event_id text,
  data_version text not null default '2026-06-22.phase2.mcp-developer-console-backend-scaffold.v0',
  methodology_version text not null default '2026-06-22.phase2.mcp-developer-console-backend-scaffold.v0',
  source_record_id text not null,
  developer_console_route text not null default 'POST /mcp/developer-console/plan' check (
    developer_console_route = 'POST /mcp/developer-console/plan'
  ),
  protocol_route text not null default 'POST /mcp' check (
    protocol_route = 'POST /mcp'
  ),
  compatibility_status_route text not null default 'GET /mcp/compatibility/status' check (
    compatibility_status_route = 'GET /mcp/compatibility/status'
  ),
  target_clients_console_gate_route text not null default 'POST /mcp/release-gates/target-clients-console/plan' check (
    target_clients_console_gate_route = 'POST /mcp/release-gates/target-clients-console/plan'
  ),
  request_log_fields text[] not null default array[
    'request_id',
    'workspace_id',
    'client_name',
    'client_version',
    'credential_kind',
    'credential_reference',
    'scope',
    'tool_name',
    'tool_version',
    'status',
    'standard_error_code',
    'credits',
    'credits_remaining',
    'usage_event_id',
    'data_version',
    'methodology_version',
    'source_record_id'
  ],
  forbidden_fields text[] not null default array[
    'raw_api_key',
    'oauth_access_token',
    'oauth_refresh_token',
    'raw_prompt',
    'raw_generated_answer',
    'raw_document_body',
    'payment_identifier',
    'personal_contact'
  ],
  request_id_visible boolean not null default true check (
    request_id_visible = true
  ),
  scope_visible boolean not null default true check (
    scope_visible = true
  ),
  developer_console_live boolean not null default false check (
    developer_console_live = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  live_api_key_generation_enabled boolean not null default false check (
    live_api_key_generation_enabled = false
  ),
  live_console_log_store_enabled boolean not null default false check (
    live_console_log_store_enabled = false
  ),
  live_oauth_provider_enabled boolean not null default false check (
    live_oauth_provider_enabled = false
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  live_usage_ledger_reads_enabled boolean not null default false check (
    live_usage_ledger_reads_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  gate_status text not null default 'blocked_live_mcp_developer_console_validation' check (
    gate_status in ('blocked_live_mcp_developer_console_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.mcp_developer_console_contract (
  contract_name text not null default 'mcp_developer_console',
  contract_version text not null default '2026-06-22.phase2.mcp-developer-console-backend-scaffold.v0',
  runtime_route text not null default 'GET /mcp/runtime',
  developer_console_route text not null default 'POST /mcp/developer-console/plan',
  protocol_route text not null default 'POST /mcp',
  compatibility_status_route text not null default 'GET /mcp/compatibility/status',
  target_clients_console_gate_route text not null default 'POST /mcp/release-gates/target-clients-console/plan',
  connection_guide_required boolean not null default true check (
    connection_guide_required = true
  ),
  credential_routes_required boolean not null default true check (
    credential_routes_required = true
  ),
  scope_catalog_required boolean not null default true check (
    scope_catalog_required = true
  ),
  quota_usage_summary_required boolean not null default true check (
    quota_usage_summary_required = true
  ),
  request_log_schema_required boolean not null default true check (
    request_log_schema_required = true
  ),
  examples_required boolean not null default true check (
    examples_required = true
  ),
  first_call_time_target_minutes integer not null default 10 check (
    first_call_time_target_minutes = 10
  ),
  developer_console_live boolean not null default false check (
    developer_console_live = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  live_api_key_generation_enabled boolean not null default false check (
    live_api_key_generation_enabled = false
  ),
  live_console_log_store_enabled boolean not null default false check (
    live_console_log_store_enabled = false
  ),
  live_oauth_provider_enabled boolean not null default false check (
    live_oauth_provider_enabled = false
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  live_usage_ledger_reads_enabled boolean not null default false check (
    live_usage_ledger_reads_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
