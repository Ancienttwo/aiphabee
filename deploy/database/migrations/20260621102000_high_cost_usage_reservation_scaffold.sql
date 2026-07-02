create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.usage_credit_reservation (
  reservation_id text primary key,
  request_id text not null,
  workspace_id text not null references platform.workspace(workspace_id),
  subscription_id text not null references platform.workspace_subscription(subscription_id),
  task_id text not null,
  tool_name text not null,
  estimated_credits numeric not null check (estimated_credits >= 0),
  pre_debit_ledger_entry_id text references aiphabee_core.usage_ledger_entry(ledger_entry_id),
  refund_ledger_entry_id text references aiphabee_core.usage_ledger_entry(ledger_entry_id),
  reservation_status text not null default 'planned' check (
    reservation_status in (
      'planned',
      'awaiting_confirmation',
      'blocked_missing_context',
      'refunded',
      'settled'
    )
  ),
  execution_status text not null default 'planned' check (
    execution_status in ('planned', 'failed', 'succeeded')
  ),
  idempotency_key text not null unique,
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, task_id)
);

create table if not exists aiphabee_governance.high_cost_usage_reservation_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.high_cost_usage_reservation_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase2.high_cost_usage_reservation',
  '2026-06-21.phase2.high-cost-usage-reservation-scaffold.v0',
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
