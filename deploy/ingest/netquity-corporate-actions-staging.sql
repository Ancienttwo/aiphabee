-- Staging-only Netquity corporate-actions promotion into the existing
-- Serving Store. Fourth promotion slice against the Netquity mirror
-- (fifth overall, after security_master, security_profile, financial_facts,
-- quote_snapshot): promotes per-instrument dividend, on-market buyback,
-- share-split and share-consolidation events from four raw tables --
-- nq_dividendinfo.dividendinfo, nq_sharebuyback.daily_data,
-- nq_corpact.stocksplit, nq_corpact.stockcons -- joined on the same entity
-- universe as the prior BasicData-driven promotions (nq_basicdata.stock,
-- also read here only to define the full 18036-instrument entity scope, not
-- for any payload column). Authority is pinned by
-- deploy/ingest/netquity-corporate-actions-staging.contract.json. This is an
-- operational data promotion packet, not a production migration.
--
-- Scope decisions (see contract.json for the full rationale):
--   * Only 4 of packages/corporate-actions's 6 CorporateActionToolType
--     values are promoted live: dividend, buyback, split, consolidation.
--     rights and placement have no source table named by this task's scope
--     and are not promoted this cut (no new CorporateActionType/
--     CorporateActionToolType value is invented either way).
--   * nq_dividendinfo.dividendinfo is a mixed corporate-event feed, not a
--     pure dividend table: its `catype` column also carries Share
--     Consolidation ('SC'), Share Subdivision ('SS'), Rights Issue ('RS'),
--     Other Distribution ('OD') and Bonus Share ('BS') rows alongside cash
--     dividends. Verified: the SC/SS rows that correspond to an event this
--     promotion already promotes are byte-identical duplicates (code,
--     announcedate, ratio-text) of the matching nq_corpact row -- 38 of 39
--     'SC' rows vs nq_corpact.stockcons and 3 of 4 'SS' rows vs
--     nq_corpact.stocksplit -- a secondary mirror of the two dedicated
--     tables this promotion already reads authoritatively, not a second
--     independent source. The remaining 1 SC (code 8021) and 1 SS (code
--     2477) row are announced-but-not-yet-effective: a NULL exdate and no
--     matching corpact row, dividend-feed-only, excluded below alongside
--     the other missing-exdate rows, not as duplicates. RS/OD/BS have
--     no dedicated corpact table and no clean CorporateActionType mapping
--     (a rights issue's own ratio+offer-price live only in the same
--     un-derivable free-text particulars format discussed below; bonus
--     share and "other distribution" have no existing enum counterpart at
--     all). Only catype values containing 'CD' (cash dividend) or 'SD'
--     (special dividend) are promoted from this table, each gated
--     independently on its own amount column being non-null: a `catype`
--     of literally 'CD' with dividend IS NULL means "No Dividend" was
--     announced for that period (678 of 1781 rows) -- an explicit
--     non-event, not a zero-amount dividend, and is excluded exactly like
--     financial_facts excludes non-qualifying statement rows.
--   * split/consolidation ratios (e.g. "8 - for - 1") exist only as
--     free-text inside particulareng/particularchi/particularsim -- neither
--     nq_corpact.stocksplit nor nq_corpact.stockcons has a numeric ratio
--     column. Parsing that text with a regex would derive a number the
--     vendor never gave this promotion in structured form, so `terms.ratio`
--     is not populated for split/consolidation; the vendor's own particulars
--     text is promoted verbatim as `summary` instead (1:1 projection, not
--     interpretation).
--   * nq_corpact.stockcons carries a termaction/termdate pair: 2 of 40 rows
--     have termaction='Y' with a real termdate, meaning the announced
--     consolidation was later terminated/cancelled and never took effect.
--     Those 2 rows (and any future termaction='Y' row in either corpact
--     table) are excluded, not promoted as a confirmed action.
--   * A further 3 nq_corpact.stockcons rows (announced 2015/2023/2025, all
--     termaction='N') and 4 nq_dividendinfo.dividendinfo rows (1 CD leg, 3
--     SD legs) have a NULL exdate with no other vendor-populated date to
--     substitute -- these are excluded too rather than backfilling a
--     synthesized effective date.
--   * nq_capitalraised.capitalraised is not promoted this cut:
--     methodcode ('RI', 'PL', 'SO', ...) has no decode table anywhere in
--     the mirrored schema. 'PL' superficially resembles the existing
--     CorporateActionToolType 'placement' value, but promoting only 'PL'
--     while leaving 'RI'/'SO'/etc. unlabeled would assert an interpretation
--     of an undocumented 2-character code -- the same category of risk
--     quote_snapshot's promotion explicitly declined for nq_unadjprice2.
--     daily.status.
--   * Entity scope is the full nq_basicdata.stock universe (18036 codes),
--     matching security_master/security_profile/quote_snapshot -- not just
--     the ~1055 codes that actually have a qualifying action. Unlike
--     financial_facts (whose Serving scope is only codes present in any
--     finreport table, because a report-schema exclusion needs its own
--     coverage marker distinct from true absence), a corporate action is a
--     rare, transient event with no comparable "known but out of scope"
--     bucket: for the ~16981 remaining real, listed instruments, "no
--     dividend/buyback/split/consolidation right now" is the default state
--     for nearly the whole market, not an anomaly, so it is marked with an
--     explicit coverage.status="unavailable" record (quote_snapshot's
--     idiom) rather than an absent row that would otherwise force the RPC
--     to answer a legitimate "nothing pending" instrument with the same
--     404 not_found used for "this instrument id does not exist".
--   * Within an "available" record, `actions` is an array of independently
--     shaped objects (financial_facts' `facts` array idiom, not
--     quote_snapshot's single nullable object): announcementDate/
--     effectiveDate are always present (rows missing either are excluded
--     above); exDate/paymentDate/summary/terms are independently optional
--     per action and stripped via jsonb_strip_nulls when the vendor row has
--     no value, never backfilled. `terms` itself is type-shaped: dividend
--     carries {cashAmount, currency}, buyback carries {buybackValue,
--     currency, shares}, split/consolidation carry no terms object at all.

BEGIN;

DO $preflight$
DECLARE
  basicdata_rows integer;
  stockcons_rows integer;
  stocksplit_rows integer;
  dividendinfo_rows integer;
  sharebuyback_rows integer;
  orphan_codes integer;
  cd_leg_rows integer;
  sd_leg_rows integer;
  buyback_rows integer;
  split_rows integer;
  cons_rows integer;
  available_codes integer;
  unavailable_codes integer;
BEGIN
  SELECT count(*) INTO basicdata_rows FROM nq_basicdata.stock;
  SELECT count(*) INTO stockcons_rows FROM nq_corpact.stockcons;
  SELECT count(*) INTO stocksplit_rows FROM nq_corpact.stocksplit;
  SELECT count(*) INTO dividendinfo_rows FROM nq_dividendinfo.dividendinfo;
  SELECT count(*) INTO sharebuyback_rows FROM nq_sharebuyback.daily_data;

  IF basicdata_rows <> 18036
    OR stockcons_rows <> 40
    OR stocksplit_rows <> 3
    OR dividendinfo_rows <> 1781
    OR sharebuyback_rows <> 528
  THEN
    RAISE EXCEPTION
      'Netquity corporate-actions preflight row-count mismatch: basicdata=%, stockcons=%, stocksplit=%, dividendinfo=%, sharebuyback=%',
      basicdata_rows, stockcons_rows, stocksplit_rows, dividendinfo_rows, sharebuyback_rows;
  END IF;

  -- Every code across the four action-source tables must already be a
  -- promoted security_master/security_profile instrument.
  SELECT count(*) INTO orphan_codes
  FROM (
    SELECT code FROM nq_dividendinfo.dividendinfo
    UNION SELECT code FROM nq_sharebuyback.daily_data
    UNION SELECT code FROM nq_corpact.stocksplit
    UNION SELECT code FROM nq_corpact.stockcons
  ) all_codes
  WHERE code NOT IN (SELECT code FROM nq_basicdata.stock);

  IF orphan_codes <> 0 THEN
    RAISE EXCEPTION 'Netquity corporate-actions preflight found % code(s) with no promoted security_master instrument', orphan_codes;
  END IF;

  SELECT count(*) INTO cd_leg_rows
  FROM nq_dividendinfo.dividendinfo
  WHERE catype LIKE '%CD%' AND dividend IS NOT NULL AND exdate IS NOT NULL;

  SELECT count(*) INTO sd_leg_rows
  FROM nq_dividendinfo.dividendinfo
  WHERE catype LIKE '%SD%' AND specialdividend IS NOT NULL AND exdate IS NOT NULL;

  SELECT count(*) INTO buyback_rows
  FROM nq_sharebuyback.daily_data
  WHERE rep_price_cur IS NOT NULL AND rep_totalpaid IS NOT NULL AND rep_quantity IS NOT NULL;

  SELECT count(*) INTO split_rows
  FROM nq_corpact.stocksplit
  WHERE termaction IS DISTINCT FROM 'Y' AND exdate IS NOT NULL;

  SELECT count(*) INTO cons_rows
  FROM nq_corpact.stockcons
  WHERE termaction IS DISTINCT FROM 'Y' AND exdate IS NOT NULL;

  IF cd_leg_rows <> 982
    OR sd_leg_rows <> 74
    OR buyback_rows <> 528
    OR split_rows <> 3
    OR cons_rows <> 35
  THEN
    RAISE EXCEPTION
      'Netquity corporate-actions preflight qualifying-row mismatch: cd_leg=%, sd_leg=%, buyback=%, split=%, cons=%',
      cd_leg_rows, sd_leg_rows, buyback_rows, split_rows, cons_rows;
  END IF;

  SELECT count(*) INTO available_codes
  FROM (
    SELECT code FROM nq_dividendinfo.dividendinfo WHERE catype LIKE '%CD%' AND dividend IS NOT NULL AND exdate IS NOT NULL
    UNION SELECT code FROM nq_dividendinfo.dividendinfo WHERE catype LIKE '%SD%' AND specialdividend IS NOT NULL AND exdate IS NOT NULL
    UNION SELECT code FROM nq_sharebuyback.daily_data
    UNION SELECT code FROM nq_corpact.stocksplit WHERE termaction IS DISTINCT FROM 'Y' AND exdate IS NOT NULL
    UNION SELECT code FROM nq_corpact.stockcons WHERE termaction IS DISTINCT FROM 'Y' AND exdate IS NOT NULL
  ) union_codes;

  SELECT basicdata_rows - available_codes INTO unavailable_codes;

  IF available_codes <> 1055 OR unavailable_codes <> 16981 THEN
    RAISE EXCEPTION
      'Netquity corporate-actions preflight entity-scope mismatch: available=%, unavailable=%',
      available_codes, unavailable_codes;
  END IF;
END
$preflight$;

-- New raw_source_batch: this promotion reads five raw tables across four
-- different source .mdb files. checksum_sha256 is sha256 over the five
-- tables' full, unfiltered contents (COPY ... ORDER BY code[, additional
-- columns] WITH (FORMAT CSV)), concatenated in fixed alphabetical-by-schema
-- order with a "TABLE:<schema>.<table>" header line per table:
-- nq_basicdata.stock, nq_corpact.stockcons, nq_corpact.stocksplit,
-- nq_dividendinfo.dividendinfo, nq_sharebuyback.daily_data.
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
  'src_netquity_corporate_actions_e543ecd86216',
  'Netquity',
  'BasicData.mdb:nq_basicdata.stock,CorpAct.mdb:nq_corpact.{stockcons,stocksplit},DividendInfo.mdb:nq_dividendinfo.dividendinfo,ShareBuyback.mdb:nq_sharebuyback.daily_data',
  timestamptz '2026-07-15 00:00:00+08:00',
  timestamptz '2026-07-15 00:00:00+08:00',
  'approved',
  'e543ecd862165cfb738b2a89f095da1519e37f0d7b2c2def3b6389d946d167b6',
  20388
)
ON CONFLICT (source_batch_id) DO NOTHING;

