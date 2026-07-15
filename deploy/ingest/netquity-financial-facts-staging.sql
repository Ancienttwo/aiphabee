-- Staging-only Netquity FinReport promotion into the existing Serving Store.
-- Third promotion slice against the Netquity mirror, and the first one that
-- is NOT a projection of nq_basicdata.stock: this promotes non-bank (nb)
-- financial statement facts from nq_finreport.pla_nb (income statement),
-- nq_finreport.bal_nb (balance sheet) and nq_finreport.cf (cash flow, shared
-- across all filer types). Authority is pinned by
-- deploy/ingest/netquity-financial-facts-staging.contract.json.
-- This is an operational data promotion packet, not a production migration.
--
-- Scope decisions (see contract.json for the full rationale):
--   * Only statementtype='F' with coverperiod=12 (true full year -> "FY")
--     and statementtype='I' with coverperiod=6 (true half year -> "H1")
--     are promoted. FinancialFactRow.periodType is a closed "FY"|"H1" union;
--     stub periods from fiscal-year changes (coverperiod not in {12,6} for
--     F/I) and quarterly filings (Q1/Q3/Q4/Q5) and preliminary (P) have no
--     clean periodType mapping and are excluded, not mislabeled.
--   * Only 6 of the 7 FinancialFactMetric values are promoted:
--       revenue              <- nq_finreport.pla_nb.totalturnover
--       net_income           <- nq_finreport.pla_nb.net_prof
--       assets               <- nq_finreport.bal_nb.total_ass
--       liabilities          <- nq_finreport.bal_nb.liab_total
--       equity               <- nq_finreport.bal_nb.total_equity
--       operating_cash_flow  <- nq_finreport.cf.cf_ncf_operact
--     free_cash_flow is NOT promoted: there is no single rights-pinned
--     vendor column for it (it would require deriving cf_ncf_operact minus
--     a capex figure that lives in a different table), and this promotion
--     only projects columns 1:1, it does not compute derived metrics.
--   * pla_b/pla_i/bal_b/bal_i (bank/insurance statement schema) are never
--     read for values. nq_finreport.cf has no bank/insurance split (a single
--     shared table covers every filer type), so an instrument is scoped by
--     whether it has ANY qualifying pla_nb/bal_nb row, not by whether cf has
--     rows for it -- otherwise a bank would get an operating_cash_flow fact
--     with every other metric silently absent, which reads as "this bank
--     has no revenue" instead of "this promotion does not cover banks".
--     Instruments that only ever file under the bank/insurance schema get a
--     serving_record with an explicit coverage.status="unavailable" marker
--     and an empty facts array -- never a fabricated or partially-derived
--     fact.
--   * accountingStandard, companyId, restatementVersion and versionStatus
--     from the synthetic FinancialFactRow shape have no rights-pinned source
--     column anywhere in the mirrored Netquity schema (verified against
--     nq_finreport.{pla_nb,bal_nb,cf,sup,fr_nb} and nq_compinfo/nq_compprofile*).
--     The live row shape (packages/financial-facts LiveFinancialFactRow) omits
--     them entirely rather than populating them with an invented constant.

BEGIN;

DO $preflight$
DECLARE
  pla_nb_rows integer;
  bal_nb_rows integer;
  cf_rows integer;
  pla_b_rows integer;
  pla_i_rows integer;
  bal_b_rows integer;
  bal_i_rows integer;
  orphan_codes integer;
  nb_scope_codes integer;
  bank_insurance_only_codes integer;
  bi_nb_overlap integer;
  revenue_cells integer;
  net_income_cells integer;
  assets_cells integer;
  liabilities_cells integer;
  equity_cells integer;
  ocf_cells integer;
  null_currency_rows integer;
  null_announce_rows integer;
