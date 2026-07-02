create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.mcp_client_maturity_assessment (
  assessment_id text primary key,
  request_id text not null,
  workspace_id text,
  route text not null default 'POST /mcp/client-maturity/plan' check (
    route = 'POST /mcp/client-maturity/plan'
  ),
  runtime_route text not null default 'GET /mcp/runtime' check (
    runtime_route = 'GET /mcp/runtime'
  ),
  target_clients_console_gate_route text not null default 'POST /mcp/release-gates/target-clients-console/plan' check (
    target_clients_console_gate_route = 'POST /mcp/release-gates/target-clients-console/plan'
  ),
  compatibility_status_route text not null default 'GET /mcp/compatibility/status' check (
    compatibility_status_route = 'GET /mcp/compatibility/status'
  ),
  target_clients text[] not null default array[
    'mcp_inspector',
    'typescript_sdk_client',
    'claude_desktop',
    'cursor',
    'chatgpt_connector'
  ],
  supported_features text[] not null default array[
    'tools',
    'resources',
    'prompts',
    'interactive_apps'
  ],
  fallback_mode text not null default 'tools_only' check (
    fallback_mode = 'tools_only'
  ),
  resources_live boolean not null default false check (
    resources_live = false
  ),
  prompts_live boolean not null default false check (
    prompts_live = false
  ),
  interactive_apps_live boolean not null default false check (
    interactive_apps_live = false
  ),
  component_widgets_live boolean not null default false check (
    component_widgets_live = false
  ),
  tool_result_embedded_resources_live boolean not null default false check (
    tool_result_embedded_resources_live = false
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
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  sql_emitted boolean not null default false check (
    sql_emitted = false
  ),
  gate_status text not null default 'blocked_live_mcp_client_maturity_validation' check (
    gate_status in ('blocked_live_mcp_client_maturity_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.mcp_client_maturity_contract (
  contract_name text not null default 'mcp_client_maturity',
  contract_version text not null default '2026-06-22.phase4.mcp-client-maturity-scaffold.v0',
  runtime_route text not null default 'GET /mcp/runtime',
  plan_route text not null default 'POST /mcp/client-maturity/plan',
  protocol_route text not null default 'POST /mcp',
  target_clients_console_gate_route text not null default 'POST /mcp/release-gates/target-clients-console/plan',
  resources_guarded_by_client_maturity boolean not null default true check (
    resources_guarded_by_client_maturity = true
  ),
  prompts_guarded_by_client_maturity boolean not null default true check (
    prompts_guarded_by_client_maturity = true
  ),
  interactive_apps_blocked_until_client_stable boolean not null default true check (
    interactive_apps_blocked_until_client_stable = true
  ),
  fallback_to_tools_only boolean not null default true check (
    fallback_to_tools_only = true
  ),
  resources_live boolean not null default false check (
    resources_live = false
  ),
  prompts_live boolean not null default false check (
    prompts_live = false
  ),
  interactive_apps_live boolean not null default false check (
    interactive_apps_live = false
  ),
  component_widgets_live boolean not null default false check (
    component_widgets_live = false
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