DO $source_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.raw_source_batch
    WHERE source_batch_id = 'src_netquity_corporate_actions_e543ecd86216'
      AND source_name = 'Netquity'
      AND source_dataset = 'BasicData.mdb:nq_basicdata.stock,CorpAct.mdb:nq_corpact.{stockcons,stocksplit},DividendInfo.mdb:nq_dividendinfo.dividendinfo,ShareBuyback.mdb:nq_sharebuyback.daily_data'
      AND source_as_of = timestamptz '2026-07-15 00:00:00+08:00'
      AND source_rights_status = 'approved'
      AND checksum_sha256 = 'e543ecd862165cfb738b2a89f095da1519e37f0d7b2c2def3b6389d946d167b6'
      AND row_count = 20388
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity corporate-actions source batch authority disagrees with existing state';
  END IF;
END
$source_authority$;

-- rights_policy_version reuses 'netquity-collaboration-staging.v1'
-- (security_master/security_profile/financial_facts), not a new distinct
-- value: corporate actions are fundamental-domain data covered by the
-- original Netquity collaboration rights determination, unlike
-- quote_snapshot's separately-confirmed market-data rights.
INSERT INTO aiphabee_core.data_version_batch (
  data_version,
  source_batch_id,
  methodology_version,
  rights_policy_version,
  quality_run_id,
  release_state
)
VALUES (
  'netquity-corporate-actions-e543ecd86216.v1',
  'src_netquity_corporate_actions_e543ecd86216',
  '2026-07-15.netquity-corporate-actions-promotion.v1',
  'netquity-collaboration-staging.v1',
  'netquity-corporate-actions-e543ecd86216-quality-v1',
  'held'
)
ON CONFLICT (data_version) DO NOTHING;