BEGIN
  SELECT count(*) INTO pla_nb_rows FROM nq_finreport.pla_nb;
  SELECT count(*) INTO bal_nb_rows FROM nq_finreport.bal_nb;
  SELECT count(*) INTO cf_rows FROM nq_finreport.cf;
  SELECT count(*) INTO pla_b_rows FROM nq_finreport.pla_b;
  SELECT count(*) INTO pla_i_rows FROM nq_finreport.pla_i;
  SELECT count(*) INTO bal_b_rows FROM nq_finreport.bal_b;
  SELECT count(*) INTO bal_i_rows FROM nq_finreport.bal_i;

  IF pla_nb_rows <> 29808
    OR bal_nb_rows <> 29808
    OR cf_rows <> 30553
    OR pla_b_rows <> 557
    OR pla_i_rows <> 188
    OR bal_b_rows <> 557
    OR bal_i_rows <> 188
  THEN
    RAISE EXCEPTION
      'Netquity FinReport preflight row-count mismatch: pla_nb=%, bal_nb=%, cf=%, pla_b=%, pla_i=%, bal_b=%, bal_i=%',
      pla_nb_rows, bal_nb_rows, cf_rows, pla_b_rows, pla_i_rows, bal_b_rows, bal_i_rows;
  END IF;

  -- Every finreport code (nb + bank/insurance) must already be a promoted
  -- security_master/security_profile instrument.
  SELECT count(*) INTO orphan_codes
  FROM (
    SELECT code FROM nq_finreport.pla_nb WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.bal_nb WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.cf WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.pla_b WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.pla_i WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.bal_b WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.bal_i WHERE statementtype IN ('F', 'I')
  ) all_codes
  WHERE code NOT IN (SELECT code FROM nq_basicdata.stock);

  IF orphan_codes <> 0 THEN
    RAISE EXCEPTION 'Netquity FinReport preflight found % code(s) with no promoted security_master instrument', orphan_codes;
  END IF;

  SELECT count(*) INTO nb_scope_codes
  FROM (
    SELECT code FROM nq_finreport.pla_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
    UNION
    SELECT code FROM nq_finreport.bal_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
  ) nb_scope;

  SELECT count(*) INTO bank_insurance_only_codes
  FROM (
    SELECT code FROM nq_finreport.pla_b WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.pla_i WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.bal_b WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.bal_i WHERE statementtype IN ('F', 'I')
  ) bi_codes
  WHERE code NOT IN (
    SELECT code FROM nq_finreport.pla_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
    UNION
    SELECT code FROM nq_finreport.bal_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
  )
  AND code IN (SELECT code FROM nq_basicdata.stock);

  SELECT count(*) INTO bi_nb_overlap
  FROM (
    SELECT code FROM nq_finreport.pla_b WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.pla_i WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.bal_b WHERE statementtype IN ('F', 'I')
    UNION SELECT code FROM nq_finreport.bal_i WHERE statementtype IN ('F', 'I')
  ) bi_codes
  WHERE code IN (
    SELECT code FROM nq_finreport.pla_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
    UNION
    SELECT code FROM nq_finreport.bal_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
  );

  IF nb_scope_codes <> 2723 OR bank_insurance_only_codes <> 54 OR bi_nb_overlap <> 0 THEN
    RAISE EXCEPTION
      'Netquity FinReport preflight entity-scope mismatch: nb_scope=%, bank_insurance_only=%, overlap=%',
      nb_scope_codes, bank_insurance_only_codes, bi_nb_overlap;
  END IF;

  SELECT
    count(*) FILTER (WHERE totalturnover IS NOT NULL),
    count(*) FILTER (WHERE net_prof IS NOT NULL)
  INTO revenue_cells, net_income_cells
  FROM nq_finreport.pla_nb
  WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6);

  SELECT
    count(*) FILTER (WHERE total_ass IS NOT NULL),
    count(*) FILTER (WHERE liab_total IS NOT NULL),
    count(*) FILTER (WHERE total_equity IS NOT NULL)
  INTO assets_cells, liabilities_cells, equity_cells
  FROM nq_finreport.bal_nb
  WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6);

  SELECT count(*) FILTER (WHERE cf_ncf_operact IS NOT NULL)
  INTO ocf_cells
  FROM nq_finreport.cf
  WHERE ((statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6))
    AND code IN (
      SELECT code FROM nq_finreport.pla_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
      UNION
      SELECT code FROM nq_finreport.bal_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
    );

  IF revenue_cells <> 26020
    OR net_income_cells <> 26020
    OR assets_cells <> 25674
    OR liabilities_cells <> 25674
    OR equity_cells <> 25674
    OR ocf_cells <> 25607
  THEN
    RAISE EXCEPTION
      'Netquity FinReport preflight fact-cell mismatch: revenue=%, net_income=%, assets=%, liabilities=%, equity=%, ocf=%',
      revenue_cells, net_income_cells, assets_cells, liabilities_cells, equity_cells, ocf_cells;
  END IF;

  SELECT
    (SELECT count(*) FROM nq_finreport.pla_nb WHERE ((statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)) AND currency IS NULL)
    + (SELECT count(*) FROM nq_finreport.bal_nb WHERE ((statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)) AND currency IS NULL)
    + (SELECT count(*) FROM nq_finreport.cf WHERE ((statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)) AND currency IS NULL)
  INTO null_currency_rows;

  SELECT
    (SELECT count(*) FROM nq_finreport.pla_nb WHERE ((statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)) AND announce_date IS NULL)
    + (SELECT count(*) FROM nq_finreport.bal_nb WHERE ((statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)) AND announce_date IS NULL)
    + (SELECT count(*) FROM nq_finreport.cf WHERE ((statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)) AND announce_date IS NULL)
  INTO null_announce_rows;

  IF null_currency_rows <> 0 OR null_announce_rows <> 0 THEN
    RAISE EXCEPTION
      'Netquity FinReport preflight found unexpected NULLs: null_currency=%, null_announce=%',
      null_currency_rows, null_announce_rows;
  END IF;
