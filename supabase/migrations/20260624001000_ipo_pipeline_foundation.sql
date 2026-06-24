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
      'ipo_lockup'
    )
  );

alter table core.serving_dataset
  drop constraint if exists serving_dataset_domain_check;

alter table core.serving_dataset
  add constraint serving_dataset_domain_check check (
    domain in (
      'security_master',
      'quote_snapshot',
      'price_history',
      'financial_fact',
      'corporate_action',
      'derived_metric',
      'ipo_pipeline'
    )
  );

alter table core.serving_record
  drop constraint if exists serving_record_entity_type_check;

alter table core.serving_record
  add constraint serving_record_entity_type_check check (
    entity_type in (
      'company',
      'instrument',
      'listing',
      'market',
      'workspace',
      'unknown',
      'ipo_offering',
      'ipo_pipeline_application'
    )
  );

create table if not exists core.vendor_code (
  table_name text not null,
  code text not null,
  name_en text,
  name_zh_hant text,
  name_zh_hans text,
  extra jsonb not null default '{}'::jsonb,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (table_name, code, data_version)
);

create table if not exists core.ipo_offering (
  offering_id text primary key,
  hkex_code text not null,
  listing_date date not null,
  ipo_status text not null check (
    ipo_status in ('in_process', 'cancelled', 'suspended', 'listed', 'withdrawn', 'unknown')
  ),
  listing_board text check (listing_board in ('MAIN', 'GEM', 'NASQ', 'UNKNOWN')),
  listing_type text check (listing_type in ('Normal', '18A', '18C', 'Unknown')),
  listing_method_en text,
  listing_method_zh_hant text,
  listing_method_zh_hans text,
  name_en text,
  name_zh_hant text,
  name_zh_hans text,
  security_type text,
  currency_code text,
  sector_code text,
  industry_code text,
  sub_industry_code text,
  registrar_code text,
  offer_price_min numeric,
  offer_price_max numeric,
  final_offer_price numeric,
  board_lot integer check (board_lot is null or board_lot > 0),
  entry_fee text,
  par_value text,
  public_offer_shares numeric,
  placing_shares numeric,
  international_offer_shares numeric,
  preferential_offer_shares numeric,
  new_shares numeric,
  sale_shares numeric,
  over_allotment_shares numeric,
  total_offer_shares numeric,
  market_cap_text_en text,
  market_cap_text_zh_hant text,
  market_cap_text_zh_hans text,
  funds_raised_text_en text,
  funds_raised_text_zh_hant text,
  funds_raised_text_zh_hans text,
  net_proceeds_text_en text,
  net_proceeds_text_zh_hant text,
  net_proceeds_text_zh_hans text,
  one_lot_success_rate numeric,
  over_subscription_multiple numeric,
  clawback_type text check (clawback_type in ('A', 'B', 'NA', 'Unknown')),
  lockup_end_date date,
  eprospectus_url text,
  eipo_url text,
  contact jsonb not null default '{}'::jsonb,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hkex_code, listing_date, data_version)
);

create table if not exists core.ipo_narrative (
  ipo_narrative_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  section_key text not null check (
    section_key in (
      'business_overview',
      'future_plans',
      'use_of_proceeds',
      'risk_factors',
      'competitive_strengths',
      'sponsor_summary',
      'other'
    )
  ),
  lang text not null check (lang in ('en', 'zh_hant', 'zh_hans')),
  content_html text,
  content_text text,
  sanitizer_version text not null,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offering_id, section_key, lang, data_version)
);

create table if not exists core.ipo_timetable_event (
  ipo_timetable_event_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  event_code text not null,
  event_at timestamptz,
  event_date date,
  has_time boolean not null default false,
  event_type text not null default 'market_event',
  title_en text,
  title_zh_hant text,
  title_zh_hans text,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offering_id, event_code, event_date, data_version)
);

