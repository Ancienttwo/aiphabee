create schema if not exists core;
create schema if not exists governance;

create table if not exists core.task_replay_mode_release_gate (
  gate_id text primary key,
  request_id text not null,
  task_id_visible boolean not null default true check (
    task_id_visible = true
  ),
  resume_handle_required boolean not null default true check (
    resume_handle_required = true
  ),
  resumable boolean not null default true check (
    resumable = true
  ),
  disconnect_safe boolean not null default true check (
    disconnect_safe = true
  ),
  checkpoint_table text not null default 'core.workflow_task_checkpoint' check (
    checkpoint_table = 'core.workflow_task_checkpoint'
  ),
  deterministic_replay_seed_required boolean not null default true check (
    deterministic_replay_seed_required = true
  ),
  old_report_immutable boolean not null default true check (
    old_report_immutable = true
  ),
  old_report_mutation_allowed boolean not null default false check (
    old_report_mutation_allowed = false
  ),
  silent_rewrite_allowed boolean not null default false check (
    silent_rewrite_allowed = false
  ),
  response_depth_changes_data boolean not null default false check (
    response_depth_changes_data = false
  ),
  preserve_data_contract boolean not null default true check (
    preserve_data_contract = true
  ),
  live_workflow_execution_enabled boolean not null default false check (
    live_workflow_execution_enabled = false
  ),
  live_replay_execution_enabled boolean not null default false check (
    live_replay_execution_enabled = false
  ),
  live_queue_writes_enabled boolean not null default false check (
    live_queue_writes_enabled = false
  ),
  live_db_writes_enabled boolean not null default false check (
    live_db_writes_enabled = false
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  gate_status text not null default 'blocked_live_task_replay_mode_validation' check (
    gate_status in ('blocked_live_task_replay_mode_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.task_replay_mode_release_gate_contract (
  contract_name text not null default 'task_replay_mode_release_gate',
  contract_version text not null default '2026-06-21.phase3.task-replay-mode-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /agent/runtime',
  gate_route text not null default 'POST /agent/release-gates/task-replay-mode/plan',
  workflow_task_route text not null default 'POST /agent/workflows/tasks/plan',
  workflow_resume_route text not null default 'GET /agent/workflows/tasks/:task_id',
  research_save_route text not null default 'POST /research/runs/save/plan',
  research_replay_route text not null default 'POST /research/runs/replay/plan',
  localized_response_route text not null default 'POST /agent/runs/plan',
  task_id_visible boolean not null default true check (
    task_id_visible = true
  ),
  resume_handle_required boolean not null default true check (
    resume_handle_required = true
  ),
  disconnect_safe boolean not null default true check (
    disconnect_safe = true
  ),
  deterministic_replay_seed_required boolean not null default true check (
    deterministic_replay_seed_required = true
  ),
  old_report_immutable boolean not null default true check (
    old_report_immutable = true
  ),
  old_report_mutation_allowed boolean not null default false check (
    old_report_mutation_allowed = false
  ),
  silent_rewrite_allowed boolean not null default false check (
    silent_rewrite_allowed = false
  ),
  response_depth_changes_data boolean not null default false check (
    response_depth_changes_data = false
  ),
  preserve_data_contract boolean not null default true check (
    preserve_data_contract = true
  ),
  live_workflow_execution_enabled boolean not null default false check (
    live_workflow_execution_enabled = false
  ),
  live_replay_execution_enabled boolean not null default false check (
    live_replay_execution_enabled = false
  ),
  live_queue_writes_enabled boolean not null default false check (
    live_queue_writes_enabled = false
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
