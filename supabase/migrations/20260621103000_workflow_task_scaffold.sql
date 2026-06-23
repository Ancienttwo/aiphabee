create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.workflow_task (
  task_id text primary key,
  request_id text not null,
  run_id text not null,
  workspace_id text not null references platform.workspace(workspace_id),
  user_id text not null,
  workflow_kind text not null check (
    workflow_kind in (
      'deep_report',
      'event_research',
      'long_document',
      'multi_company_analysis'
    )
  ),
  workflow_binding_name text not null default 'AIPHABEE_RESEARCH_WORKFLOW',
  workflow_status text not null default 'planned' check (
    workflow_status in ('planned', 'queued', 'running', 'resume_ready', 'completed', 'failed', 'canceled')
  ),
  resume_handle text not null,
  notification_channels text[] not null default array['in_app'],
  notification_status text not null default 'planned' check (
    notification_status in ('planned', 'sent', 'failed', 'skipped')
  ),
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, workflow_kind)
);

create table if not exists aiphabee_core.workflow_task_checkpoint (
  checkpoint_id text primary key,
  task_id text not null references aiphabee_core.workflow_task(task_id),
  step_id text not null,
  checkpoint_status text not null default 'planned' check (
    checkpoint_status in ('planned', 'ready', 'consumed', 'expired')
  ),
  resume_handle text not null,
  state_summary text not null,
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id, step_id)
);

create table if not exists aiphabee_governance.workflow_task_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.workflow_task_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase2.workflow_task',
  '2026-06-21.phase2.workflow-task-scaffold.v0',
  'local_contract',
  'default_deny',
  false
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_data_rights_status = excluded.default_data_rights_status,
  market_data_loaded = excluded.market_data_loaded,
  updated_at = now();
