create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.data_correction_event (
  correction_event_id text primary key,
  source_record_id text not null,
  previous_data_version text,
  corrected_data_version text not null,
  correction_reason text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  event_status text not null default 'planned' check (
    event_status in ('planned', 'reviewed', 'applied', 'rolled_back')
  ),
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists aiphabee_core.research_run_correction_impact (
  impact_id text primary key,
  correction_event_id text not null,
  research_run_id text not null,
  snapshot_id text not null,
  evidence_record_ids text[] not null default array[]::text[],
  impacted_source_record_ids text[] not null default array[]::text[],
  impact_status text not null default 'planned_mark' check (
    impact_status in ('planned_mark', 'marked', 'notified', 'acknowledged')
  ),
  old_report_mutation_allowed boolean not null default false check (
    old_report_mutation_allowed = false
  ),
  silent_rewrite_allowed boolean not null default false check (
    silent_rewrite_allowed = false
  ),
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (correction_event_id, snapshot_id)
);

create table if not exists aiphabee_core.user_notification (
  notification_event_id text primary key,
  impact_id text not null,
  workspace_id text not null,
  user_id text not null,
  channel text not null check (channel in ('in_app', 'email')),
  notification_status text not null default 'planned' check (
    notification_status in ('planned', 'sent', 'failed', 'skipped')
  ),
  event_queue text not null default 'AIPHABEE_EVENTS_QUEUE',
  queue_write_status text not null default 'planned_no_write' check (
    queue_write_status = 'planned_no_write'
  ),
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (impact_id, channel)
);

create table if not exists aiphabee_governance.data_correction_notifications_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.data_correction_notifications_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase2.data_correction_notifications',
  '2026-06-21.phase2.data-correction-notifications-scaffold.v0',
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
