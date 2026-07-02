-- Chart-parse evaluation evidence and confidence calibration artifacts
-- (PRD parse-chart-image Module 3, Data Model v2).
--
-- Platform-engineering owned, tenant-agnostic evidence tables. Golden set
-- samples stay referenced by manifest sample id (tests/golden/chart-parse/
-- manifest.json); no golden_set_samples table yet by prior sprint decision,
-- so eval_sample_results.sample_id and calibration_runs.source_eval_run_id
-- are logical references without foreign keys (calibration may consume a
-- run artifact that was never persisted to the database).
--
-- rights posture: default_deny (engineering evidence only; market_data false)

create schema if not exists aiphabee_core;

create table if not exists aiphabee_core.eval_runs (
  id text primary key,
  golden_set_version text not null,
  schema_version text not null,
  prompt_version text not null,
  model_version text not null,
  metrics jsonb not null,
  status text not null default 'completed' check (
    status in ('running', 'completed', 'failed')
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_core.eval_sample_results (
  id text primary key,
  eval_run_id text not null references aiphabee_core.eval_runs(id),
  sample_id text not null,
  parse_json jsonb,
  field_accuracy jsonb,
  null_negative_pass boolean,
  error_code text,
  token_cost numeric,
  latency_ms numeric,
  created_at timestamptz not null default now(),
  unique (eval_run_id, sample_id)
);

create index if not exists eval_sample_results_eval_run_id_idx
  on aiphabee_core.eval_sample_results (eval_run_id);

create table if not exists aiphabee_core.calibration_runs (
  id text primary key,
  source_eval_run_id text not null,
  golden_set_version text not null,
  schema_version text not null,
  prompt_version text not null,
  model_version text not null,
  sample_count integer not null check (sample_count >= 0),
  mapping_fn_version text not null,
  thresholds jsonb,
  reliability jsonb not null,
  status text not null default 'draft' check (
    status in ('draft', 'ready', 'superseded')
  ),
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists calibration_runs_version_status_idx
  on aiphabee_core.calibration_runs (schema_version, prompt_version, model_version, status);
