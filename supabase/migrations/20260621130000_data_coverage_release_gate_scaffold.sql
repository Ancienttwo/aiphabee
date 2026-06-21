create schema if not exists core;
create schema if not exists governance;

create table if not exists core.data_coverage_release_gate (
  coverage_gate_key text not null,
  entry_kind text not null check (entry_kind in ('freshness_marker', 'coverage_domain')),
  entry_name text not null,
  coverage_policy_version text not null,
  required_label text,
  release_state text not null default 'blocked' check (
    release_state in ('blocked', 'verified')
  ),
  live_partner_rows_loaded boolean not null default false,
  persistent_write_enabled boolean not null default false,
  sql_emitted boolean not null default false,
  source_record_ref text not null,
  created_at timestamptz not null default now(),
  primary key (coverage_gate_key)
);

create table if not exists governance.data_coverage_release_gate_contract (
  contract_name text not null default 'data_coverage_release_gate',
  contract_version text not null default '2026-06-21.phase3.data-coverage-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /gateway/runtime',
  release_gate_route text not null default 'GET /gateway/data-coverage/release-gate',
  required_freshness_tiers text[] not null default array['realtime', 'delayed', 'eod'],
  required_coverage_domains text[] not null default array[
    'corporate_actions',
    'financial_restatements',
    'delistings',
    'identifier_history'
  ],
  live_partner_data_reads boolean not null default false,
  coverage_policy_loaded boolean not null default false,
  persistent_write_enabled boolean not null default false,
  sql_emitted boolean not null default false,
  default_rights_status text not null default 'default_deny',
  gate_status text not null default 'blocked_live_partner_coverage',
  created_at timestamptz not null default now()
);
