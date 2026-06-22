create schema if not exists core;
create schema if not exists governance;

create table if not exists core.saved_screening (
  saved_screening_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  owner_user_id text not null,
  name text not null,
  screen_route text not null default 'POST /analytics/screen-securities' check (
    screen_route = 'POST /analytics/screen-securities'
  ),
  query_hash text not null,
  natural_language text,
  parsed_conditions jsonb not null default '[]'::jsonb,
  universe text[] not null default array[]::text[],
  point_in_time_re_evaluation boolean not null default true check (
    point_in_time_re_evaluation = true
  ),
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  live_data_access boolean not null default false check (live_data_access = false),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  sql_emitted boolean not null default false check (sql_emitted = false),
  frontend_rendering boolean not null default false check (frontend_rendering = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, owner_user_id, query_hash)
);

create table if not exists core.saved_screening_run_schedule (
  schedule_id text primary key,
  saved_screening_id text not null references core.saved_screening(saved_screening_id),
  cadence text not null default 'manual' check (cadence in ('manual', 'daily', 'weekly')),
  enabled boolean not null default false,
  next_run_at timestamptz,
  timezone text not null default 'Asia/Hong_Kong',
  notification_channels text[] not null default array[]::text[],
  idempotency_key text not null,
  high_cost_queue_route text not null default 'POST /analytics/high-cost/plan' check (
    high_cost_queue_route = 'POST /analytics/high-cost/plan'
  ),
  workflow_binding text not null default 'AIPHABEE_RESEARCH_WORKFLOW' check (
    workflow_binding = 'AIPHABEE_RESEARCH_WORKFLOW'
  ),
  event_queue text not null default 'AIPHABEE_EVENTS_QUEUE' check (
    event_queue = 'AIPHABEE_EVENTS_QUEUE'
  ),
  workflow_execution boolean not null default false check (workflow_execution = false),
  queue_writes boolean not null default false check (queue_writes = false),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists core.saved_screening_run (
  screening_run_id text primary key,
  schedule_id text not null references core.saved_screening_run_schedule(schedule_id),
  request_id text not null,
  run_status text not null default 'planned' check (
    run_status in ('planned', 'blocked', 'ready_to_run', 'completed', 'failed')
  ),
  planned_for timestamptz,
  source_screen_status text not null,
  hit_count integer not null default 0 check (hit_count >= 0),
  source_record_ids text[] not null default array[]::text[],
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  live_execution boolean not null default false check (live_execution = false),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists governance.saved_screening_schedule_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  live_execution boolean not null default false check (live_execution = false),
  workflow_execution boolean not null default false check (workflow_execution = false),
  queue_writes boolean not null default false check (queue_writes = false),
  frontend_rendering boolean not null default false check (frontend_rendering = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into governance.saved_screening_schedule_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded,
  live_execution,
  workflow_execution,
  queue_writes,
  frontend_rendering
)
values (
  'phase2.saved_screening_schedule',
  '2026-06-22.phase2.saved-screening-schedule-scaffold.v0',
  'local_contract',
  'default_deny',
  false,
  false,
  false,
  false,
  false
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_data_rights_status = excluded.default_data_rights_status,
  market_data_loaded = excluded.market_data_loaded,
  live_execution = excluded.live_execution,
  workflow_execution = excluded.workflow_execution,
  queue_writes = excluded.queue_writes,
  frontend_rendering = excluded.frontend_rendering,
  updated_at = now();
