create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.evidence_record (
  evidence_record_id text primary key,
  request_id text not null,
  tool_name text not null,
  tool_version text not null,
  input_schema_id text,
  output_schema_id text,
  data_version text not null,
  methodology_version text not null,
  as_of timestamptz not null,
  rights_state text not null default 'default_deny' check (
    rights_state in ('default_deny', 'approved', 'blocked')
  ),
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  citation_label text not null,
  citation_visibility text not null default 'user_visible' check (
    citation_visibility in ('user_visible', 'internal_only')
  ),
  live_write_state text not null default 'planned_no_write' check (
    live_write_state = 'planned_no_write'
  ),
  source_record_count integer not null default 0 check (source_record_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists aiphabee_core.evidence_source_ref (
  evidence_source_ref_id text primary key,
  evidence_record_id text not null references aiphabee_core.evidence_record(evidence_record_id),
  source text not null,
  source_record_id text not null,
  data_version text not null,
  methodology_version text,
  rights_state text not null default 'default_deny' check (
    rights_state in ('default_deny', 'approved', 'blocked')
  ),
  created_at timestamptz not null default now(),
  unique (evidence_record_id, source_record_id, data_version)
);

create table if not exists aiphabee_governance.evidence_lineage_service_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  live_db_writes boolean not null default false check (live_db_writes = false),
  partner_source_records_loaded boolean not null default false check (
    partner_source_records_loaded = false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into aiphabee_governance.evidence_lineage_service_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  live_db_writes,
  partner_source_records_loaded
)
values (
  'phase1.evidence_lineage_service',
  '2026-06-21.phase1.evidence-lineage-service-scaffold.v0',
  'local_contract',
  'default_deny',
  false,
  false
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_data_rights_status = excluded.default_data_rights_status,
  live_db_writes = excluded.live_db_writes,
  partner_source_records_loaded = excluded.partner_source_records_loaded,
  updated_at = now();
