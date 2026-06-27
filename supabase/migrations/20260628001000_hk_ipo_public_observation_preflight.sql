create schema if not exists core;
create schema if not exists governance;

alter table core.raw_snapshot
  drop constraint if exists raw_snapshot_record_kind_check;

alter table core.raw_snapshot
  add constraint raw_snapshot_record_kind_check check (
    record_kind in (
      'company',
      'instrument',
      'listing',
      'identifier_history',
      'financial_fact',
      'corporate_action',
      'vendor_code',
      'ipo_data_period',
      'ipo_pipeline',
      'ipo_overview',
      'ipo_summary',
      'ipo_timetable',
      'ipo_offer_statistics',
      'ipo_parties',
      'ipo_corporate_info',
      'ipo_cornerstone',
      'ipo_pool',
      'ipo_clawback',
      'ipo_allotment',
      'ipo_application',
      'ipo_lockup',
      'hkex_news_document',
      'hkex_news_document_content',
      'hkex_news_extracted_fact',
      'hkex_news_transform',
      'hk_ipo_public_source_record',
      'hk_ipo_public_observation',
      'hk_ipo_public_reconciliation_packet'
    )
  );

create table if not exists core.hk_ipo_public_source_run (
  source_run_id text primary key,
  source_batch_id text not null references core.raw_source_batch(source_batch_id),
  data_version text not null references core.data_version_batch(data_version),
  adapter_version text not null,
  packet_version text not null,
  source_mode text not null check (source_mode in ('fixtures', 'live', 'held')),
  status text not null default 'held' check (status in ('held', 'validated', 'failed', 'superseded')),
  source_ids jsonb not null default '[]'::jsonb,
  security_count integer not null default 0 check (security_count >= 0),
  observation_count integer not null default 0 check (observation_count >= 0),
  reconciliation_row_count integer not null default 0 check (reconciliation_row_count >= 0),
  supplement_candidate_count integer not null default 0 check (supplement_candidate_count >= 0),
  live_network_writes boolean not null default false check (live_network_writes = false),
  writes_serving_tables boolean not null default false check (writes_serving_tables = false),
  created_at timestamptz not null default now(),
  unique (data_version, adapter_version, packet_version, source_mode)
);

create table if not exists core.hk_ipo_public_observation (
  observation_id text primary key,
  source_run_id text not null references core.hk_ipo_public_source_run(source_run_id),
  source_id text not null,
  provider text not null,
  source_url text not null,
  observed_at timestamptz not null,
  source_record_id text not null,
  security_code text not null check (security_code ~ '^[0-9]{5}\.HK$'),
  field_name text not null,
  field_value jsonb not null,
  field_value_type text not null check (
    field_value_type in ('text', 'number', 'boolean', 'array', 'object', 'date', 'url', 'null')
  ),
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  raw_snapshot_required boolean not null default true check (raw_snapshot_required = true),
  reconciled_with_hkex boolean not null default false,
  conflict_status text not null default 'unreconciled' check (
    conflict_status in ('unreconciled', 'agreement', 'single_source', 'conflict', 'rejected')
  ),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  locator jsonb not null default '{}'::jsonb,
  locator_hash text not null,
  data_version text not null references core.data_version_batch(data_version),
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  unique (source_run_id, source_id, source_record_id, field_name, locator_hash)
);

create table if not exists core.hk_ipo_public_reconciliation_row (
  reconciliation_row_id text primary key,
  source_run_id text not null references core.hk_ipo_public_source_run(source_run_id),
  security_code text not null check (security_code ~ '^[0-9]{5}\.HK$'),
  fact_name text not null,
  status text not null check (status in ('agreement', 'conflict', 'single_source')),
  canonical_candidate jsonb,
  source_observation_ids jsonb not null default '[]'::jsonb,
  source_ids jsonb not null default '[]'::jsonb,
  raw_snapshot_request_ids jsonb not null default '[]'::jsonb,
  hkex_evidence_ids jsonb not null default '[]'::jsonb,
  hkex_url_host text not null default 'www1.hkexnews.hk' check (hkex_url_host = 'www1.hkexnews.hk'),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  reason text not null,
  raw_snapshot_required boolean not null default true check (raw_snapshot_required = true),
  conflict_requires_manual_review boolean not null default false,
  promotes_fact boolean not null default false check (promotes_fact = false),
  data_version text not null references core.data_version_batch(data_version),
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  unique (source_run_id, security_code, fact_name)
);

