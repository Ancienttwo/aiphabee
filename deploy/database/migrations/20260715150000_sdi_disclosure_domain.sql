-- Extends aiphabee_core.serving_dataset's domain CHECK constraint with the
-- 'sdi_disclosure' value. Unlike the five prior Netquity live-promotion
-- slices (security_master, security_profile, financial_facts, quote_snapshot,
-- corporate_actions), whose domain values (security_master, financial_fact,
-- quote_snapshot, corporate_action) were already present in this constraint
-- as of 20260625002000_hkex_news_ingest_foundation.sql, SDI (disclosure of
-- interests) has no existing domain value anywhere in the schema: it is a
-- genuinely new Serving Store data domain, not a relabeling of an existing
-- one. This migration only extends the CHECK constraint's allowed value set
-- (drop constraint followed by add constraint with the extended list, the
-- same mechanism 20260624001000_ipo_pipeline_foundation.sql and
-- 20260625002000_hkex_news_ingest_foundation.sql each used to add
-- 'ipo_pipeline' and 'hkex_news' respectively); it creates no tables, grants
-- no access, loads no data, and does not alter the default_deny rights
-- posture (no governance/rights table is touched).

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
      'sdi_disclosure'
    )
  );