create table if not exists core.ipo_offer_statistic (
  ipo_offer_statistic_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  report_type text check (report_type in ('F', 'H', 'Unknown')),
  report_date date,
  metric_key text not null,
  value_en text,
  value_zh_hant text,
  value_zh_hans text,
  forward_looking boolean not null default false,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offering_id, report_type, metric_key, data_version)
);

create table if not exists core.ipo_cornerstone (
  ipo_cornerstone_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  investor_name_en text,
  investor_name_zh_hant text,
  investor_name_zh_hans text,
  invest_currency_code text,
  invest_amount numeric,
  max_subscribed_shares numeric,
  final_subscribed_shares numeric,
  offer_share_pct numeric,
  issued_share_pct numeric,
  lockup_period_text text,
  profile_en text,
  profile_zh_hant text,
  profile_zh_hans text,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.ipo_pool (
  ipo_pool_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  pool_code text not null check (pool_code in ('A', 'B', 'N', 'Unknown')),
  shares_before_reallocation numeric,
  shares_after_reallocation numeric,
  percentage_before_reallocation numeric,
  percentage_after_reallocation numeric,
  subscription_amount_en text,
  subscription_amount_zh_hant text,
  subscription_amount_zh_hans text,
  min_application_shares numeric,
  max_application_shares numeric,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offering_id, pool_code, data_version)
);

create table if not exists core.ipo_clawback_tier (
  ipo_clawback_tier_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  tier_number integer not null check (tier_number between 1 and 6),
  min_subscription_multiple numeric,
  max_subscription_multiple numeric,
  reallocated_shares numeric,
  shares_after_clawback_pct numeric,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offering_id, tier_number, data_version)
);

create table if not exists core.ipo_allotment_result (
  ipo_allotment_result_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  pool_code text check (pool_code in ('A', 'B', 'N', 'Unknown')),
  applied_shares numeric,
  valid_application_count integer check (valid_application_count is null or valid_application_count >= 0),
  minimum_allotted_lots numeric,
  allotment_percentage numeric,
  basis_en text,
  basis_zh_hant text,
  basis_zh_hans text,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.ipo_allotment_summary (
  offering_id text primary key references core.ipo_offering(offering_id),
  final_offer_price_text_en text,
  final_offer_price_text_zh_hant text,
  final_offer_price_text_zh_hans text,
  valid_application_count integer check (valid_application_count is null or valid_application_count >= 0),
  applied_shares numeric,
  applied_amount_text_en text,
  applied_amount_text_zh_hant text,
  applied_amount_text_zh_hans text,
  over_subscription_multiple numeric,
  one_lot_success_rate numeric,
  one_lot_guarantee text,
  maximum_application_text text,
  cornerstone_total_text text,
  result_url text,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.ipo_parties (
  ipo_party_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  seq integer not null check (seq >= 0),
  lang text not null check (lang in ('en', 'zh_hant', 'zh_hans')),
  title text,
  data text,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offering_id, seq, lang, data_version)
);

create table if not exists core.ipo_corporate_info (
  ipo_corporate_info_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  info_key text not null,
  lang text not null check (lang in ('en', 'zh_hant', 'zh_hans')),
  content_html text,
  content_text text,
  sanitizer_version text not null,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offering_id, info_key, lang, data_version)
);

