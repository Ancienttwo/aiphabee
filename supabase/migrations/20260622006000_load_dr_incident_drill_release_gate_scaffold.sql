create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.load_dr_incident_drill_release_gate (
  gate_ref text primary key,
  request_id text not null,
  runtime_route text not null default 'GET /observability/runtime' check (
    runtime_route = 'GET /observability/runtime'
  ),
  gate_route text not null default 'POST /observability/release-gates/load-dr-incident-drill/plan' check (
    gate_route = 'POST /observability/release-gates/load-dr-incident-drill/plan'
  ),
  event_contract text not null default 'deploy/observability/events.contract.json' check (
    event_contract = 'deploy/observability/events.contract.json'
  ),
  required_checks text[] not null default array[
    'load_test_artifact_present',
    'load_test_targets_met',
    'dr_restore_rto_target_met',
    'dr_restore_rpo_target_met',
    'incident_drill_completed',
    'failover_rollback_plan_present',
    'communications_and_status_page_drill_present',
    'live_execution_and_persistent_writes_blocked'
  ],
  load_test_min_peak_rps integer not null default 100 check (
    load_test_min_peak_rps = 100
  ),
  load_test_max_error_rate_bps integer not null default 50 check (
    load_test_max_error_rate_bps = 50
  ),
  dr_rto_target_minutes integer not null default 60 check (
    dr_rto_target_minutes = 60
  ),
  dr_rpo_target_minutes integer not null default 15 check (
    dr_rpo_target_minutes = 15
  ),
  live_load_test_runner_enabled boolean not null default false check (
    live_load_test_runner_enabled = false
  ),
  live_restore_execution_enabled boolean not null default false check (
    live_restore_execution_enabled = false
  ),
  live_incident_pager_enabled boolean not null default false check (
    live_incident_pager_enabled = false
  ),
  live_status_page_writes_enabled boolean not null default false check (
    live_status_page_writes_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  gate_status text not null default 'blocked_live_load_dr_incident_validation' check (
    gate_status in ('blocked_live_load_dr_incident_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists audit.load_dr_incident_drill_event (
  drill_event_ref text primary key,
  request_id text not null,
  scenario_id text not null check (
    scenario_id in (
      'load_test_peak_traffic',
      'database_restore',
      'worker_failover',
      'rollback',
      'incident_response',
      'status_comms'
    )
  ),
  artifact_ref text not null,
  evidence_value text not null,
  outcome text not null default 'planned_no_write' check (
    outcome = 'planned_no_write'
  ),
  live_execution_enabled boolean not null default false check (
    live_execution_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.load_dr_incident_drill_release_gate_contract (
  contract_name text not null default 'load_dr_incident_drill_release_gate',
  contract_version text not null default '2026-06-22.phase3.load-dr-incident-drill-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /observability/runtime',
  gate_route text not null default 'POST /observability/release-gates/load-dr-incident-drill/plan',
  target_source text not null default 'docs/researches/AiphaBee_PRD_v1.0.md#12.1',
  load_test_min_peak_rps integer not null default 100 check (
    load_test_min_peak_rps = 100
  ),
  load_test_max_error_rate_bps integer not null default 50 check (
    load_test_max_error_rate_bps = 50
  ),
  dr_rto_target_minutes integer not null default 60 check (
    dr_rto_target_minutes = 60
  ),
  dr_rpo_target_minutes integer not null default 15 check (
    dr_rpo_target_minutes = 15
  ),
  live_load_test_runner_enabled boolean not null default false check (
    live_load_test_runner_enabled = false
  ),
  live_restore_execution_enabled boolean not null default false check (
    live_restore_execution_enabled = false
  ),
  live_incident_pager_enabled boolean not null default false check (
    live_incident_pager_enabled = false
  ),
  live_status_page_writes_enabled boolean not null default false check (
    live_status_page_writes_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