END
$preflight$;

-- New raw_source_batch: this promotion reads seven raw tables (the three
-- promoted nb tables plus the four bank/insurance tables read only to detect
-- coverage exclusion, never to copy a value). checksum_sha256 is sha256 over
-- the seven tables' full, unfiltered contents (COPY ... ORDER BY code,
-- yearend_date, statementtype), concatenated in this fixed order with a
-- "TABLE:nq_finreport.<name>" header line per table: bal_b, bal_i, bal_nb,
-- cf, pla_b, pla_i, pla_nb.
INSERT INTO aiphabee_core.raw_source_batch (
  source_batch_id,
  source_name,
  source_dataset,
  received_at,
  source_as_of,
  source_rights_status,
  checksum_sha256,
  row_count
)
VALUES (
  'src_netquity_finreport_nb_a8f571ad55d2',
  'Netquity',
  'FinReport.mdb:nq_finreport.{pla_nb,bal_nb,cf,pla_b,pla_i,bal_b,bal_i}',
  timestamptz '2026-07-15 00:00:00+08:00',
  timestamptz '2026-07-15 00:00:00+08:00',
  'approved',
  'a8f571ad55d2e7a75fa64938cc4bbb70dec95d2eed9e7a765c4f678ab7375fda',
  91659
)
ON CONFLICT (source_batch_id) DO NOTHING;

DO $source_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.raw_source_batch
    WHERE source_batch_id = 'src_netquity_finreport_nb_a8f571ad55d2'
      AND source_name = 'Netquity'
      AND source_dataset = 'FinReport.mdb:nq_finreport.{pla_nb,bal_nb,cf,pla_b,pla_i,bal_b,bal_i}'
      AND source_as_of = timestamptz '2026-07-15 00:00:00+08:00'
      AND source_rights_status = 'approved'
      AND checksum_sha256 = 'a8f571ad55d2e7a75fa64938cc4bbb70dec95d2eed9e7a765c4f678ab7375fda'
      AND row_count = 91659
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity FinReport source batch authority disagrees with existing state';
  END IF;
END
$source_authority$;

INSERT INTO aiphabee_core.data_version_batch (
  data_version,
  source_batch_id,
  methodology_version,
  rights_policy_version,
  quality_run_id,
  release_state
)
VALUES (
  'netquity-financial-facts-a8f571ad55d2.v1',
  'src_netquity_finreport_nb_a8f571ad55d2',
  '2026-07-15.netquity-financial-facts-promotion.v1',
  'netquity-collaboration-staging.v1',
  'netquity-financial-facts-a8f571ad55d2-quality-v1',
  'held'
)
ON CONFLICT (data_version) DO NOTHING;

DO $data_version_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch
    WHERE data_version = 'netquity-financial-facts-a8f571ad55d2.v1'
      AND source_batch_id = 'src_netquity_finreport_nb_a8f571ad55d2'
      AND methodology_version = '2026-07-15.netquity-financial-facts-promotion.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity financial_facts data version disagrees with existing state or was withdrawn';
  END IF;
END
$data_version_authority$;