DO $data_version_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch
    WHERE data_version = 'netquity-corporate-actions-e543ecd86216.v1'
      AND source_batch_id = 'src_netquity_corporate_actions_e543ecd86216'
      AND methodology_version = '2026-07-15.netquity-corporate-actions-promotion.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity corporate_actions data version disagrees with existing state or was withdrawn';
  END IF;
END
$data_version_authority$;

-- domain stays 'corporate_action' (singular): aiphabee_core.
-- serving_dataset_domain_check already carries this exact value (added by
-- deploy/database/migrations/20260620091000_serving_store_scaffold.sql), it
-- is simply spelled differently from the dataset name 'corporate_actions'
-- (plural, matching packages/corporate-actions) -- the same naming mismatch
-- financial_facts/financial_fact already has, not a domain substitution.
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
  'serving_dataset_corporate_actions',
  'corporate_actions',
  'corporate_action',
  'Released HKEX per-instrument corporate actions: dividend (nq_dividendinfo.dividendinfo cash/special legs), on-market buyback (nq_sharebuyback.daily_data), share split (nq_corpact.stocksplit) and share consolidation (nq_corpact.stockcons)',
  'PASS',
  'approved',
  'netquity-collaboration-staging.v1',
  '2026-07-15.netquity-corporate-actions-promotion.v1',
  'src_netquity_corporate_actions_e543ecd86216'
)
ON CONFLICT (serving_dataset_id) DO NOTHING;

