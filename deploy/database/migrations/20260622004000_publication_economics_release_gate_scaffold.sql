create schema if not exists aiphabee_audit;
create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.publication_economics_release_gate (
  gate_ref text primary key,
  request_id text not null,
  runtime_route text not null default 'GET /public/runtime' check (
    runtime_route = 'GET /public/runtime'
  ),
  gate_route text not null default 'POST /public/release-gates/publication-economics/plan' check (
    gate_route = 'POST /public/release-gates/publication-economics/plan'
  ),
  public_status_route text not null default 'GET /public/status' check (
    public_status_route = 'GET /public/status'
  ),
  docs_route text not null default 'GET /public/docs' check (
    docs_route = 'GET /public/docs'
  ),
  help_center_route text not null default 'GET /support/help-center' check (
    help_center_route = 'GET /support/help-center'
  ),
  account_pricing_route text not null default 'GET /account/package-pricing' check (
    account_pricing_route = 'GET /account/package-pricing'
  ),
  required_checks text[] not null default array[
    'public_status_page_scaffold_published',
    'help_center_manifest_published',
    'privacy_and_terms_publication_ready',
    'package_pricing_catalog_present',
    'unit_economics_positive_for_expected_usage',
    'live_publication_and_finance_writes_blocked'
  ],
  public_status_page_ready boolean not null default true check (
    public_status_page_ready = true
  ),
  help_center_manifest_ready boolean not null default true check (
    help_center_manifest_ready = true
  ),
  privacy_terms_publication_ready boolean not null default true check (
    privacy_terms_publication_ready = true
  ),
  package_pricing_catalog_present boolean not null default true check (
    package_pricing_catalog_present = true
  ),
  unit_economics_positive boolean not null default true check (
    unit_economics_positive = true
  ),
  live_deployment_verified boolean not null default false check (
    live_deployment_verified = false
  ),
  live_legal_approval_enabled boolean not null default false check (
    live_legal_approval_enabled = false
  ),
  live_finance_signoff_enabled boolean not null default false check (
    live_finance_signoff_enabled = false
  ),
  live_pricing_provider_enabled boolean not null default false check (
    live_pricing_provider_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  gate_status text not null default 'blocked_live_publication_economics_validation' check (
    gate_status in ('blocked_live_publication_economics_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_audit.publication_economics_drill_event (
  drill_event_ref text primary key,
  request_id text not null,
  drill_kind text not null check (
    drill_kind in ('public_status', 'help_center', 'privacy_terms', 'package_pricing', 'unit_economics')
  ),
  route text not null,
  outcome text not null default 'planned_no_write' check (
    outcome = 'planned_no_write'
  ),
  request_id_visible boolean not null default true check (
    request_id_visible = true
  ),
  contribution_margin_positive boolean not null default true check (
    contribution_margin_positive = true
  ),
  live_read_enabled boolean not null default false check (
    live_read_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.publication_economics_release_gate_contract (
  contract_name text not null default 'publication_economics_release_gate',
  contract_version text not null default '2026-06-22.phase3.publication-economics-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /public/runtime',
  gate_route text not null default 'POST /public/release-gates/publication-economics/plan',
  public_status_route text not null default 'GET /public/status',
  docs_route text not null default 'GET /public/docs',
  help_center_route text not null default 'GET /support/help-center',
  account_pricing_route text not null default 'GET /account/package-pricing',
  status_help_privacy_terms_publication_required boolean not null default true check (
    status_help_privacy_terms_publication_required = true
  ),
  positive_unit_economics_required boolean not null default true check (
    positive_unit_economics_required = true
  ),
  pro_margin_target_bps integer not null default 7000 check (
    pro_margin_target_bps = 7000
  ),
  developer_margin_target_bps integer not null default 6000 check (
    developer_margin_target_bps = 6000
  ),
  live_deployment_verified boolean not null default false check (
    live_deployment_verified = false
  ),
  live_legal_approval_enabled boolean not null default false check (
    live_legal_approval_enabled = false
  ),
  live_finance_signoff_enabled boolean not null default false check (
    live_finance_signoff_enabled = false
  ),
  live_pricing_provider_enabled boolean not null default false check (
    live_pricing_provider_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