-- domain stays 'financial_fact' (singular): aiphabee_core.serving_dataset_domain_check
-- already carries this exact value (added by
-- deploy/database/migrations/20260625002000_hkex_news_ingest_foundation.sql),
-- it is simply spelled differently from the dataset name 'financial_facts'
-- (plural, matching packages/financial-facts and the task's naming
-- instruction). This is a naming mismatch, not a domain substitution like
-- security_profile's reuse of 'security_master'.
INSERT INTO aiphabee_core.serving_dataset (
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
VALUES (
  'serving_dataset_financial_facts',
  'financial_facts',
  'financial_fact',
  'Released HKEX non-bank (nb) financial statement facts: revenue, net income, assets, liabilities, equity, operating cash flow (FY/H1 only)',
  'PASS',
  'approved',
  'netquity-collaboration-staging.v1',
  '2026-07-15.netquity-financial-facts-promotion.v1',
  'src_netquity_finreport_nb_a8f571ad55d2'
)
ON CONFLICT (serving_dataset_id) DO NOTHING;

DO $dataset_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_dataset
    WHERE serving_dataset_id = 'serving_dataset_financial_facts'
      AND dataset = 'financial_facts'
      AND domain = 'financial_fact'
      AND default_quality_state = 'PASS'
      AND default_rights_status = 'approved'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-15.netquity-financial-facts-promotion.v1'
  ) THEN
    RAISE EXCEPTION 'financial_facts Serving dataset authority disagrees with existing state';
  END IF;
END
$dataset_authority$;

