create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.p0_rights_matrix_entry (
  rights_matrix_entry_id text not null,
  entry_kind text not null check (entry_kind in ('tool', 'dataset_field')),
  entry_name text not null,
  surface text not null check (surface in ('web', 'mcp', 'export', 'enterprise')),
  rights_state text not null default 'default_deny' check (
    rights_state in ('default_deny', 'approved', 'blocked')
  ),
  rights_policy_version text not null,
  partner_signed_matrix_loaded boolean not null default false,
  live_read_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  primary key (rights_matrix_entry_id)
);

create table if not exists aiphabee_governance.p0_rights_matrix_contract (
  contract_name text not null default 'p0_rights_matrix_coverage',
  contract_version text not null default '2026-06-21.phase3.p0-rights-matrix-coverage-scaffold.v0',
  runtime_route text not null default 'GET /gateway/runtime',
  coverage_route text not null default 'GET /gateway/rights-matrix/p0/coverage',
  required_p0_tool_count integer not null default 16,
  web_configured boolean not null default true,
  mcp_configured boolean not null default true,
  export_configured boolean not null default true,
  enterprise_configured boolean not null default true,
  default_rights_status text not null default 'default_deny',
  partner_signed_matrix_loaded boolean not null default false,
  live_read_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  sql_emitted boolean not null default false,
  created_at timestamptz not null default now()
);
