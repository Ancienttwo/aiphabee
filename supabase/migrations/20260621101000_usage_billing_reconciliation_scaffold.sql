create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.subscription_invoice (
  invoice_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  subscription_id text not null references platform.workspace_subscription(subscription_id),
  period_start timestamptz not null,
  period_end timestamptz not null,
  invoice_status text not null default 'planned' check (
    invoice_status in ('planned', 'draft', 'open', 'reconciled', 'void')
  ),
  credits_total numeric not null default 0 check (credits_total >= 0),
  amount_minor integer not null default 0 check (amount_minor >= 0),
  currency text not null default 'HKD',
  provider_name text not null default 'not_configured',
  provider_reference_id text,
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end > period_start)
);

create table if not exists aiphabee_core.subscription_invoice_line (
  invoice_line_id text primary key,
  invoice_id text not null references aiphabee_core.subscription_invoice(invoice_id),
  ledger_entry_id text not null references aiphabee_core.usage_ledger_entry(ledger_entry_id),
  usage_event_id text not null references aiphabee_core.usage_event(usage_event_id),
  request_id text not null,
  credit_delta numeric not null check (credit_delta >= 0),
  amount_minor integer not null default 0 check (amount_minor >= 0),
  trace_status text not null default 'traceable' check (
    trace_status in ('traceable', 'mismatch')
  ),
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  unique (invoice_id, ledger_entry_id)
);

create table if not exists aiphabee_governance.usage_billing_reconciliation_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.usage_billing_reconciliation_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase2.usage_billing_reconciliation',
  '2026-06-21.phase2.usage-billing-reconciliation-scaffold.v0',
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
