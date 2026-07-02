-- Production chart-parse evidence table for the parse_chart_image tool
-- (PRD parse-chart-image Module 4, Data Model v2).
--
-- image_ref stores an R2 object key string only; image bytes never enter
-- this table (main-agent pixel isolation is a hard constraint). The future
-- chart_images ownership/metadata table belongs to Module 5, so image_ref
-- stays a logical reference without a foreign key, mirroring the prior
-- eval_sample_results.sample_id decision. calibration_run_id references the
-- calibration used for routing; null means uncalibrated output that must go
-- through human confirmation (auto matching stays disabled).
--
-- rights posture: default_deny (engineering evidence only; market_data false)

create schema if not exists aiphabee_core;

create table if not exists aiphabee_core.chart_parse_results (
  id text primary key,
  tenant_id text not null,
  analysis_run_id text,
  image_ref text not null,
  result_json jsonb,
  schema_version text not null,
  prompt_version text not null,
  model_version text not null,
  calibration_run_id text,
  token_cost numeric,
  latency_ms numeric,
  status text not null check (
    status in ('ready', 'degraded', 'parse_failed')
  ),
  error_code text,
  created_at timestamptz not null default now()
);

create index if not exists chart_parse_results_tenant_created_idx
  on aiphabee_core.chart_parse_results (tenant_id, created_at);

create index if not exists chart_parse_results_versions_idx
  on aiphabee_core.chart_parse_results (schema_version, prompt_version, model_version);
