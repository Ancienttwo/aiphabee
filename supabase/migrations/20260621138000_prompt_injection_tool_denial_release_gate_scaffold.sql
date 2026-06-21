create schema if not exists core;
create schema if not exists governance;

create table if not exists core.prompt_injection_tool_denial_release_gate (
  gate_id text primary key,
  request_id text not null,
  runtime_route text not null default 'GET /agent/runtime' check (
    runtime_route = 'GET /agent/runtime'
  ),
  gate_route text not null default 'POST /agent/release-gates/prompt-injection/plan' check (
    gate_route = 'POST /agent/release-gates/prompt-injection/plan'
  ),
  document_sanitizer_route text not null default 'POST /documents/get-announcement' check (
    document_sanitizer_route = 'POST /documents/get-announcement'
  ),
  tool_loop_route text not null default 'POST /agent/runs/plan' check (
    tool_loop_route = 'POST /agent/runs/plan'
  ),
  malicious_document_id text not null default 'doc_ann_00700_20260103_dividend',
  malicious_section_id text not null default 'dividend_timetable',
  denied_tool_probes text[] not null default array[
    'sql.query',
    'http.fetch',
    'admin.override'
  ],
  required_checks text[] not null default array[
    'untrusted_document_content_is_isolated',
    'document_origin_tool_instructions_not_executed',
    'arbitrary_sql_tool_denied_pre_execution',
    'arbitrary_url_tool_denied_pre_execution',
    'unregistered_tool_denied_pre_execution',
    'registered_tools_remain_schema_bound_read_only'
  ],
  content_is_untrusted_data boolean not null default true check (
    content_is_untrusted_data = true
  ),
  prompt_injection_isolated boolean not null default true check (
    prompt_injection_isolated = true
  ),
  document_tool_invocation_allowed boolean not null default false check (
    document_tool_invocation_allowed = false
  ),
  raw_document_instructions_ignored boolean not null default true check (
    raw_document_instructions_ignored = true
  ),
  registered_tools_only boolean not null default true check (
    registered_tools_only = true
  ),
  allow_arbitrary_sql boolean not null default false check (
    allow_arbitrary_sql = false
  ),
  allow_arbitrary_url boolean not null default false check (
    allow_arbitrary_url = false
  ),
  pre_execution_denial boolean not null default true check (
    pre_execution_denial = true
  ),
  live_document_fetch_enabled boolean not null default false check (
    live_document_fetch_enabled = false
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
  gate_status text not null default 'blocked_live_prompt_injection_red_team_validation' check (
    gate_status in ('blocked_live_prompt_injection_red_team_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.prompt_injection_tool_denial_release_gate_contract (
  contract_name text not null default 'prompt_injection_tool_denial_release_gate',
  contract_version text not null default '2026-06-21.phase3.prompt-injection-tool-denial-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /agent/runtime',
  gate_route text not null default 'POST /agent/release-gates/prompt-injection/plan',
  document_sanitizer_route text not null default 'POST /documents/get-announcement',
  tool_loop_route text not null default 'POST /agent/runs/plan',
  untrusted_document_policy_required boolean not null default true check (
    untrusted_document_policy_required = true
  ),
  prompt_injection_isolation_required boolean not null default true check (
    prompt_injection_isolation_required = true
  ),
  document_tool_invocation_allowed boolean not null default false check (
    document_tool_invocation_allowed = false
  ),
  arbitrary_sql_allowed boolean not null default false check (
    arbitrary_sql_allowed = false
  ),
  arbitrary_url_allowed boolean not null default false check (
    arbitrary_url_allowed = false
  ),
  unregistered_tool_denial_required boolean not null default true check (
    unregistered_tool_denial_required = true
  ),
  pre_execution_denial_required boolean not null default true check (
    pre_execution_denial_required = true
  ),
  live_document_fetch_enabled boolean not null default false check (
    live_document_fetch_enabled = false
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
