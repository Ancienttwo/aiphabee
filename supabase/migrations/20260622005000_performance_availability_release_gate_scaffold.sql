create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.performance_availability_release_gate (
  gate_ref text primary key,
  request_id text not null,
  runtime_route text not null default 'GET /observability/runtime' check (
    runtime_route = 'GET /observability/runtime'
  ),
  gate_route text not null default 'POST /observability/release-gates/performance-availability/plan' check (
    gate_route = 'POST /observability/release-gates/performance-availability/plan'
  ),
  event_contract text not null default 'deploy/observability/events.contract.json' check (
    event_contract = 'deploy/observability/events.contract.json'
  ),
  required_checks text[] not null default array[
    'core_api_availability_target_met',
    'mcp_tool_p95_targets_met',
    'web_first_token_p95_target_met',
    'simple_research_completion_p95_target_met',
    'tool_success_rate_target_met',
    'slo_report_request_id_and_route_coverage_present',
    'live_apm_and_probe_writes_blocked'
  ],
  core_api_availability_target_bps integer not null default 9990 check (
    core_api_availability_target_bps = 9990
  ),
  mcp_tool_hot_p95_target_ms integer not null default 800 check (
    mcp_tool_hot_p95_target_ms = 800
  ),
  mcp_tool_cold_p95_target_ms integer not null default 2500 check (
    mcp_tool_cold_p95_target_ms = 2500
  ),
  web_first_token_p95_target_ms integer not null default 2500 check (
    web_first_token_p95_target_ms = 2500
  ),
  simple_research_completion_p95_target_ms integer not null default 15000 check (
    simple_research_completion_p95_target_ms = 15000
  ),
  mcp_tool_success_rate_target_bps integer not null default 9950 check (
    mcp_tool_success_rate_target_bps = 9950
  ),
  user_input_and_auth_errors_excluded boolean not null default true check (
    user_input_and_auth_errors_excluded = true
  ),
  request_id_route_coverage_required boolean not null default true check (
    request_id_route_coverage_required = true
  ),
  live_apm_provider_reads_enabled boolean not null default false check (
    live_apm_provider_reads_enabled = false
  ),
  live_probe_reads_enabled boolean not null default false check (
    live_probe_reads_enabled = false
  ),
  live_slo_store_writes_enabled boolean not null default false check (
    live_slo_store_writes_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  gate_status text not null default 'blocked_live_performance_availability_validation' check (
    gate_status in ('blocked_live_performance_availability_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists audit.performance_slo_drill_event (
  drill_event_ref text primary key,
  request_id text not null,
  metric_id text not null check (
    metric_id in (
      'core_api_availability_bps',
      'mcp_tool_hot_p95_ms',
      'mcp_tool_cold_p95_ms',
      'web_first_token_p95_ms',
      'simple_research_completion_p95_ms',
      'mcp_tool_success_rate_bps'
    )
  ),
  route text not null,
  observed_value integer not null check (
    observed_value >= 0
  ),
  target_value integer not null check (
    target_value >= 0
  ),
  outcome text not null default 'planned_no_write' check (
    outcome = 'planned_no_write'
  ),
  live_read_enabled boolean not null default false check (
    live_read_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.performance_availability_release_gate_contract (
  contract_name text not null default 'performance_availability_release_gate',
  contract_version text not null default '2026-06-22.phase3.performance-availability-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /observability/runtime',
  gate_route text not null default 'POST /observability/release-gates/performance-availability/plan',
  target_source text not null default 'docs/researches/AiphaBee_PRD_v1.0.md#12.1',
  monthly_availability_target_bps integer not null default 9990 check (
    monthly_availability_target_bps = 9990
  ),
  mcp_hot_path_p95_target_ms integer not null default 800 check (
    mcp_hot_path_p95_target_ms = 800
  ),
  mcp_cold_complex_p95_target_ms integer not null default 2500 check (
    mcp_cold_complex_p95_target_ms = 2500
  ),
  web_first_token_p95_target_ms integer not null default 2500 check (
    web_first_token_p95_target_ms = 2500
  ),
  simple_research_completion_p95_target_ms integer not null default 15000 check (
    simple_research_completion_p95_target_ms = 15000
  ),
  mcp_tool_success_rate_target_bps integer not null default 9950 check (
    mcp_tool_success_rate_target_bps = 9950
  ),
  user_input_and_auth_errors_excluded boolean not null default true check (
    user_input_and_auth_errors_excluded = true
  ),
  live_apm_provider_reads_enabled boolean not null default false check (
    live_apm_provider_reads_enabled = false
  ),
  live_probe_reads_enabled boolean not null default false check (
    live_probe_reads_enabled = false
  ),
  live_slo_store_writes_enabled boolean not null default false check (
    live_slo_store_writes_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
