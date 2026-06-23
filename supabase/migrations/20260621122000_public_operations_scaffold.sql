create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.public_status_component (
  status_component_ref text not null,
  component_code text not null,
  evidence_route text not null,
  public_status text not null,
  public_message text not null,
  request_id_visible boolean not null default true,
  live_probe_enabled boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now(),
  primary key (status_component_ref)
);

create table if not exists aiphabee_core.public_document_publication (
  document_publication_ref text not null,
  document_kind text not null check (
    document_kind in ('api_reference', 'mcp_reference', 'privacy_policy', 'terms_of_service')
  ),
  publication_path text not null,
  publication_status text not null default 'local_draft_ready',
  legal_review_required boolean not null default false,
  live_publication_verified boolean not null default false,
  request_id_visible boolean not null default true,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now(),
  primary key (document_publication_ref)
);

create table if not exists aiphabee_governance.public_operations_contract (
  contract_name text not null default 'public_status_docs',
  contract_version text not null default '2026-06-21.phase3.public-status-docs-scaffold.v0',
  runtime_route text not null default 'GET /public/runtime',
  status_route text not null default 'GET /public/status',
  docs_route text not null default 'GET /public/docs',
  live_incident_feed boolean not null default false,
  live_publication_verified boolean not null default false,
  persistent_writes_enabled boolean not null default false,
  request_id_visible boolean not null default true,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
