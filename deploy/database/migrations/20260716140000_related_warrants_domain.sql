-- Extends aiphabee_core.serving_dataset's domain CHECK constraint with the
-- 'related_warrants' value. Like sdi_disclosure, directorate, and ownership
-- before it, related_warrants (per-underlying-instrument list of associated
-- derivative warrant / CBBC codes) has no existing domain value anywhere in
-- the schema: it is a genuinely new Serving Store data domain, not a
-- relabeling of an existing one. This migration only extends the CHECK
-- constraint's allowed value set (drop constraint followed by add constraint
-- with the extended list, the same mechanism
-- 20260624001000_ipo_pipeline_foundation.sql,
-- 20260625002000_hkex_news_ingest_foundation.sql,
-- 20260715150000_sdi_disclosure_domain.sql,
-- 20260716120000_directorate_domain.sql, and
-- 20260716130000_ownership_domain.sql each used to add 'ipo_pipeline',
-- 'hkex_news', 'sdi_disclosure', 'directorate', and 'ownership'
-- respectively); it creates no tables, grants no access, loads no data, and
-- does not alter the default_deny rights posture (no governance/rights table
-- is touched).

create schema if not exists aiphabee_core;

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
      'hkex_news',
      'sdi_disclosure',
      'directorate',
      'ownership',
      'related_warrants'
    )
  );
