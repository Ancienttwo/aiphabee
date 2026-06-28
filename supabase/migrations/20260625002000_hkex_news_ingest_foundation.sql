create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

alter table aiphabee_core.raw_snapshot
  drop constraint if exists raw_snapshot_record_kind_check;

alter table aiphabee_core.raw_snapshot
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
      'hkex_news_transform'
    )
  );

alter table aiphabee_core.serving_dataset
  drop constraint if exists serving_dataset_domain_check;

alter table aiphabee_core.serving_dataset
  add constraint serving_dataset_domain_check check (
    domain in (
      'security_master',
      'quote_snapshot',
      'price_history',
      'financial_fact',
      'corporate_action',
      'derived_metric',
      'ipo_pipeline',
      'hkex_news'
    )
  );

create table if not exists aiphabee_core.hkex_news_crawl_run (
  crawl_run_id text primary key,
  source_name text not null default 'hkex_news',
  source_surface text not null check (
    source_surface in (
      'latest_list',
      'title_search',
      'content_search',
      'new_listing_information',
      'ap_phip',
      'progress_report'
    )
  ),
  target_url text not null,
  crawl_scope text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('running', 'completed', 'failed', 'cancelled')),
  request_fingerprint text not null,
  discovered_count integer not null default 0 check (discovered_count >= 0),
  fetched_count integer not null default 0 check (fetched_count >= 0),
  changed_count integer not null default 0 check (changed_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  error_summary text,
  data_version text not null references aiphabee_core.data_version_batch(data_version),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_core.hkex_news_document (
  document_id text primary key,
  source_name text not null default 'hkex_news',
  source_record_id text not null,
  canonical_url text not null,
  document_url text,
  title_en text,
  title_zh_hant text,
  issuer_name_en text,
  issuer_name_zh_hant text,
  hkex_code text,
  market text not null default 'UNKNOWN' check (market in ('MAIN', 'GEM', 'UNKNOWN')),
  published_at timestamptz,
  language text not null default 'unknown' check (
    language in ('en', 'zh_hant', 'zh_hans', 'mixed', 'unknown')
  ),
  content_type text,
  latest_content_hash_sha256 text,
  document_state text not null default 'unknown' check (
    document_state in ('active', 'cancelled', 'reissued', 'clarified', 'inactive', 'unknown')
  ),
  access_policy text not null default 'public_general' check (
    access_policy in (
      'public_general',
      'public_new_listing',
      'public_ap_phip_warning_gate',
      'unknown'
    )
  ),
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source_name, source_record_id),
  unique (canonical_url)
);

create table if not exists aiphabee_core.hkex_news_document_observation (
  document_observation_id text primary key,
  document_id text not null references aiphabee_core.hkex_news_document(document_id),
  crawl_run_id text not null references aiphabee_core.hkex_news_crawl_run(crawl_run_id),
  raw_snapshot_id text references aiphabee_core.raw_snapshot(raw_snapshot_id),
  data_version text not null references aiphabee_core.data_version_batch(data_version),
  source_surface text not null check (
    source_surface in (
      'latest_list',
      'title_search',
      'content_search',
      'new_listing_information',
      'ap_phip',
      'progress_report'
    )
  ),
  source_page_url text not null,
  result_rank integer check (result_rank is null or result_rank >= 0),
  discovered_at timestamptz not null default now(),
  fetched_at timestamptz,
  http_status integer check (http_status is null or (http_status >= 100 and http_status <= 599)),
  etag text,
  last_modified text,
  observed_content_hash_sha256 text,
  is_changed boolean not null default false,
  unique (document_id, crawl_run_id, source_page_url)
);

create table if not exists aiphabee_core.hkex_news_document_headline (
  document_headline_id text primary key,
  document_id text not null references aiphabee_core.hkex_news_document(document_id),
  market text not null check (market in ('MAIN', 'GEM', 'UNKNOWN')),
  tier_1 text not null,
  tier_2 text not null,
  headline_label_en text,
  headline_label_zh_hant text,
  source_order integer not null default 1 check (source_order >= 1),
  official_taxonomy_version text not null,
  unique (document_id, tier_1, tier_2, official_taxonomy_version)
);

