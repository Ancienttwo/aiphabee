create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.hk_data_domain_coverage (
  hk_data_domain_coverage_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  market text not null default 'HK' check (market = 'HK'),
  domain text not null check (
    domain in (
      'ipo_pipeline',
      'index_constituents',
      'stock_connect_flow',
      'short_selling',
      'ownership_disclosure',
      'warrants_cbbc',
      'sector_industry_classification',
      'corporate_calendar',
      'dividend_calendar'
    )
  ),
  coverage_status text not null default 'planned_no_write' check (
    coverage_status in ('planned_no_write', 'active', 'held', 'retired')
  ),
  point_in_time_required boolean not null default true,
  live_data_loaded boolean not null default false,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists core.cross_market_security_mapping (
  cross_market_security_mapping_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  base_market text not null default 'HK' check (base_market = 'HK'),
  comparison_market text not null check (comparison_market in ('CN_A', 'US', 'SG')),
  mapping_type text not null check (
    mapping_type in (
      'dual_listing',
      'adr_equivalence',
      'stock_connect_eligibility',
      'industry_classification',
      'currency_normalization',
      'trading_calendar_alignment',
      'corporate_action_alignment'
    )
  ),
  matching_status text not null default 'planned_no_write' check (
    matching_status in ('planned_no_write', 'matched', 'ambiguous', 'not_found')
  ),
  fx_rate_required boolean not null default false,
  calendar_alignment_required boolean not null default true,
  live_mapping_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists audit.market_domain_coverage_event (
  market_domain_coverage_event_id text primary key,
  request_id text not null,
  workspace_id text not null references core.workspace(workspace_id),
  event_type text not null default 'market_data.domains.cross_market.plan' check (
    event_type in (
      'market_data.domains.cross_market.plan',
      'market_data.domains.coverage.plan'
    )
  ),
  raw_partner_payload_included boolean not null default false,
  live_data_loaded boolean not null default false,
  write_status text not null default 'planned_no_write' check (
    write_status in ('planned_no_write', 'written')
  ),
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists governance.hk_data_domain_cross_market_contract (
  contract_name text not null default 'hk_data_domains_cross_market',
  contract_version text not null default '2026-06-22.phase4.hk-data-domains-cross-market-scaffold.v0',
  runtime_route text not null default 'GET /market-data/domains/runtime',
  plan_route text not null default 'POST /market-data/domains/cross-market/plan',
  data_gateway_route text not null default 'POST /gateway/exports/plan',
  analytics_comparison_route text not null default 'POST /analytics/compare-securities',
  point_in_time_required boolean not null default true,
  rights_matrix_required boolean not null default true,
  field_authorization_required boolean not null default true,
  external_redistribution_allowed boolean not null default false,
  mcp_redistribution_allowed boolean not null default false,
  export_allowed boolean not null default false,
  live_data_access_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  sql_emitted boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
