create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.watchlist_briefing (
  briefing_id text primary key,
  watchlist_id text not null references aiphabee_core.watchlist(watchlist_id),
  workspace_id text not null references platform.workspace(workspace_id),
  user_id text not null,
  cadence text not null check (cadence in ('daily', 'weekly')),
  as_of timestamptz not null,
  timezone text not null default 'Asia/Hong_Kong',
  material_changes_only boolean not null default true check (material_changes_only = true),
  min_materiality_score numeric not null default 0.6 check (
    min_materiality_score >= 0 and min_materiality_score <= 1
  ),
  max_items integer not null default 12 check (max_items > 0),
  briefing_status text not null default 'planned' check (
    briefing_status in ('planned', 'ready', 'sent', 'suppressed_empty', 'failed')
  ),
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (watchlist_id, cadence, as_of)
);

create table if not exists aiphabee_core.watchlist_briefing_item (
  briefing_item_id text primary key,
  briefing_id text not null references aiphabee_core.watchlist_briefing(briefing_id),
  watchlist_item_id text not null references aiphabee_core.watchlist_item(watchlist_item_id),
  change_kind text not null check (change_kind in ('price', 'announcement', 'metric')),
  materiality_score numeric not null check (
    materiality_score >= 0 and materiality_score <= 1
  ),
  summary_status text not null default 'planned' check (
    summary_status in ('planned', 'included', 'suppressed_low_materiality')
  ),
  evidence_record_id text,
  source_record_id text not null,
  data_version text not null,
  methodology_version text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (briefing_id, watchlist_item_id, change_kind, source_record_id)
);

create table if not exists aiphabee_governance.watchlist_briefings_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.watchlist_briefings_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase2.watchlist_briefings',
  '2026-06-21.phase2.watchlist-briefings-scaffold.v0',
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