DO $dataset_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_dataset
    WHERE serving_dataset_id = 'serving_dataset_corporate_actions'
      AND dataset = 'corporate_actions'
      AND domain = 'corporate_action'
      AND default_quality_state = 'PASS'
      AND default_rights_status = 'approved'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-15.netquity-corporate-actions-promotion.v1'
  ) THEN
    RAISE EXCEPTION 'corporate_actions Serving dataset authority disagrees with existing state';
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
  'corporate_actions.' || field_path,
  'serving_dataset_corporate_actions',
  field_path,
  display_name,
  data_type,
  nullable,
  'approved',
  'PASS',
  '2026-07-15.netquity-corporate-actions-promotion.v1',
  'src_netquity_corporate_actions_e543ecd86216'
FROM (
  VALUES
    ('actions.dividend', 'Dividend action array entries (nq_dividendinfo.dividendinfo cash/special dividend legs)', 'json', true),
    ('actions.buyback', 'Buyback action array entries (nq_sharebuyback.daily_data)', 'json', true),
    ('actions.split', 'Split action array entries (nq_corpact.stocksplit)', 'json', true),
    ('actions.consolidation', 'Consolidation action array entries (nq_corpact.stockcons)', 'json', true),
    ('coverage.status', 'Whether any dividend/buyback/split/consolidation action is covered for this instrument', 'text', false),
    ('coverage.reason', 'Explanation when coverage.status is unavailable', 'text', true)
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
  'serving_corporate_actions_netquity_e543ecd86216_v1',
  'serving_dataset_corporate_actions',
  'netquity-corporate-actions-e543ecd86216.v1',
  'netquity-collaboration-staging.v1',
  '2026-07-15.netquity-corporate-actions-promotion.v1',
  timestamptz '2026-07-15 00:00:00+08:00',
  'not_applicable',
  'PASS',
  18036,
  'held',
  'src_netquity_corporate_actions_e543ecd86216'
)
ON CONFLICT (serving_snapshot_id) DO NOTHING;