create table if not exists core.hk_ipo_public_supplement_candidate (
  supplement_candidate_id text primary key,
  source_run_id text not null references core.hk_ipo_public_source_run(source_run_id),
  source_observation_id text not null references core.hk_ipo_public_observation(observation_id),
  security_code text not null check (security_code ~ '^[0-9]{5}\.HK$'),
  source_id text not null,
  source_record_id text not null,
  field_name text not null,
  field_value_type text not null,
  status text not null default 'candidate' check (
    status in ('candidate', 'accepted_after_review', 'rejected', 'superseded')
  ),
  raw_snapshot_required boolean not null default true check (raw_snapshot_required = true),
  promotes_fact boolean not null default false check (promotes_fact = false),
  reason text not null,
  data_version text not null references core.data_version_batch(data_version),
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  unique (source_run_id, source_observation_id, field_name)
);

create table if not exists governance.hk_ipo_public_observation_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  canonical_source text not null check (canonical_source = 'hkex_news'),
  third_party_observations_are_canonical boolean not null default false check (
    third_party_observations_are_canonical = false
  ),
  source_attribution_required boolean not null default true check (source_attribution_required = true),
  raw_snapshot_required_before_promotion boolean not null default true check (
    raw_snapshot_required_before_promotion = true
  ),
  default_data_rights_status text not null default 'default_deny' check (
    default_data_rights_status = 'default_deny'
  ),
  writes_serving_tables_allowed boolean not null default false check (writes_serving_tables_allowed = false),
  automation_release_allowed boolean not null default false check (automation_release_allowed = false),
  raw_html_repo_storage_allowed boolean not null default false check (raw_html_repo_storage_allowed = false),
  export_allowed boolean not null default false check (export_allowed = false),
  mcp_redistribution_allowed boolean not null default false check (mcp_redistribution_allowed = false),
  allowed_sources jsonb not null default '["aastocks_ipo_plus", "vbkr_hk_ipo"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hk_ipo_public_source_run_version_status_idx
  on core.hk_ipo_public_source_run(data_version, status);
create index if not exists hk_ipo_public_observation_code_field_idx
  on core.hk_ipo_public_observation(security_code, field_name, observed_at desc);
create index if not exists hk_ipo_public_observation_source_record_idx
  on core.hk_ipo_public_observation(source_id, source_record_id);
create index if not exists hk_ipo_public_observation_value_json_gin
  on core.hk_ipo_public_observation using gin (field_value);
create index if not exists hk_ipo_public_reconciliation_status_idx
  on core.hk_ipo_public_reconciliation_row(data_version, status, security_code);
create index if not exists hk_ipo_public_supplement_candidate_status_idx
  on core.hk_ipo_public_supplement_candidate(data_version, status, field_name);

insert into governance.hk_ipo_public_observation_contract (
  contract_key,
  contract_version,
  status,
  canonical_source,
  third_party_observations_are_canonical,
  source_attribution_required,
  raw_snapshot_required_before_promotion,
  default_data_rights_status,
  writes_serving_tables_allowed,
  automation_release_allowed,
  raw_html_repo_storage_allowed,
  export_allowed,
  mcp_redistribution_allowed,
  allowed_sources
)
values (
  'hk_ipo.public_observation_preflight',
  '2026-06-28.hk-ipo-public-observation-preflight.v0',
  'local_contract',
  'hkex_news',
  false,
  true,
  true,
  'default_deny',
  false,
  false,
  false,
  false,
  false,
  '["aastocks_ipo_plus", "vbkr_hk_ipo"]'::jsonb
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  canonical_source = excluded.canonical_source,
  third_party_observations_are_canonical = excluded.third_party_observations_are_canonical,
  source_attribution_required = excluded.source_attribution_required,
  raw_snapshot_required_before_promotion = excluded.raw_snapshot_required_before_promotion,
  default_data_rights_status = excluded.default_data_rights_status,
  writes_serving_tables_allowed = excluded.writes_serving_tables_allowed,
  automation_release_allowed = excluded.automation_release_allowed,
  raw_html_repo_storage_allowed = excluded.raw_html_repo_storage_allowed,
  export_allowed = excluded.export_allowed,
  mcp_redistribution_allowed = excluded.mcp_redistribution_allowed,
  allowed_sources = excluded.allowed_sources,
  updated_at = now();
