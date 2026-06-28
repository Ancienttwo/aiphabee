create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.usage_meter_rule (
  meter_rule_id text primary key,
  meter_name text not null,
  channel text not null check (channel in ('web', 'mcp', 'api', 'export')),
  dataset text not null,
  operation text not null check (
    operation in ('data_access', 'agent_run', 'tool_call', 'export', 'eval_run')
  ),
  unit_name text not null check (
    unit_name in ('call', 'row', 'field', 'credit', 'byte', 'model_unit')
  ),
  credit_weight numeric not null default 0 check (credit_weight >= 0),
  rights_policy_version text not null,
  methodology_version text not null,
  effective_from timestamptz not null,
  effective_to timestamptz,
  status text not null default 'planned' check (status in ('planned', 'active', 'retired')),
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from)
);

create table if not exists aiphabee_core.usage_event (
  usage_event_id text primary key,
  request_id text not null,
  run_id text,
  workspace_id text not null references platform.workspace(workspace_id),
  account_id text references platform.account(account_id),
  membership_id text references platform.workspace_membership(membership_id),
  channel text not null check (channel in ('web', 'mcp', 'api', 'export')),
  dataset text not null,
  tool_name text,
  operation text not null check (
    operation in ('data_access', 'agent_run', 'tool_call', 'export', 'eval_run')
  ),
  occurred_at timestamptz not null,
  metered_rows integer not null default 0 check (metered_rows >= 0),
  metered_fields integer not null default 0 check (metered_fields >= 0),
  input_units integer not null default 0 check (input_units >= 0),
  output_units integer not null default 0 check (output_units >= 0),
  cache_state text not null default 'miss' check (cache_state in ('hit', 'miss', 'not_applicable')),
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  data_version text not null,
  methodology_version text not null,
  rights_policy_version text not null,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  unique (request_id, operation, dataset, occurred_at)
);

create table if not exists aiphabee_core.usage_reconciliation_batch (
  reconciliation_batch_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  period_start timestamptz not null,
  period_end timestamptz not null,
  target_delay_minutes integer not null default 5 check (
    target_delay_minutes > 0 and target_delay_minutes <= 5
  ),
  credits_total numeric not null default 0 check (credits_total >= 0),
  status text not null default 'held' check (
    status in ('held', 'ready', 'reconciled', 'failed')
  ),
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end > period_start)
);

create table if not exists aiphabee_core.usage_ledger_entry (
  ledger_entry_id text primary key,
  usage_event_id text not null references aiphabee_core.usage_event(usage_event_id),
  workspace_id text not null references platform.workspace(workspace_id),
  account_id text references platform.account(account_id),
  subscription_id text references platform.workspace_subscription(subscription_id),
  meter_rule_id text not null references aiphabee_core.usage_meter_rule(meter_rule_id),
  reconciliation_batch_id text references aiphabee_core.usage_reconciliation_batch(reconciliation_batch_id),
  credit_delta numeric not null check (credit_delta >= 0),
  billable_state text not null default 'preview' check (
    billable_state in ('preview', 'posted', 'waived', 'reversed', 'blocked')
  ),
  posted_at timestamptz,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usage_event_id, meter_rule_id)
);

create table if not exists aiphabee_governance.usage_ledger_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.usage_ledger_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded
)
values (
  'phase1.usage_ledger',
  '2026-06-20.phase1.usage-ledger.v0',
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