DO $snapshot_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_snapshot
    WHERE serving_snapshot_id = 'serving_corporate_actions_netquity_e543ecd86216_v1'
      AND serving_dataset_id = 'serving_dataset_corporate_actions'
      AND data_version = 'netquity-corporate-actions-e543ecd86216.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-15.netquity-corporate-actions-promotion.v1'
      AND as_of = timestamptz '2026-07-15 00:00:00+08:00'
      AND quality_state = 'PASS'
      AND row_count = 18036
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned corporate_actions snapshot disagrees with existing state or was withdrawn';
  END IF;
END
$snapshot_authority$;

-- Available block: every instrument with at least one qualifying action
-- across the four source tables. entity_id is deliberately identical in
-- shape and value to the security_master/security_profile/financial_facts/
-- quote_snapshot promotions (hkex_security_<5-digit-code>).
WITH action_rows AS (
  -- Dividend, cash-dividend leg.
  SELECT
    d.code,
    'dividend'::text AS action_type,
    'corp_action_dividend_' || lpad(d.code::text, 5, '0') || '_' || d.eventid::text || '_cd' AS action_id,
    d.announcedate::date AS announcement_date,
    d.exdate::date AS effective_date,
    d.exdate::date AS ex_date,
    d.div_pay_date::date AS payment_date,
    'netquity:dividendinfo.dividendinfo:' || lpad(d.code::text, 5, '0') || ':' || d.eventid::text || ':cd' AS source_record_id,
    d.particulareng AS summary,
    d.dividend::numeric AS cash_amount,
    d.div_cur AS currency,
    NULL::numeric AS buyback_value,
    NULL::numeric AS shares
  FROM nq_dividendinfo.dividendinfo d
  WHERE d.catype LIKE '%CD%' AND d.dividend IS NOT NULL AND d.exdate IS NOT NULL

  UNION ALL

  -- Dividend, special-dividend leg (independent of the cash-dividend leg
  -- above: a single dividendinfo row with catype 'CD,SD' contributes both).
  SELECT
    d.code,
    'dividend',
    'corp_action_dividend_' || lpad(d.code::text, 5, '0') || '_' || d.eventid::text || '_sd',
    d.announcedate::date,
    d.exdate::date,
    d.exdate::date,
    d.div_pay_date::date,
    'netquity:dividendinfo.dividendinfo:' || lpad(d.code::text, 5, '0') || ':' || d.eventid::text || ':sd',
    d.particulareng,
    d.specialdividend::numeric,
    d.sp_div_cur,
    NULL::numeric,
    NULL::numeric
  FROM nq_dividendinfo.dividendinfo d
  WHERE d.catype LIKE '%SD%' AND d.specialdividend IS NOT NULL AND d.exdate IS NOT NULL

  UNION ALL

  -- On-market buyback: one row per disclosed buyback day. No vendor text
  -- field exists on this table, so summary is left absent rather than
  -- fabricated (never set to a synthesized description).
  SELECT
    b.code,
    'buyback',
    'corp_action_buyback_' || lpad(b.code::text, 5, '0') || '_' || to_char(b.sharebuybackdate, 'YYYYMMDD'),
    b.sharebuybackdate::date,
    b.sharebuybackdate::date,
    NULL::date,
    NULL::date,
    'netquity:sharebuyback.daily_data:' || lpad(b.code::text, 5, '0') || ':' || to_char(b.sharebuybackdate, 'YYYY-MM-DD'),
    NULL::text,
    NULL::numeric,
    b.rep_price_cur,
    b.rep_totalpaid::numeric,
    b.rep_quantity::numeric
  FROM nq_sharebuyback.daily_data b
  WHERE b.rep_price_cur IS NOT NULL AND b.rep_totalpaid IS NOT NULL AND b.rep_quantity IS NOT NULL

  UNION ALL

  -- Share split: no numeric ratio column exists (see header); the vendor's
  -- own particulars text is promoted verbatim as summary, terms is absent.
  SELECT
    s.code,
    'split',
    'corp_action_split_' || lpad(s.code::text, 5, '0') || '_' || to_char(s.announcedate, 'YYYYMMDD'),
    s.announcedate::date,
    s.exdate::date,
    s.exdate::date,
    NULL::date,
    'netquity:corpact.stocksplit:' || lpad(s.code::text, 5, '0') || ':' || to_char(s.announcedate, 'YYYY-MM-DD'),
    s.particulareng,
    NULL::numeric,
    NULL::text,
    NULL::numeric,
    NULL::numeric
  FROM nq_corpact.stocksplit s
  WHERE s.termaction IS DISTINCT FROM 'Y' AND s.exdate IS NOT NULL

  UNION ALL

  -- Share consolidation: same shape as split; termaction='Y' rows
  -- (2 of 40, a later-cancelled consolidation) are excluded above.
  SELECT
    c.code,
    'consolidation',
    'corp_action_consolidation_' || lpad(c.code::text, 5, '0') || '_' || to_char(c.announcedate, 'YYYYMMDD'),
    c.announcedate::date,
    c.exdate::date,
    c.exdate::date,
    NULL::date,
    'netquity:corpact.stockcons:' || lpad(c.code::text, 5, '0') || ':' || to_char(c.announcedate, 'YYYY-MM-DD'),
    c.particulareng,
    NULL::numeric,
    NULL::text,
    NULL::numeric,
    NULL::numeric
  FROM nq_corpact.stockcons c
  WHERE c.termaction IS DISTINCT FROM 'Y' AND c.exdate IS NOT NULL
),
action_objects AS (
  SELECT
    code,
    action_type,
    effective_date,
    action_id,
    'actions.' || action_type AS field_tag,
    jsonb_strip_nulls(
      jsonb_build_object(
        'actionId', action_id,
        'actionType', action_type,
        'announcementDate', to_char(announcement_date, 'YYYY-MM-DD'),
        'effectiveDate', to_char(effective_date, 'YYYY-MM-DD'),
        'exDate', CASE WHEN ex_date IS NULL THEN NULL ELSE to_char(ex_date, 'YYYY-MM-DD') END,
        'paymentDate', CASE WHEN payment_date IS NULL THEN NULL ELSE to_char(payment_date, 'YYYY-MM-DD') END,
        'sourceRecordId', source_record_id,
        'summary', summary,
        'terms', CASE action_type
          WHEN 'dividend' THEN jsonb_build_object('cashAmount', cash_amount, 'currency', currency)
          WHEN 'buyback' THEN jsonb_build_object('buybackValue', buyback_value, 'currency', currency, 'shares', shares)
          ELSE NULL
        END
      )
    ) AS action_obj
  FROM action_rows
),
action_payload AS (
  SELECT
    code,
    jsonb_agg(action_obj ORDER BY effective_date DESC, action_id ASC) AS actions,
    array_agg(DISTINCT field_tag ORDER BY field_tag) AS field_set
  FROM action_objects
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
  'serving_netquity_corporate_actions_e543ecd86216_available_' || lpad(ap.code::text, 5, '0'),
  'serving_corporate_actions_netquity_e543ecd86216_v1',
  'instrument',
  'hkex_security_' || lpad(ap.code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'actions', ap.actions,
    'coverage', jsonb_build_object('status', 'available')
  ),
  ap.field_set,
  'PASS',
  'netquity:corporate_actions.available:' || lpad(ap.code::text, 5, '0')
FROM action_payload ap
ON CONFLICT (serving_record_id) DO NOTHING;

-- Unavailable block: every basicdata instrument with zero qualifying
-- actions across the four source tables (16981 of 18036). The reason is a
-- purely factual, non-alarming statement -- "no action found" is the normal
-- state for nearly the whole market at any given time, not an anomaly.
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
  'serving_netquity_corporate_actions_e543ecd86216_unavailable_' || lpad(s.code::text, 5, '0'),
  'serving_corporate_actions_netquity_e543ecd86216_v1',
  'instrument',
  'hkex_security_' || lpad(s.code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'actions', '[]'::jsonb,
    'coverage', jsonb_build_object(
      'status', 'unavailable',
      'reason', 'no dividend, buyback, split, or consolidation event found in nq_dividendinfo/nq_sharebuyback/nq_corpact for this instrument in the current mirrored snapshot'
    )
  ),
  ARRAY[]::text[],
  'PASS',
  'netquity:corporate_actions.unavailable:' || lpad(s.code::text, 5, '0')
FROM nq_basicdata.stock s
WHERE s.code NOT IN (
  SELECT code FROM nq_dividendinfo.dividendinfo WHERE catype LIKE '%CD%' AND dividend IS NOT NULL AND exdate IS NOT NULL
  UNION SELECT code FROM nq_dividendinfo.dividendinfo WHERE catype LIKE '%SD%' AND specialdividend IS NOT NULL AND exdate IS NOT NULL
  UNION SELECT code FROM nq_sharebuyback.daily_data
  UNION SELECT code FROM nq_corpact.stocksplit WHERE termaction IS DISTINCT FROM 'Y' AND exdate IS NOT NULL
  UNION SELECT code FROM nq_corpact.stockcons WHERE termaction IS DISTINCT FROM 'Y' AND exdate IS NOT NULL
)
ON CONFLICT (serving_record_id) DO NOTHING;

DO $serving_readback$
DECLARE
  record_rows integer;
  distinct_entities integer;
  malformed_rows integer;
  available_rows integer;
  unavailable_rows integer;
  total_action_rows bigint;
  dividend_action_rows bigint;
  buyback_action_rows bigint;
  split_action_rows bigint;
  cons_action_rows bigint;
BEGIN
  SELECT
    count(*)::integer,
    count(DISTINCT entity_id)::integer,
    count(*) FILTER (
      WHERE entity_type <> 'instrument'
         OR quality_state <> 'PASS'
         OR entity_id !~ '^hkex_security_[0-9]{5}$'
         OR (
              source_record_id !~ '^netquity:corporate_actions[.]available:[0-9]{5}$'
              AND source_record_id !~ '^netquity:corporate_actions[.]unavailable:[0-9]{5}$'
            )
         OR jsonb_typeof(payload -> 'actions') <> 'array'
         OR jsonb_typeof(payload -> 'coverage') <> 'object'
         OR (payload -> 'coverage' ->> 'status') NOT IN ('available', 'unavailable')
         OR NOT (field_set <@ ARRAY['actions.dividend', 'actions.buyback', 'actions.split', 'actions.consolidation']::text[])
         OR (
              (payload -> 'coverage' ->> 'status') = 'unavailable'
              AND (jsonb_array_length(payload -> 'actions') <> 0 OR (payload -> 'coverage' ->> 'reason') IS NULL)
            )
         OR (
              (payload -> 'coverage' ->> 'status') = 'available'
              AND jsonb_array_length(payload -> 'actions') = 0
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
  WHERE serving_snapshot_id = 'serving_corporate_actions_netquity_e543ecd86216_v1';

  SELECT
    coalesce(sum(jsonb_array_length(payload -> 'actions')), 0),
    coalesce(sum((SELECT count(*) FROM jsonb_array_elements(payload -> 'actions') a WHERE a ->> 'actionType' = 'dividend')), 0),
    coalesce(sum((SELECT count(*) FROM jsonb_array_elements(payload -> 'actions') a WHERE a ->> 'actionType' = 'buyback')), 0),
    coalesce(sum((SELECT count(*) FROM jsonb_array_elements(payload -> 'actions') a WHERE a ->> 'actionType' = 'split')), 0),
    coalesce(sum((SELECT count(*) FROM jsonb_array_elements(payload -> 'actions') a WHERE a ->> 'actionType' = 'consolidation')), 0)
  INTO total_action_rows, dividend_action_rows, buyback_action_rows, split_action_rows, cons_action_rows
  FROM aiphabee_core.serving_record
  WHERE serving_snapshot_id = 'serving_corporate_actions_netquity_e543ecd86216_v1';

  IF record_rows <> 18036
    OR distinct_entities <> 18036
    OR malformed_rows <> 0
    OR available_rows <> 1055
    OR unavailable_rows <> 16981
    OR total_action_rows <> 1622
    OR dividend_action_rows <> 1056
    OR buyback_action_rows <> 528
    OR split_action_rows <> 3
    OR cons_action_rows <> 35
  THEN
    RAISE EXCEPTION
      'Netquity corporate_actions Serving readback mismatch: rows=%, entities=%, malformed=%, available=%, unavailable=%, total_actions=%, dividend=%, buyback=%, split=%, cons=%',
      record_rows, distinct_entities, malformed_rows, available_rows, unavailable_rows, total_action_rows, dividend_action_rows, buyback_action_rows, split_action_rows, cons_action_rows;
  END IF;
END
$serving_readback$;

UPDATE aiphabee_core.data_version_batch
SET
  release_state = 'released',
  released_at = coalesce(released_at, now())
WHERE data_version = 'netquity-corporate-actions-e543ecd86216.v1'
  AND release_state = 'held';

UPDATE aiphabee_core.serving_snapshot
SET
  release_state = 'released',
  updated_at = now()
WHERE serving_snapshot_id = 'serving_corporate_actions_netquity_e543ecd86216_v1'
  AND release_state = 'held';

DO $release_readback$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch version
    JOIN aiphabee_core.serving_snapshot snapshot
      ON snapshot.data_version = version.data_version
    WHERE version.data_version = 'netquity-corporate-actions-e543ecd86216.v1'
      AND version.release_state = 'released'
      AND snapshot.serving_snapshot_id = 'serving_corporate_actions_netquity_e543ecd86216_v1'
      AND snapshot.release_state = 'released'
      AND snapshot.quality_state = 'PASS'
      AND snapshot.row_count = 18036
  ) THEN
    RAISE EXCEPTION 'Netquity corporate_actions Serving release readback failed';
  END IF;
END
$release_readback$;

COMMIT;