create table if not exists core.ipo_lockup (
  ipo_lockup_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  share_type_code text,
  lockup_end_date_1 date,
  lockup_end_date_2 date,
  lockup_end_date_3 date,
  locked_shares_at_listing numeric,
  locked_shares_pct_at_listing numeric,
  remaining_locked_shares_pct numeric,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.ipo_application_share (
  ipo_application_share_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  pool_code text check (pool_code in ('A', 'B', 'N', 'Unknown')),
  applied_shares numeric,
  payable_amount numeric,
  application_note_en text,
  application_note_zh_hant text,
  application_note_zh_hans text,
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.ipo_pipeline_application (
  app_code text primary key,
  publish_date date,
  phip_date date,
  market text check (market in ('MAIN', 'GEM', 'Unknown')),
  pipeline_status text check (
    pipeline_status in ('A', 'L', 'R', 'W', 'U', 'Unknown')
  ),
  name_en text,
  name_zh_hant text,
  name_zh_hans text,
  sector_code text,
  industry_code text,
  sponsor_en text,
  sponsor_zh_hant text,
  sponsor_zh_hans text,
  business_overview_en text,
  business_overview_zh_hant text,
  business_overview_zh_hans text,
  list_code text,
  list_date date,
  offering_id text references core.ipo_offering(offering_id),
  source_record_id text not null,
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  methodology_version text not null,
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.ipo_research_signal (
  ipo_research_signal_id text primary key,
  offering_id text not null references core.ipo_offering(offering_id),
  methodology_version text not null,
  tier text check (tier in ('small', 'medium', 'large', 'unknown')),
  dims jsonb not null default '{}'::jsonb,
  signal text check (
    signal in ('strong_positive', 'positive', 'neutral', 'negative', 'strong_negative', 'unrated')
  ),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 100)),
  source text not null default 'aiphabee_research',
  source_record_id text not null,
  data_version text not null references core.data_version_batch(data_version),
  rights_policy_version text not null,
  quality_state text not null default 'HOLD' check (
    quality_state in ('PASS', 'WARN', 'HOLD', 'REJECT_RAW')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offering_id, methodology_version, data_version)
);

create table if not exists governance.ipo_contract (
  contract_key text primary key,
  contract_version text not null,
  status text not null check (status in ('local_contract', 'provisioned')),
  default_data_rights_status text not null check (default_data_rights_status = 'default_deny'),
  market_data_loaded boolean not null default false check (market_data_loaded = false),
  live_serving_reads boolean not null default false check (live_serving_reads = false),
  raw_snapshot_required boolean not null default true,
  data_version_release_required boolean not null default true,
  field_authorization_required boolean not null default true,
  export_allowed boolean not null default false,
  mcp_redistribution_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_code_table_name_code_idx
  on core.vendor_code(table_name, code);
create index if not exists ipo_offering_listing_date_idx
  on core.ipo_offering(listing_date);
create index if not exists ipo_offering_status_board_idx
  on core.ipo_offering(ipo_status, listing_board);
create index if not exists ipo_offering_sector_idx
  on core.ipo_offering(sector_code, industry_code);
create index if not exists ipo_narrative_offering_section_idx
  on core.ipo_narrative(offering_id, section_key, lang);
create index if not exists ipo_timetable_event_date_idx
  on core.ipo_timetable_event(event_date, event_code);
create index if not exists ipo_cornerstone_offering_idx
  on core.ipo_cornerstone(offering_id);
create index if not exists ipo_allotment_result_offering_pool_idx
  on core.ipo_allotment_result(offering_id, pool_code);
create index if not exists ipo_pipeline_application_status_idx
  on core.ipo_pipeline_application(pipeline_status, publish_date);

insert into governance.ipo_contract (
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
  'phase1.ipo_pipeline',
  '2026-06-24.phase1.ipo-pipeline-foundation.v0',
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

insert into core.serving_dataset (
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
  ('ipo_offering', 'ipo.offering', 'ipo_pipeline', 'HK IPO offering fact serving table.', 'HOLD', 'default_deny', 'ipo-rights-policy-scaffold-v0', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-dataset:offering'),
  ('ipo_narrative', 'ipo.narrative', 'ipo_pipeline', 'Sanitized multilingual IPO narrative sections.', 'HOLD', 'default_deny', 'ipo-rights-policy-scaffold-v0', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-dataset:narrative'),
  ('ipo_timetable_event', 'ipo.timetable_event', 'ipo_pipeline', 'IPO timetable events normalized for event timeline views.', 'HOLD', 'default_deny', 'ipo-rights-policy-scaffold-v0', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-dataset:timetable'),
  ('ipo_offer_statistic', 'ipo.offer_statistic', 'ipo_pipeline', 'Supplier display strings for offer statistics and forward-looking forecast facts.', 'HOLD', 'default_deny', 'ipo-rights-policy-scaffold-v0', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-dataset:offer-statistic'),
  ('ipo_cornerstone', 'ipo.cornerstone', 'ipo_pipeline', 'IPO cornerstone investor facts with default-deny sensitive amounts.', 'HOLD', 'default_deny', 'ipo-rights-policy-scaffold-v0', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-dataset:cornerstone'),
  ('ipo_allotment_result', 'ipo.allotment_result', 'ipo_pipeline', 'IPO application and allotment result facts.', 'HOLD', 'default_deny', 'ipo-rights-policy-scaffold-v0', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-dataset:allotment'),
  ('ipo_pipeline_application', 'ipo.pipeline_application', 'ipo_pipeline', 'Pre-listing A1/PHIP pipeline application facts.', 'HOLD', 'default_deny', 'ipo-rights-policy-scaffold-v0', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-dataset:pipeline')
on conflict (dataset) do update set
  domain = excluded.domain,
  description = excluded.description,
  default_quality_state = excluded.default_quality_state,
  default_rights_status = excluded.default_rights_status,
  rights_policy_version = excluded.rights_policy_version,
  methodology_version = excluded.methodology_version,
  source_record_id = excluded.source_record_id,
  updated_at = now();

insert into core.serving_field (
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
  ('ipo_offering.hkex_code', 'ipo_offering', 'hkex_code', 'HKEx Code / 股票代码', 'text', false, 'default_deny', 'HOLD', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-field:offering.hkex_code'),
  ('ipo_offering.listing_date', 'ipo_offering', 'listing_date', 'Listing Date / 上市日期', 'date', false, 'default_deny', 'HOLD', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-field:offering.listing_date'),
  ('ipo_offering.final_offer_price', 'ipo_offering', 'final_offer_price', 'Offer Price / 发售价', 'numeric', true, 'default_deny', 'HOLD', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-field:offering.final_offer_price'),
  ('ipo_offering.over_subscription_multiple', 'ipo_offering', 'over_subscription_multiple', 'Oversubscription / 超额认购', 'numeric', true, 'default_deny', 'HOLD', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-field:offering.over_subscription_multiple'),
  ('ipo_narrative.content_html', 'ipo_narrative', 'content_html', 'Sanitized Narrative HTML / 已清洗叙述', 'text', true, 'default_deny', 'HOLD', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-field:narrative.content_html'),
  ('ipo_timetable_event.event_date', 'ipo_timetable_event', 'event_date', 'Event Date / 事件日期', 'date', true, 'default_deny', 'HOLD', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-field:timetable.event_date'),
  ('ipo_offer_statistic.value_en', 'ipo_offer_statistic', 'value_en', 'Offer Statistic Display / 发售统计展示', 'text', true, 'blocked', 'HOLD', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-field:offer-statistic.value_en'),
  ('ipo_cornerstone.invest_amount', 'ipo_cornerstone', 'invest_amount', 'Cornerstone Amount / 基石金额', 'numeric', true, 'blocked', 'HOLD', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-field:cornerstone.invest_amount'),
  ('ipo_allotment_result.valid_application_count', 'ipo_allotment_result', 'valid_application_count', 'Valid Applications / 有效申请数', 'integer', true, 'blocked', 'HOLD', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-field:allotment.valid_application_count'),
  ('ipo_pipeline_application.business_overview_zh_hant', 'ipo_pipeline_application', 'business_overview_zh_hant', 'Pipeline Business Overview / 上市申请业务概览', 'text', true, 'blocked', 'HOLD', '2026-06-24.ipo-pipeline-foundation.v0', 'ipo-serving-field:pipeline.business_overview_zh_hant')
on conflict (serving_dataset_id, field_path, methodology_version) do update set
  display_name = excluded.display_name,
  data_type = excluded.data_type,
  nullable = excluded.nullable,
  rights_status = excluded.rights_status,
  quality_state = excluded.quality_state,
  source_record_id = excluded.source_record_id,
  updated_at = now();