create table if not exists aiphabee_core.hkex_news_document_relation (
  document_relation_id text primary key,
  from_document_id text not null references aiphabee_core.hkex_news_document(document_id),
  to_document_id text not null references aiphabee_core.hkex_news_document(document_id),
  relation_type text not null check (
    relation_type in ('supersedes', 'clarifies', 'reissues', 'same_ipo_case', 'same_applicant')
  ),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  matched_by text not null,
  data_version text not null references aiphabee_core.data_version_batch(data_version),
  created_at timestamptz not null default now(),
  unique (from_document_id, to_document_id, relation_type, data_version)
);

create table if not exists aiphabee_core.hkex_news_document_content (
  document_content_id text primary key,
  document_id text not null references aiphabee_core.hkex_news_document(document_id),
  raw_snapshot_id text references aiphabee_core.raw_snapshot(raw_snapshot_id),
  storage_uri text,
  binary_hash_sha256 text not null,
  raw_text text,
  sanitized_text text,
  sanitized_html text,
  sanitizer_version text not null,
  extraction_ready boolean not null default false,
  prompt_injection_isolated boolean not null default true,
  created_at timestamptz not null default now(),
  unique (document_id, sanitizer_version, binary_hash_sha256)
);

create table if not exists aiphabee_core.ipo_source_document_link (
  ipo_source_document_link_id text primary key,
  offering_id text references aiphabee_core.ipo_offering(offering_id),
  app_code text references aiphabee_core.ipo_pipeline_application(app_code),
  document_id text not null references aiphabee_core.hkex_news_document(document_id),
  link_type text not null check (
    link_type in (
      'prospectus',
      'phip',
      'allotment_result',
      'listing_approval',
      'announcement',
      'progress_report',
      'other'
    )
  ),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  matched_by text not null,
  data_version text not null references aiphabee_core.data_version_batch(data_version),
  created_at timestamptz not null default now(),
  unique (document_id, link_type, data_version)
);

create table if not exists aiphabee_core.hkex_news_extraction_run (
  extraction_run_id text primary key,
  document_id text not null references aiphabee_core.hkex_news_document(document_id),
  document_content_id text not null references aiphabee_core.hkex_news_document_content(document_content_id),
  extractor_name text not null,
  extractor_version text not null,
  run_kind text not null check (run_kind in ('deterministic', 'llm', 'hybrid')),
  model_name text,
  prompt_version text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('running', 'completed', 'failed', 'cancelled')),
  error_summary text,
  data_version text not null references aiphabee_core.data_version_batch(data_version),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_core.hkex_news_extracted_fact (
  extracted_fact_id text primary key,
  extraction_run_id text not null references aiphabee_core.hkex_news_extraction_run(extraction_run_id),
  document_id text not null references aiphabee_core.hkex_news_document(document_id),
  offering_id text references aiphabee_core.ipo_offering(offering_id),
  app_code text references aiphabee_core.ipo_pipeline_application(app_code),
  fact_namespace text not null default 'ipo',
  fact_key text not null,
  value_type text not null check (
    value_type in ('text', 'numeric', 'date', 'timestamp', 'boolean', 'json')
  ),
  value_text text,
  value_numeric numeric,
  value_date date,
  value_timestamptz timestamptz,
  value_boolean boolean,
  value_json jsonb not null default '{}'::jsonb,
  unit text,
  currency text,
  lang text check (lang in ('en', 'zh_hant', 'zh_hans', 'unknown')),
  locator jsonb not null default '{}'::jsonb,
  locator_hash text not null,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  review_state text not null default 'pending' check (
    review_state in ('pending', 'accepted', 'rejected', 'superseded')
  ),
  raw_snapshot_id text references aiphabee_core.raw_snapshot(raw_snapshot_id),
  data_version text not null references aiphabee_core.data_version_batch(data_version),
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  unique (document_id, fact_key, locator_hash, data_version)
);

