create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.golden_correction_rollback_drill (
  drill_id text primary key,
  request_id text not null,
  golden_manifest_version text not null,
  golden_sample_count integer not null default 8,
  tool_golden_sample_count integer not null default 16,
  quality_rule_count integer not null default 12,
  correction_event_id text,
  saved_snapshot_id text,
  replay_snapshot_id text,
  drill_status text not null default 'planned_no_write' check (
    drill_status in ('planned_no_write', 'blocked_missing_context')
  ),
  old_report_mutation_allowed boolean not null default false check (
    old_report_mutation_allowed = false
  ),
  silent_rewrite_allowed boolean not null default false check (
    silent_rewrite_allowed = false
  ),
  live_rollback_execution boolean not null default false check (
    live_rollback_execution = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.golden_correction_rollback_drill_contract (
  contract_name text not null default 'golden_correction_rollback_drill',
  contract_version text not null default '2026-06-21.phase3.golden-correction-rollback-drill-scaffold.v0',
  runtime_route text not null default 'GET /research/runtime',
  drill_route text not null default 'POST /research/golden-correction-rollback-drill/plan',
  golden_fixture_command text not null default 'npm run test:golden',
  required_golden_sample_count integer not null default 8,
  required_tool_golden_sample_count integer not null default 16,
  required_quality_rule_count integer not null default 12,
  old_report_mutation_allowed boolean not null default false check (
    old_report_mutation_allowed = false
  ),
  silent_rewrite_allowed boolean not null default false check (
    silent_rewrite_allowed = false
  ),
  live_rollback_execution boolean not null default false check (
    live_rollback_execution = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
