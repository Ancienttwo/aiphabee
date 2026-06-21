create schema if not exists core;
create schema if not exists governance;

create table if not exists core.watchlist (
  watchlist_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  owner_user_id text not null,
  name text not null,
  list_status text not null default 'planned' check (
    list_status in ('planned', 'active', 'paused', 'archived')
  ),
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.watchlist_item (
  watchlist_item_id text primary key,
  watchlist_id text not null references core.watchlist(watchlist_id),
  instrument_id text,
  security_query text,
  item_status text not null default 'planned' check (
    item_status in ('planned', 'active', 'paused', 'archived')
  ),
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (instrument_id is not null or security_query is not null),
  unique (watchlist_id, instrument_id),
  unique (watchlist_id, security_query)
);

create table if not exists core.watchlist_alert_rule (
  alert_rule_id text primary key,
  watchlist_item_id text not null references core.watchlist_item(watchlist_item_id),
  alert_kind text not null check (alert_kind in ('price', 'announcement', 'metric')),
  frequency text not null check (frequency in ('realtime', 'daily', 'weekly')),
  quiet_hours_start text,
  quiet_hours_end text,
  timezone text not null default 'Asia/Hong_Kong',
  idempotency_key text not null,
  scope_name text not null default 'alerts.write' check (scope_name = 'alerts.write'),
  explicit_confirmation boolean not null default false,
  rule_status text not null default 'planned' check (
    rule_status in ('planned', 'active', 'paused', 'archived')
  ),
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists core.watchlist_alert_event (
  alert_event_id text primary key,
  alert_rule_id text not null references core.watchlist_alert_rule(alert_rule_id),
  source_record_id text not null,
  event_status text not null default 'planned' check (
    event_status in ('planned', 'suppressed_duplicate', 'ready_to_send', 'sent', 'failed')
  ),
  dedupe_key text not null,
  evidence_record_id text,
  occurred_at timestamptz not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (alert_rule_id, dedupe_key, source_record_id)
);

create table if not exists governance.watchlist_alerts_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into governance.watchlist_alerts_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase2.watchlist_alerts',
  '2026-06-21.phase2.watchlist-alerts-scaffold.v0',
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