create table if not exists aiphabee_core.hkex_news_transform_run (
  transform_run_id text primary key,
  source_name text not null default 'hkex_news',
  data_version text not null references aiphabee_core.data_version_batch(data_version),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('running', 'completed', 'failed', 'cancelled')),
  accepted_fact_count integer not null default 0 check (accepted_fact_count >= 0),
  upserted_offering_count integer not null default 0 check (upserted_offering_count >= 0),
  upserted_timetable_event_count integer not null default 0 check (upserted_timetable_event_count >= 0),
  upserted_allotment_summary_count integer not null default 0 check (upserted_allotment_summary_count >= 0),
  validation_report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.hkex_news_ingest_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  source_name text not null default 'hkex_news',
  runtime_source_of_truth text not null check (runtime_source_of_truth = 'postgres'),
  data_version_release_state text not null check (data_version_release_state = 'held'),
  raw_to_document_to_fact_required boolean not null default true check (raw_to_document_to_fact_required = true),
  deterministic_transform_required boolean not null default true check (deterministic_transform_required = true),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  field_authorization_required boolean not null default true check (field_authorization_required = true),
  export_allowed boolean not null default false check (export_allowed = false),
  mcp_redistribution_allowed boolean not null default false check (mcp_redistribution_allowed = false),
  automation_release_allowed boolean not null default false check (automation_release_allowed = false),
  source_surfaces jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hkex_news_crawl_run_version_status_idx
  on aiphabee_core.hkex_news_crawl_run(data_version, status);
create index if not exists hkex_news_document_code_date_idx
  on aiphabee_core.hkex_news_document(hkex_code, published_at desc);
create index if not exists hkex_news_document_state_idx
  on aiphabee_core.hkex_news_document(document_state, published_at desc);
create index if not exists hkex_news_document_obs_version_idx
  on aiphabee_core.hkex_news_document_observation(data_version, discovered_at desc);
create index if not exists hkex_news_document_headline_idx
  on aiphabee_core.hkex_news_document_headline(tier_1, tier_2);
create index if not exists hkex_news_document_relation_to_idx
  on aiphabee_core.hkex_news_document_relation(to_document_id, relation_type);
create index if not exists hkex_news_document_content_hash_idx
  on aiphabee_core.hkex_news_document_content(binary_hash_sha256);
create index if not exists ipo_source_document_link_offering_idx
  on aiphabee_core.ipo_source_document_link(offering_id, link_type);
create index if not exists hkex_news_extraction_run_document_idx
  on aiphabee_core.hkex_news_extraction_run(document_id, data_version);
create index if not exists hkex_news_extracted_fact_offering_idx
  on aiphabee_core.hkex_news_extracted_fact(offering_id, fact_key, data_version);
create index if not exists hkex_news_extracted_fact_locator_gin
  on aiphabee_core.hkex_news_extracted_fact using gin(locator);
create index if not exists hkex_news_extracted_fact_value_json_gin
  on aiphabee_core.hkex_news_extracted_fact using gin(value_json);
create index if not exists hkex_news_transform_run_version_status_idx
  on aiphabee_core.hkex_news_transform_run(data_version, status);

