create schema if not exists core;
create schema if not exists governance;

create table if not exists core.plan_pricing_catalog (
  pricing_catalog_ref text not null,
  plan_code text not null check (plan_code in ('pro', 'developer')),
  currency text not null default 'HKD',
  monthly_amount_minor integer not null check (monthly_amount_minor >= 0),
  display_price text not null,
  price_status text not null default 'validation_assumption_not_final_quote',
  billing_period text not null default 'monthly',
  pricing_source text not null default 'docs/researches/AiphaBee_PRD_v1.0.md#15.2',
  live_price_enabled boolean not null default false,
  billing_provider_calls boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now(),
  primary key (pricing_catalog_ref)
);

create table if not exists core.plan_entitlement_bundle (
  entitlement_bundle_ref text not null,
  pricing_catalog_ref text not null references core.plan_pricing_catalog(pricing_catalog_ref),
  plan_code text not null check (plan_code in ('pro', 'developer')),
  usage_channels text[] not null default array['web_agent', 'mcp'],
  web_entitlements text[] not null default '{}',
  mcp_entitlements text[] not null default '{}',
  credit_limit integer not null check (credit_limit >= 0),
  overage_enabled boolean not null default false,
  commercial_external_redistribution boolean not null default false,
  export_requires_field_authorization boolean not null default true,
  partner_rights_matrix_required boolean not null default true,
  persistent_writes_enabled boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now(),
  primary key (entitlement_bundle_ref)
);

create table if not exists governance.package_pricing_contract (
  contract_name text not null default 'package_pricing',
  contract_version text not null default '2026-06-21.phase3.package-pricing-scaffold.v0',
  route text not null default 'GET /account/package-pricing',
  runtime_route text not null default 'GET /account/runtime',
  pricing_source text not null default 'docs/researches/AiphaBee_PRD_v1.0.md#15.2',
  currency text not null default 'HKD',
  live_price_enabled boolean not null default false,
  billing_provider_calls boolean not null default false,
  persistent_writes_enabled boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
