create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.mcp_target_clients_console_release_gate (
  gate_id text primary key,
  request_id text not null,
  runtime_route text not null default 'GET /mcp/runtime' check (
    runtime_route = 'GET /mcp/runtime'
  ),
  protocol_route text not null default 'POST /mcp' check (
    protocol_route = 'POST /mcp'
  ),
  compatibility_status_route text not null default 'GET /mcp/compatibility/status' check (
    compatibility_status_route = 'GET /mcp/compatibility/status'
  ),
  gate_route text not null default 'POST /mcp/release-gates/target-clients-console/plan' check (
    gate_route = 'POST /mcp/release-gates/target-clients-console/plan'
  ),
  target_protocol_version text not null default '2025-03-26' check (
    target_protocol_version = '2025-03-26'
  ),
  target_clients text[] not null default array[
    'mcp_inspector',
    'typescript_sdk_client',
    'claude_desktop',
    'cursor',
    'chatgpt_connector'
  ],
  time_to_first_call_target_minutes integer not null default 10 check (
    time_to_first_call_target_minutes = 10
  ),
  connection_guide_artifact text not null default 'docs/public/mcp.md' check (
    connection_guide_artifact = 'docs/public/mcp.md'
  ),
  console_required_fields text[] not null default array[
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
  console_forbidden_fields text[] not null default array[
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
  live_client_e2e_passed boolean not null default false check (
    live_client_e2e_passed = false
  ),
  live_sdk_inspector_smoke_enabled boolean not null default false check (
    live_sdk_inspector_smoke_enabled = false
  ),
  live_console_log_store_enabled boolean not null default false check (
    live_console_log_store_enabled = false
  ),
  live_usage_ledger_reads_enabled boolean not null default false check (
    live_usage_ledger_reads_enabled = false
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
  gate_status text not null default 'blocked_live_mcp_target_clients_console_validation' check (
    gate_status in ('blocked_live_mcp_target_clients_console_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.mcp_target_clients_console_release_gate_contract (
  contract_name text not null default 'mcp_target_clients_console_release_gate',
  contract_version text not null default '2026-06-21.phase3.mcp-target-clients-console-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /mcp/runtime',
  protocol_route text not null default 'POST /mcp',
  compatibility_status_route text not null default 'GET /mcp/compatibility/status',
  gate_route text not null default 'POST /mcp/release-gates/target-clients-console/plan',
  target_client_matrix_required boolean not null default true check (
    target_client_matrix_required = true
  ),
  first_call_guide_required boolean not null default true check (
    first_call_guide_required = true
  ),
  console_reconciliation_required boolean not null default true check (
    console_reconciliation_required = true
  ),
  request_id_usage_scope_key_required boolean not null default true check (
    request_id_usage_scope_key_required = true
  ),
  developer_console_live boolean not null default false check (
    developer_console_live = false
  ),
  live_client_e2e_passed boolean not null default false check (
    live_client_e2e_passed = false
  ),
  live_sdk_inspector_smoke_enabled boolean not null default false check (
    live_sdk_inspector_smoke_enabled = false
  ),
  live_console_log_store_enabled boolean not null default false check (
    live_console_log_store_enabled = false
  ),
  live_usage_ledger_reads_enabled boolean not null default false check (
    live_usage_ledger_reads_enabled = false
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