insert into aiphabee_governance.hkex_news_ingest_contract (
  contract_key,
  contract_version,
  status,
  source_name,
  runtime_source_of_truth,
  data_version_release_state,
  raw_to_document_to_fact_required,
  deterministic_transform_required,
  default_data_rights_status,
  field_authorization_required,
  export_allowed,
  mcp_redistribution_allowed,
  automation_release_allowed,
  source_surfaces
)
values (
  'hkex_news.daily_ingest',
  '2026-06-25.hkex-news-ingest-foundation.v0',
  'local_contract',
  'hkex_news',
  'postgres',
  'held',
  true,
  true,
  'default_deny',
  true,
  false,
  false,
  false,
  '["latest_list","title_search","content_search","new_listing_information","ap_phip","progress_report"]'::jsonb
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  source_name = excluded.source_name,
  runtime_source_of_truth = excluded.runtime_source_of_truth,
  data_version_release_state = excluded.data_version_release_state,
  raw_to_document_to_fact_required = excluded.raw_to_document_to_fact_required,
  deterministic_transform_required = excluded.deterministic_transform_required,
  default_data_rights_status = excluded.default_data_rights_status,
  field_authorization_required = excluded.field_authorization_required,
  export_allowed = excluded.export_allowed,
  mcp_redistribution_allowed = excluded.mcp_redistribution_allowed,
  automation_release_allowed = excluded.automation_release_allowed,
  source_surfaces = excluded.source_surfaces,
  updated_at = now();

insert into aiphabee_governance.ipo_contract (
  contract_key,
  contract_version,
  status,
  default_data_rights_status,
  market_data_loaded,
  live_serving_reads,
  raw_snapshot_required,
  data_version_release_required,
  field_authorization_required,
  export_allowed,
  mcp_redistribution_allowed
)
values (
  'hkex_news.daily_ingest',
  '2026-06-25.hkex-news-ingest-foundation.v0',
  'local_contract',
  'default_deny',
  false,
  false,
  true,
  true,
  true,
  false,
  false
)
on conflict (contract_key) do update set
  contract_version = excluded.contract_version,
  status = excluded.status,
  default_data_rights_status = excluded.default_data_rights_status,
  market_data_loaded = excluded.market_data_loaded,
  live_serving_reads = excluded.live_serving_reads,
  raw_snapshot_required = excluded.raw_snapshot_required,
  data_version_release_required = excluded.data_version_release_required,
  field_authorization_required = excluded.field_authorization_required,
  export_allowed = excluded.export_allowed,
  mcp_redistribution_allowed = excluded.mcp_redistribution_allowed,
  updated_at = now();

insert into aiphabee_core.serving_dataset (
  serving_dataset_id,
  dataset,
  domain,
  description,
  default_quality_state,
  default_rights_status,
  rights_policy_version,
  methodology_version,
  source_record_id
)
values
  ('hkex_news_document', 'hkex_news.document', 'hkex_news', 'HKEX News canonical document metadata held for IPO intelligence review.', 'HOLD', 'default_deny', 'hkex-news-rights-policy-scaffold-v0', '2026-06-25.hkex-news-ingest-foundation.v0', 'hkex-news-serving-dataset:document'),
  ('hkex_news_extracted_fact', 'hkex_news.extracted_fact', 'hkex_news', 'Typed candidate facts extracted from sanitized HKEX News content before deterministic serving projection.', 'HOLD', 'default_deny', 'hkex-news-rights-policy-scaffold-v0', '2026-06-25.hkex-news-ingest-foundation.v0', 'hkex-news-serving-dataset:extracted-fact')
on conflict (dataset) do update set
  domain = excluded.domain,
  description = excluded.description,
  default_quality_state = excluded.default_quality_state,
  default_rights_status = excluded.default_rights_status,
  rights_policy_version = excluded.rights_policy_version,
  methodology_version = excluded.methodology_version,
  source_record_id = excluded.source_record_id,
  updated_at = now();

insert into aiphabee_core.serving_field (
  serving_field_id,
  serving_dataset_id,
  field_path,
  display_name,
  data_type,
  nullable,
  rights_status,
  quality_state,
  methodology_version,
  source_record_id
)
values
  ('hkex_news_document.canonical_url', 'hkex_news_document', 'canonical_url', 'Canonical URL', 'text', false, 'default_deny', 'HOLD', '2026-06-25.hkex-news-ingest-foundation.v0', 'hkex-news-serving-field:document.canonical_url'),
  ('hkex_news_document.document_state', 'hkex_news_document', 'document_state', 'Document lifecycle state', 'text', false, 'default_deny', 'HOLD', '2026-06-25.hkex-news-ingest-foundation.v0', 'hkex-news-serving-field:document.document_state'),
  ('hkex_news_document.access_policy', 'hkex_news_document', 'access_policy', 'Source access policy', 'text', false, 'blocked', 'HOLD', '2026-06-25.hkex-news-ingest-foundation.v0', 'hkex-news-serving-field:document.access_policy'),
  ('hkex_news_extracted_fact.locator', 'hkex_news_extracted_fact', 'locator', 'Evidence locator', 'json', false, 'default_deny', 'HOLD', '2026-06-25.hkex-news-ingest-foundation.v0', 'hkex-news-serving-field:fact.locator'),
  ('hkex_news_extracted_fact.value_json', 'hkex_news_extracted_fact', 'value_json', 'Extracted JSON value', 'json', false, 'blocked', 'HOLD', '2026-06-25.hkex-news-ingest-foundation.v0', 'hkex-news-serving-field:fact.value_json')
on conflict (serving_dataset_id, field_path, methodology_version) do update set
  display_name = excluded.display_name,
  data_type = excluded.data_type,
  nullable = excluded.nullable,
  rights_status = excluded.rights_status,
  quality_state = excluded.quality_state,
  source_record_id = excluded.source_record_id,
  updated_at = now();
