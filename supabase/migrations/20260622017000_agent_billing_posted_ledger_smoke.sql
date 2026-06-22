create schema if not exists governance;

create table if not exists governance.agent_billing_posted_ledger_smoke_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_rights_status text not null check (default_rights_status = 'default_deny'),
  guarded_smoke_only boolean not null default true check (guarded_smoke_only = true),
  synthetic_posted_transition boolean not null default true check (
    synthetic_posted_transition = true
  ),
  billing_provider_calls boolean not null default false check (
    billing_provider_calls = false
  ),
  invoice_writes boolean not null default false check (invoice_writes = false),
  production_billing_posted boolean not null default false check (
    production_billing_posted = false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into governance.agent_billing_posted_ledger_smoke_contract (
  contract_key,
  contract_version,
  status,
  default_rights_status,
  guarded_smoke_only,
  synthetic_posted_transition,
  billing_provider_calls,
  invoice_writes,
  production_billing_posted
)
values (
  'phase1.agent_billing_posted_ledger_smoke',
  '2026-06-22.phase1.agent-billing-posted-ledger-smoke.v0',
  'local_contract',
  'default_deny',
  true,
  true,
  false,
  false,
  false
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_rights_status = excluded.default_rights_status,
  guarded_smoke_only = excluded.guarded_smoke_only,
  synthetic_posted_transition = excluded.synthetic_posted_transition,
  billing_provider_calls = excluded.billing_provider_calls,
  invoice_writes = excluded.invoice_writes,
  production_billing_posted = excluded.production_billing_posted,
  updated_at = now();