INSERT INTO aiphabee_core.serving_field (
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
SELECT
  'financial_facts.' || field_path,
  'serving_dataset_financial_facts',
  field_path,
  display_name,
  data_type,
  nullable,
  'approved',
  'PASS',
  '2026-07-15.netquity-financial-facts-promotion.v1',
  'src_netquity_finreport_nb_a8f571ad55d2'
FROM (
  VALUES
    ('facts.revenue', 'Revenue fact array (nq_finreport.pla_nb.totalturnover)', 'json', true),
    ('facts.net_income', 'Net income fact array (nq_finreport.pla_nb.net_prof)', 'json', true),
    ('facts.assets', 'Total assets fact array (nq_finreport.bal_nb.total_ass)', 'json', true),
    ('facts.liabilities', 'Total liabilities fact array (nq_finreport.bal_nb.liab_total)', 'json', true),
    ('facts.equity', 'Total equity fact array (nq_finreport.bal_nb.total_equity)', 'json', true),
    ('facts.operating_cash_flow', 'Operating cash flow fact array (nq_finreport.cf.cf_ncf_operact)', 'json', true),
    ('coverage.status', 'Whether nb-schema facts are covered for this instrument', 'text', false),
    ('coverage.reason', 'Explanation when coverage.status is unavailable (bank/insurance schema)', 'text', true)
) AS field_contract(field_path, display_name, data_type, nullable)
ON CONFLICT (serving_field_id) DO NOTHING;

INSERT INTO aiphabee_core.serving_snapshot (
  serving_snapshot_id,
  serving_dataset_id,
  data_version,
  rights_policy_version,
  methodology_version,
  as_of,
  market_status,
  quality_state,
  row_count,
  release_state,
  source_record_id
)
VALUES (
  'serving_financial_facts_netquity_finreport_nb_a8f571ad55d2_v1',
  'serving_dataset_financial_facts',
  'netquity-financial-facts-a8f571ad55d2.v1',
  'netquity-collaboration-staging.v1',
  '2026-07-15.netquity-financial-facts-promotion.v1',
  timestamptz '2026-07-15 00:00:00+08:00',
  'not_applicable',
  'PASS',
  2777,
  'held',
  'src_netquity_finreport_nb_a8f571ad55d2'
)
ON CONFLICT (serving_snapshot_id) DO NOTHING;

DO $snapshot_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_snapshot
    WHERE serving_snapshot_id = 'serving_financial_facts_netquity_finreport_nb_a8f571ad55d2_v1'
      AND serving_dataset_id = 'serving_dataset_financial_facts'
      AND data_version = 'netquity-financial-facts-a8f571ad55d2.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-15.netquity-financial-facts-promotion.v1'
      AND as_of = timestamptz '2026-07-15 00:00:00+08:00'
      AND quality_state = 'PASS'
      AND row_count = 2777
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned financial_facts snapshot disagrees with existing state or was withdrawn';
  END IF;
END
$snapshot_authority$;

-- entity_id is deliberately identical in shape and value to the
-- security_master/security_profile promotions (hkex_security_<5-digit-code>):
-- the same instrument identity space.
WITH nb_scope AS (
  SELECT code FROM nq_finreport.pla_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
  UNION
  SELECT code FROM nq_finreport.bal_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
),
fact_rows AS (
  SELECT
    p.code,
    'revenue'::text AS metric_id,
    'income_statement'::text AS statement_type,
    p.yearend_date::date AS period_end,
    CASE WHEN p.statementtype = 'F' THEN 'FY' ELSE 'H1' END AS period_type,
    p.totalturnover AS value,
    p.currency,
    p.announce_date,
    p.statementtype,
    'pla_nb.totalturnover'::text AS vendor_field
  FROM nq_finreport.pla_nb p
  WHERE ((p.statementtype = 'F' AND p.coverperiod = 12) OR (p.statementtype = 'I' AND p.coverperiod = 6))
    AND p.code IN (SELECT code FROM nb_scope)
    AND p.totalturnover IS NOT NULL

  UNION ALL

  SELECT
    p.code,
    'net_income',
    'income_statement',
    p.yearend_date::date,
    CASE WHEN p.statementtype = 'F' THEN 'FY' ELSE 'H1' END,
    p.net_prof,
    p.currency,
    p.announce_date,
    p.statementtype,
    'pla_nb.net_prof'
  FROM nq_finreport.pla_nb p
  WHERE ((p.statementtype = 'F' AND p.coverperiod = 12) OR (p.statementtype = 'I' AND p.coverperiod = 6))
    AND p.code IN (SELECT code FROM nb_scope)
    AND p.net_prof IS NOT NULL

  UNION ALL

  SELECT
    b.code,
    'assets',
    'balance_sheet',
    b.yearend_date::date,
    CASE WHEN b.statementtype = 'F' THEN 'FY' ELSE 'H1' END,
    b.total_ass,
    b.currency,
    b.announce_date,
    b.statementtype,
    'bal_nb.total_ass'
  FROM nq_finreport.bal_nb b
  WHERE ((b.statementtype = 'F' AND b.coverperiod = 12) OR (b.statementtype = 'I' AND b.coverperiod = 6))
    AND b.code IN (SELECT code FROM nb_scope)
    AND b.total_ass IS NOT NULL

  UNION ALL

  SELECT
    b.code,
    'liabilities',
    'balance_sheet',
    b.yearend_date::date,
    CASE WHEN b.statementtype = 'F' THEN 'FY' ELSE 'H1' END,
    b.liab_total,
    b.currency,
    b.announce_date,
    b.statementtype,
    'bal_nb.liab_total'
  FROM nq_finreport.bal_nb b
  WHERE ((b.statementtype = 'F' AND b.coverperiod = 12) OR (b.statementtype = 'I' AND b.coverperiod = 6))
    AND b.code IN (SELECT code FROM nb_scope)
    AND b.liab_total IS NOT NULL

  UNION ALL

  SELECT
    b.code,
    'equity',
    'balance_sheet',
    b.yearend_date::date,
    CASE WHEN b.statementtype = 'F' THEN 'FY' ELSE 'H1' END,
    b.total_equity,
    b.currency,
    b.announce_date,
    b.statementtype,
    'bal_nb.total_equity'
  FROM nq_finreport.bal_nb b
  WHERE ((b.statementtype = 'F' AND b.coverperiod = 12) OR (b.statementtype = 'I' AND b.coverperiod = 6))
    AND b.code IN (SELECT code FROM nb_scope)
    AND b.total_equity IS NOT NULL

  UNION ALL

  SELECT
    c.code,
    'operating_cash_flow',
    'cash_flow',
    c.yearend_date::date,
    CASE WHEN c.statementtype = 'F' THEN 'FY' ELSE 'H1' END,
    c.cf_ncf_operact,
    c.currency,
    c.announce_date,
    c.statementtype,
    'cf.cf_ncf_operact'
  FROM nq_finreport.cf c
  WHERE ((c.statementtype = 'F' AND c.coverperiod = 12) OR (c.statementtype = 'I' AND c.coverperiod = 6))
    AND c.code IN (SELECT code FROM nb_scope)
    AND c.cf_ncf_operact IS NOT NULL
),
fact_objects AS (
  SELECT
    code,
    metric_id,
    period_end,
    jsonb_build_object(
      'metricId', metric_id,
      'statementType', statement_type,
      'statementId', 'netquity:finreport.stmt:' || lpad(code::text, 5, '0') || ':' || to_char(period_end, 'YYYY-MM-DD') || ':' || statementtype,
      'periodEnd', to_char(period_end, 'YYYY-MM-DD'),
      'periodType', period_type,
      'value', value,
      'currency', currency,
      'unit', 'unit',
      'scale', 1,
      'publishedAt', to_char(announce_date, 'YYYY-MM-DD"T"HH24:MI:SS') || '+08:00',
      'qualityState', 'PASS',
      'sourceRecordId', 'netquity:finreport.' || vendor_field || ':' || lpad(code::text, 5, '0') || ':' || to_char(period_end, 'YYYY-MM-DD') || ':' || statementtype
    ) AS fact_obj
  FROM fact_rows
),
fact_payload AS (
  SELECT
    code,
    jsonb_agg(fact_obj ORDER BY period_end DESC, metric_id ASC) AS facts,
    array_agg(DISTINCT ('facts.' || metric_id) ORDER BY ('facts.' || metric_id)) AS field_set
  FROM fact_objects
  GROUP BY code
)
INSERT INTO aiphabee_core.serving_record (
  serving_record_id,
  serving_snapshot_id,
  entity_type,
  entity_id,
  effective_from,
  effective_to,
  payload,
  field_set,
  quality_state,
  source_record_id
)
SELECT
  'serving_netquity_finreport_nb_a8f571ad55d2_facts_' || lpad(nb_scope.code::text, 5, '0'),
  'serving_financial_facts_netquity_finreport_nb_a8f571ad55d2_v1',
  'instrument',
  'hkex_security_' || lpad(nb_scope.code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'facts', coalesce(fp.facts, '[]'::jsonb),
    'coverage', jsonb_build_object('status', 'available')
  ),
  coalesce(fp.field_set, ARRAY[]::text[]),
  'PASS',
  'netquity:finreport.nb:' || lpad(nb_scope.code::text, 5, '0')
FROM nb_scope
LEFT JOIN fact_payload fp ON fp.code = nb_scope.code
ON CONFLICT (serving_record_id) DO NOTHING;

-- Bank/insurance-only instruments: known to file financials (present in
-- pla_b/pla_i/bal_b/bal_i), but under a schema this promotion does not
-- read values from. Recorded as an explicit, truthful coverage marker
-- (derived only from real EXISTS presence in those tables, never from a
-- synthesized or estimated financial value) rather than left absent, so a
-- caller sees "not covered by this promotion" instead of an
-- indistinguishable generic not_found.
WITH nb_scope AS (
  SELECT code FROM nq_finreport.pla_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
  UNION
  SELECT code FROM nq_finreport.bal_nb WHERE (statementtype = 'F' AND coverperiod = 12) OR (statementtype = 'I' AND coverperiod = 6)
),
bank_insurance_scope AS (
  SELECT code FROM nq_finreport.pla_b WHERE statementtype IN ('F', 'I')
  UNION SELECT code FROM nq_finreport.pla_i WHERE statementtype IN ('F', 'I')
  UNION SELECT code FROM nq_finreport.bal_b WHERE statementtype IN ('F', 'I')
  UNION SELECT code FROM nq_finreport.bal_i WHERE statementtype IN ('F', 'I')
),
unavailable_scope AS (
  SELECT bi.code
  FROM bank_insurance_scope bi
  WHERE bi.code NOT IN (SELECT code FROM nb_scope)
    AND bi.code IN (SELECT code FROM nq_basicdata.stock)
)
INSERT INTO aiphabee_core.serving_record (
  serving_record_id,
  serving_snapshot_id,
  entity_type,
  entity_id,
  effective_from,
  effective_to,
  payload,
  field_set,
  quality_state,
  source_record_id
)
SELECT
  'serving_netquity_finreport_nb_a8f571ad55d2_unavailable_' || lpad(code::text, 5, '0'),
  'serving_financial_facts_netquity_finreport_nb_a8f571ad55d2_v1',
  'instrument',
  'hkex_security_' || lpad(code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'facts', '[]'::jsonb,
    'coverage', jsonb_build_object(
      'status', 'unavailable',
      'reason', 'reports under the bank/insurance statement schema (pla_b/pla_i/bal_b/bal_i), which is not rights-pinned by this promotion'
    )
  ),
  ARRAY[]::text[],
  'PASS',
  'netquity:finreport.bank_insurance_excluded:' || lpad(code::text, 5, '0')
FROM unavailable_scope
ON CONFLICT (serving_record_id) DO NOTHING;

DO $serving_readback$
DECLARE
  record_rows integer;
  distinct_entities integer;
  malformed_rows integer;
  available_rows integer;
  unavailable_rows integer;
  total_fact_rows bigint;
BEGIN
  SELECT
    count(*)::integer,
    count(DISTINCT entity_id)::integer,
    count(*) FILTER (
      WHERE entity_type <> 'instrument'
         OR quality_state <> 'PASS'
         OR entity_id !~ '^hkex_security_[0-9]{5}$'
         OR (
              source_record_id !~ '^netquity:finreport[.]nb:[0-9]{5}$'
              AND source_record_id !~ '^netquity:finreport[.]bank_insurance_excluded:[0-9]{5}$'
            )
         OR jsonb_typeof(payload -> 'facts') <> 'array'
         OR jsonb_typeof(payload -> 'coverage') <> 'object'
         OR (payload -> 'coverage' ->> 'status') NOT IN ('available', 'unavailable')
         OR NOT (field_set <@ ARRAY['facts.revenue', 'facts.net_income', 'facts.assets', 'facts.liabilities', 'facts.equity', 'facts.operating_cash_flow']::text[])
         OR (
              (payload -> 'coverage' ->> 'status') = 'unavailable'
              AND (jsonb_array_length(payload -> 'facts') <> 0 OR (payload -> 'coverage' ->> 'reason') IS NULL)
            )
         OR (
              (payload -> 'coverage' ->> 'status') = 'available'
              AND jsonb_array_length(payload -> 'facts') = 0
            )
    )::integer,
    count(*) FILTER (WHERE (payload -> 'coverage' ->> 'status') = 'available')::integer,
    count(*) FILTER (WHERE (payload -> 'coverage' ->> 'status') = 'unavailable')::integer
  INTO
    record_rows,
    distinct_entities,
    malformed_rows,
    available_rows,
    unavailable_rows
  FROM aiphabee_core.serving_record
  WHERE serving_snapshot_id = 'serving_financial_facts_netquity_finreport_nb_a8f571ad55d2_v1';

  SELECT coalesce(sum(jsonb_array_length(payload -> 'facts')), 0)
  INTO total_fact_rows
  FROM aiphabee_core.serving_record
  WHERE serving_snapshot_id = 'serving_financial_facts_netquity_finreport_nb_a8f571ad55d2_v1';

  IF record_rows <> 2777
    OR distinct_entities <> 2777
    OR malformed_rows <> 0
    OR available_rows <> 2723
    OR unavailable_rows <> 54
    OR total_fact_rows <> 154669
  THEN
    RAISE EXCEPTION
      'Netquity financial_facts Serving readback mismatch: rows=%, entities=%, malformed=%, available=%, unavailable=%, total_facts=%',
      record_rows, distinct_entities, malformed_rows, available_rows, unavailable_rows, total_fact_rows;
  END IF;
END
$serving_readback$;

UPDATE aiphabee_core.data_version_batch
SET
  release_state = 'released',
  released_at = coalesce(released_at, now())
WHERE data_version = 'netquity-financial-facts-a8f571ad55d2.v1'
  AND release_state = 'held';

UPDATE aiphabee_core.serving_snapshot
SET
  release_state = 'released',
  updated_at = now()
WHERE serving_snapshot_id = 'serving_financial_facts_netquity_finreport_nb_a8f571ad55d2_v1'
  AND release_state = 'held';

DO $release_readback$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch version
    JOIN aiphabee_core.serving_snapshot snapshot
      ON snapshot.data_version = version.data_version
    WHERE version.data_version = 'netquity-financial-facts-a8f571ad55d2.v1'
      AND version.release_state = 'released'
      AND snapshot.serving_snapshot_id = 'serving_financial_facts_netquity_finreport_nb_a8f571ad55d2_v1'
      AND snapshot.release_state = 'released'
      AND snapshot.quality_state = 'PASS'
      AND snapshot.row_count = 2777
  ) THEN
    RAISE EXCEPTION 'Netquity financial_facts Serving release readback failed';
  END IF;
END
$release_readback$;

COMMIT;
