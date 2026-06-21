create schema if not exists core;
create schema if not exists governance;

create table if not exists core.deep_report_snapshot (
  report_id text primary key,
  task_id text not null references core.workflow_task(task_id),
  workspace_id text not null references core.workspace(workspace_id),
  user_id text not null,
  question text not null,
  generated_at timestamptz not null,
  as_of timestamptz not null,
  data_delay_minutes integer not null check (data_delay_minutes >= 0),
  report_status text not null default 'planned' check (
    report_status in ('planned', 'frozen', 'published', 'superseded')
  ),
  report_version text not null,
  disclaimer text not null,
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id)
);

create table if not exists core.deep_report_evidence_index (
  evidence_index_id text primary key,
  report_id text not null references core.deep_report_snapshot(report_id),
  evidence_record_id text not null,
  source_record_id text not null,
  section_id text not null,
  claim_label text not null check (
    claim_label in ('fact', 'calculation', 'inference', 'unknown')
  ),
  citation_status text not null default 'planned_validation' check (
    citation_status in ('planned_validation', 'validated', 'unsupported')
  ),
  data_version text not null,
  methodology_version text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, evidence_record_id),
  unique (report_id, section_id, source_record_id)
);

create table if not exists governance.deep_report_workflow_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into governance.deep_report_workflow_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase2.deep_report_workflow',
  '2026-06-21.phase2.deep-report-workflow-scaffold.v0',
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
