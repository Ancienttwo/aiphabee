-- Staging-only Netquity SDI (disclosure of interests) promotion into the
-- existing Serving Store. Fifth promotion slice against the Netquity mirror
-- (sixth overall, after security_master, security_profile, financial_facts,
-- quote_snapshot, corporate_actions): promotes per-instrument substantial-
-- shareholder and director/chief-executive disclosure-of-interests filings
-- (SFO Part XV DI forms 1/2/3A) from nq_sdidata.sdi, joined on the same
-- entity universe as the prior BasicData-driven promotions (nq_basicdata.
-- stock, also read here only to define the full 18036-instrument entity
-- scope, not for any payload column; nq_sdidata.dataperiod is read only to
-- preflight-pin the mirrored extraction window, also not a payload source).
-- Authority is pinned by
-- deploy/ingest/netquity-sdi-disclosure-staging.contract.json. This is an
-- operational data promotion packet, not a production migration.
--
-- Scope decisions (see contract.json for the full rationale):
--   * SDI is a per-instrument *filing stream*, unlike corporate_actions'
--     four independently-shaped action types: every nq_sdidata.sdi row is
--     one filing (its own primary key is (formtype, formno)), and each
--     filing can independently report a change to up to three legally
--     distinct position categories on the same DI form -- Long Position,
--     Short Position, and Lending Pool (the vendor's own l_/s_/p_ column
--     prefixes) -- so the promoted shape nests a `positions` array inside
--     each `disclosures` array entry, rather than corporate_actions' flat
--     per-type array. Verified: every row carries a long-position block
--     (17514/17514); 5314 also carry short, 2079 also carry lending-pool,
--     and the four observed combinations (long-only=12096, long+short=3339,
--     long+short+pool=1975, long+pool=104) sum to exactly 17514.
--   * formType is promoted as the vendor's own raw code ('1', '2', or
--     '3A', the only three values present) verbatim, not translated into an
--     assumed "initial"/"change" English label: nq_sdidata carries no
--     decode table for these codes in the mirrored schema, and DI form
--     numbering (1/2/3A/etc.) is asserted here only as an opaque vendor
--     identifier, not as an interpreted business meaning.
--   * l_/s_/p_eventcode (68/32/0 distinct values respectively -- pool's is
--     never populated in this mirror) has no decode table anywhere in the
--     mirrored schema, the same undocumented-code risk corporate_actions
--     declined for nq_capitalraised.methodcode: promoting a translated
--     "increase"/"decrease"/"passive" nature-of-change category would
--     assert an interpretation of an undocumented numeric code. The raw
--     code is promoted verbatim as an opaque `eventCode` string (1:1
--     projection, matching how corporate_actions promotes split/
--     consolidation particulars text verbatim as `summary` rather than
--     deriving a structured ratio); no derived "kind"/"kindZh" nature-of-
--     change field is emitted anywhere in this payload.
--   * Threshold-crossing (e.g. "crosses above the 5% substantial-
--     shareholder disclosure line") is not promoted: no vendor column
--     encodes it, and deriving it would require applying an SFO
--     threshold-crossing rule engine to previousBalancePercent/
--     presentBalancePercent after the fact -- interpretation, not
--     1:1 projection, the same category of derivation corporate_actions
--     declined for split/consolidation ratios.
--   * l_/s_/p_onex_highprice, l_/s_/p_onex_avgprice (on-exchange dealing
--     price stats, ~35-37% populated) and l_/s_/p_offex_consshare/
--     l_/s_/p_offex_conscode (off-exchange consideration fields) are not
--     promoted this cut. offex_conscode is a 4-value undocumented code
--     (3101-3104, no decode table); offex_consshare's own populated values
--     (e.g. 84.0411 alongside an onex_avgprice of 84.0782 on the same row)
--     numerically resemble a per-share consideration price rather than a
--     literal share count despite its "consshare" name, an ambiguity this
--     promotion declines to resolve by guessing rather than reading a
--     vendor definition. Neither field is part of the sdi.jsx design
--     vocabulary this cut targets.
--   * No personal-data field beyond the substantial shareholder / director's
--     own legal name is promoted or exists in nq_sdidata.sdi: the full
--     column set (code, reportdate, transdate, formtype, formno, formno2/
--     formno2_a/formno2_s, chisubsharename/engsubsharename/simsubsharename,
--     sharetype, and the l_/s_/p_ position blocks) carries no address,
--     identity-document number, date of birth, or contact-detail column.
--     The holder name itself is the statutorily public SFO Part XV
--     disclosure this dataset exists to carry (the same public-monitoring-
--     data basis already used for company/director names in
--     security_profile), not incidental personal data.
--   * formno2 (always populated, the vendor's own eFiling reference number)
--     is promoted as `referenceNo`. formno2_a/formno2_s (populated 312 and
--     156 times respectively) are promoted as `amendsReferenceNo` /
--     `supersededByReferenceNo`: verified directly in the mirrored data
--     that these two columns form a consistent bidirectional cross-
--     reference (e.g. code 2643 formno2=DA20260407E00015 carries
--     formno2_s=DA20260407E00077, and the row whose own formno2 is
--     DA20260407E00077 carries formno2_a=DA20260407E00015 pointing back) --
--     an observed structural fact, not an invented interpretation.
--   * Entity scope is the full nq_basicdata.stock universe (18036 codes),
--     matching security_master/security_profile/quote_snapshot/
--     corporate_actions -- not just the 1215 codes that actually have a
--     filing. A substantial-shareholder/director disclosure is a rare,
--     transient event with no comparable "known but out of scope" bucket
--     (unlike financial_facts' bank/insurance schema carve-out): for the
--     16821 remaining instruments, "no filing in the mirrored window" is
--     the default state for the large majority of the market, not an
--     anomaly, so it is marked with an explicit coverage.status=
--     "unavailable" record (quote_snapshot/corporate_actions' idiom)
--     rather than an absent row.
--   * Within an "available" record, `disclosures` is an array of
--     independently shaped filing objects (financial_facts' `facts` array /
--     corporate_actions' `actions` array idiom); each disclosure's nested
--     `positions` array always carries at least one entry (every row has a
--     long-position block) and up to three (long/short/pool), each
--     independently optional beyond `positionType` and stripped via
--     jsonb_strip_nulls when the vendor row has no value for a given
--     position field, never backfilled.

BEGIN;

DO $preflight$
DECLARE
  basicdata_rows integer;
  dataperiod_rows integer;
  sdi_rows integer;
  dataperiod_startdate timestamp;
  dataperiod_enddate timestamp;
  missing_date_rows integer;
  orphan_codes integer;
  available_codes integer;
  unavailable_codes integer;
  formtype_1_rows integer;
  formtype_2_rows integer;
  formtype_3a_rows integer;
  unknown_formtype_rows integer;
  long_rows integer;
  short_rows integer;
  pool_rows integer;
  combo_long_only integer;
  combo_long_short integer;
  combo_long_short_pool integer;
  combo_long_pool integer;
BEGIN
  SELECT count(*) INTO basicdata_rows FROM nq_basicdata.stock;
  SELECT count(*) INTO dataperiod_rows FROM nq_sdidata.dataperiod;
  SELECT count(*) INTO sdi_rows FROM nq_sdidata.sdi;

  IF basicdata_rows <> 18036 OR dataperiod_rows <> 1 OR sdi_rows <> 17514 THEN
    RAISE EXCEPTION
      'Netquity sdi_disclosure preflight row-count mismatch: basicdata=%, dataperiod=%, sdi=%',
      basicdata_rows, dataperiod_rows, sdi_rows;
  END IF;

  SELECT startdate, enddate INTO dataperiod_startdate, dataperiod_enddate FROM nq_sdidata.dataperiod;
  IF dataperiod_startdate <> timestamp '2026-04-07 00:00:00'
    OR dataperiod_enddate <> timestamp '2026-07-07 00:00:00'
  THEN
    RAISE EXCEPTION
      'Netquity sdi_disclosure preflight dataperiod window mismatch: startdate=%, enddate=%',
      dataperiod_startdate, dataperiod_enddate;
  END IF;

  SELECT count(*) INTO missing_date_rows
  FROM nq_sdidata.sdi
  WHERE reportdate IS NULL OR transdate IS NULL;

  IF missing_date_rows <> 0 THEN
    RAISE EXCEPTION 'Netquity sdi_disclosure preflight found % row(s) with a missing reportdate/transdate', missing_date_rows;
  END IF;

  SELECT count(*) INTO orphan_codes
  FROM (SELECT DISTINCT code FROM nq_sdidata.sdi) sdi_codes
  WHERE sdi_codes.code NOT IN (SELECT code FROM nq_basicdata.stock);

  IF orphan_codes <> 0 THEN
    RAISE EXCEPTION 'Netquity sdi_disclosure preflight found % code(s) with no promoted security_master instrument', orphan_codes;
  END IF;

  SELECT count(DISTINCT code) INTO available_codes FROM nq_sdidata.sdi;
  SELECT basicdata_rows - available_codes INTO unavailable_codes;

  IF available_codes <> 1215 OR unavailable_codes <> 16821 THEN
    RAISE EXCEPTION
      'Netquity sdi_disclosure preflight entity-scope mismatch: available=%, unavailable=%',
      available_codes, unavailable_codes;
  END IF;

  SELECT
    count(*) FILTER (WHERE formtype = '1'),
    count(*) FILTER (WHERE formtype = '2'),
    count(*) FILTER (WHERE formtype = '3A'),
    count(*) FILTER (WHERE formtype NOT IN ('1', '2', '3A'))
  INTO formtype_1_rows, formtype_2_rows, formtype_3a_rows, unknown_formtype_rows
  FROM nq_sdidata.sdi;

  IF formtype_1_rows <> 1901 OR formtype_2_rows <> 9898 OR formtype_3a_rows <> 5715 OR unknown_formtype_rows <> 0 THEN
    RAISE EXCEPTION
      'Netquity sdi_disclosure preflight formtype mismatch: 1=%, 2=%, 3A=%, unknown=%',
      formtype_1_rows, formtype_2_rows, formtype_3a_rows, unknown_formtype_rows;
  END IF;

  SELECT
    count(*) FILTER (WHERE l_previousbalshare IS NOT NULL OR l_presentbalshare IS NOT NULL OR l_no_of_share IS NOT NULL),
    count(*) FILTER (WHERE s_previousbalshare IS NOT NULL OR s_presentbalshare IS NOT NULL OR s_no_of_share IS NOT NULL),
    count(*) FILTER (WHERE p_previousbalshare IS NOT NULL OR p_presentbalshare IS NOT NULL OR p_no_of_share IS NOT NULL)
  INTO long_rows, short_rows, pool_rows
  FROM nq_sdidata.sdi;

  IF long_rows <> 17514 OR short_rows <> 5314 OR pool_rows <> 2079 THEN
    RAISE EXCEPTION
      'Netquity sdi_disclosure preflight position-block mismatch: long=%, short=%, pool=%',
      long_rows, short_rows, pool_rows;
  END IF;

  SELECT
    count(*) FILTER (WHERE NOT has_short AND NOT has_pool),
    count(*) FILTER (WHERE has_short AND NOT has_pool),
    count(*) FILTER (WHERE has_short AND has_pool),
    count(*) FILTER (WHERE NOT has_short AND has_pool)
  INTO combo_long_only, combo_long_short, combo_long_short_pool, combo_long_pool
  FROM (
    SELECT
      (s_previousbalshare IS NOT NULL OR s_presentbalshare IS NOT NULL OR s_no_of_share IS NOT NULL) AS has_short,
      (p_previousbalshare IS NOT NULL OR p_presentbalshare IS NOT NULL OR p_no_of_share IS NOT NULL) AS has_pool
    FROM nq_sdidata.sdi
  ) combos;

  IF combo_long_only <> 12096 OR combo_long_short <> 3339 OR combo_long_short_pool <> 1975 OR combo_long_pool <> 104 THEN
    RAISE EXCEPTION
      'Netquity sdi_disclosure preflight position-combo mismatch: long_only=%, long_short=%, long_short_pool=%, long_pool=%',
      combo_long_only, combo_long_short, combo_long_short_pool, combo_long_pool;
  END IF;
END
$preflight$;

-- New raw_source_batch: this promotion reads three raw tables across two
-- different source .mdb files. checksum_sha256 is sha256 over the three
-- tables' full, unfiltered contents (COPY ... ORDER BY <pk> WITH (FORMAT
-- CSV)), concatenated in fixed alphabetical-by-schema order with a
-- "TABLE:<schema>.<table>" header line per table: nq_basicdata.stock,
-- nq_sdidata.dataperiod, nq_sdidata.sdi.
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
  'src_netquity_sdi_disclosure_cf0fbc789c41',
  'Netquity',
  'BasicData.mdb:nq_basicdata.stock,SDIData.mdb:nq_sdidata.{dataperiod,sdi}',
  timestamptz '2026-07-15 00:00:00+08:00',
  timestamptz '2026-07-15 00:00:00+08:00',
  'approved',
  'cf0fbc789c41631bc2271f1bdf527c3caf74769aec940b2af15ccb9533fc3ec3',
  35551
)
ON CONFLICT (source_batch_id) DO NOTHING;

DO $source_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.raw_source_batch
    WHERE source_batch_id = 'src_netquity_sdi_disclosure_cf0fbc789c41'
      AND source_name = 'Netquity'
      AND source_dataset = 'BasicData.mdb:nq_basicdata.stock,SDIData.mdb:nq_sdidata.{dataperiod,sdi}'
      AND source_as_of = timestamptz '2026-07-15 00:00:00+08:00'
      AND source_rights_status = 'approved'
      AND checksum_sha256 = 'cf0fbc789c41631bc2271f1bdf527c3caf74769aec940b2af15ccb9533fc3ec3'
      AND row_count = 35551
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity sdi_disclosure source batch authority disagrees with existing state';
  END IF;
END
$source_authority$;

-- rights_policy_version reuses 'netquity-collaboration-staging.v1'
-- (security_master/security_profile/financial_facts/corporate_actions), not
-- a new distinct value: SDI is fundamental-domain regulatory disclosure
-- data covered by the original Netquity collaboration rights determination,
-- unlike quote_snapshot's separately-confirmed market-data rights.
INSERT INTO aiphabee_core.data_version_batch (
  data_version,
  source_batch_id,
  methodology_version,
  rights_policy_version,
  quality_run_id,
  release_state
)
VALUES (
  'netquity-sdi-disclosure-cf0fbc789c41.v1',
  'src_netquity_sdi_disclosure_cf0fbc789c41',
  '2026-07-15.netquity-sdi-disclosure-promotion.v1',
  'netquity-collaboration-staging.v1',
  'netquity-sdi-disclosure-cf0fbc789c41-quality-v1',
  'held'
)
ON CONFLICT (data_version) DO NOTHING;

DO $data_version_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch
    WHERE data_version = 'netquity-sdi-disclosure-cf0fbc789c41.v1'
      AND source_batch_id = 'src_netquity_sdi_disclosure_cf0fbc789c41'
      AND methodology_version = '2026-07-15.netquity-sdi-disclosure-promotion.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity sdi_disclosure data version disagrees with existing state or was withdrawn';
  END IF;
END
$data_version_authority$;

-- domain 'sdi_disclosure' is a brand new value added to
-- aiphabee_core.serving_dataset_domain_check by
-- deploy/database/migrations/20260715150000_sdi_disclosure_domain.sql
-- (a staging_prerequisite_migration for this promotion): unlike the five
-- prior promotions, no existing domain value describes SDI.
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
  'serving_dataset_sdi_disclosure',
  'sdi_disclosure',
  'sdi_disclosure',
  'Released HKEX substantial-shareholder and director/chief-executive disclosure-of-interests filings (SFO Part XV DI forms 1/2/3A, nq_sdidata.sdi): per-filing long/short/lending-pool position changes',
  'PASS',
  'approved',
  'netquity-collaboration-staging.v1',
  '2026-07-15.netquity-sdi-disclosure-promotion.v1',
  'src_netquity_sdi_disclosure_cf0fbc789c41'
)
ON CONFLICT (serving_dataset_id) DO NOTHING;

DO $dataset_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_dataset
    WHERE serving_dataset_id = 'serving_dataset_sdi_disclosure'
      AND dataset = 'sdi_disclosure'
      AND domain = 'sdi_disclosure'
      AND default_quality_state = 'PASS'
      AND default_rights_status = 'approved'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-15.netquity-sdi-disclosure-promotion.v1'
  ) THEN
    RAISE EXCEPTION 'sdi_disclosure Serving dataset authority disagrees with existing state';
  END IF;
END
$dataset_authority$;

-- field_path granularity mirrors corporate_actions' 'actions.<type>' tags:
-- one field per positionType (long/short/pool), not one per attribute --
-- the natural gating axis for this dataset is "which position category",
-- the same way corporate_actions gates by actionType.
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
  'sdi_disclosure.' || field_path,
  'serving_dataset_sdi_disclosure',
  field_path,
  display_name,
  data_type,
  nullable,
  'approved',
  'PASS',
  '2026-07-15.netquity-sdi-disclosure-promotion.v1',
  'src_netquity_sdi_disclosure_cf0fbc789c41'
FROM (
  VALUES
    ('disclosures.long', 'Long-position disclosure filing entries (nq_sdidata.sdi long-position block)', 'json', true),
    ('disclosures.short', 'Short-position disclosure filing entries (nq_sdidata.sdi short-position block)', 'json', true),
    ('disclosures.pool', 'Lending-pool disclosure filing entries (nq_sdidata.sdi lending-pool block)', 'json', true),
    ('coverage.status', 'Whether any disclosure-of-interests filing is covered for this instrument', 'text', false),
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
  'serving_sdi_disclosure_netquity_cf0fbc789c41_v1',
  'serving_dataset_sdi_disclosure',
  'netquity-sdi-disclosure-cf0fbc789c41.v1',
  'netquity-collaboration-staging.v1',
  '2026-07-15.netquity-sdi-disclosure-promotion.v1',
  timestamptz '2026-07-15 00:00:00+08:00',
  'not_applicable',
  'PASS',
  18036,
  'held',
  'src_netquity_sdi_disclosure_cf0fbc789c41'
)
ON CONFLICT (serving_snapshot_id) DO NOTHING;

DO $snapshot_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_snapshot
    WHERE serving_snapshot_id = 'serving_sdi_disclosure_netquity_cf0fbc789c41_v1'
      AND serving_dataset_id = 'serving_dataset_sdi_disclosure'
      AND data_version = 'netquity-sdi-disclosure-cf0fbc789c41.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-15.netquity-sdi-disclosure-promotion.v1'
      AND as_of = timestamptz '2026-07-15 00:00:00+08:00'
      AND quality_state = 'PASS'
      AND row_count = 18036
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned sdi_disclosure snapshot disagrees with existing state or was withdrawn';
  END IF;
END
$snapshot_authority$;

-- Available block: every instrument with at least one SDI filing.
-- entity_id is deliberately identical in shape and value to the
-- security_master/security_profile/financial_facts/quote_snapshot/
-- corporate_actions promotions (hkex_security_<5-digit-code>).
WITH position_rows AS (
  SELECT
    code, formtype, formno,
    'long'::text AS position_type,
    l_eventcode AS event_code,
    l_no_of_share AS shares,
    l_transcurr AS currency,
    l_previousbalshare AS previous_balance_shares,
    l_previousbalper AS previous_balance_percent,
    l_presentbalshare AS present_balance_shares,
    l_presentbalper AS present_balance_percent
  FROM nq_sdidata.sdi
  WHERE l_previousbalshare IS NOT NULL OR l_presentbalshare IS NOT NULL OR l_no_of_share IS NOT NULL

  UNION ALL

  SELECT
    code, formtype, formno,
    'short',
    s_eventcode,
    s_no_of_share,
    s_transcurr,
    s_previousbalshare,
    s_previousbalper,
    s_presentbalshare,
    s_presentbalper
  FROM nq_sdidata.sdi
  WHERE s_previousbalshare IS NOT NULL OR s_presentbalshare IS NOT NULL OR s_no_of_share IS NOT NULL

  UNION ALL

  SELECT
    code, formtype, formno,
    'pool',
    p_eventcode,
    p_no_of_share,
    p_transcurr,
    p_previousbalshare,
    p_previousbalper,
    p_presentbalshare,
    p_presentbalper
  FROM nq_sdidata.sdi
  WHERE p_previousbalshare IS NOT NULL OR p_presentbalshare IS NOT NULL OR p_no_of_share IS NOT NULL
),
position_objects AS (
  SELECT
    code,
    formtype,
    formno,
    position_type,
    'disclosures.' || position_type AS field_tag,
    jsonb_build_object(
      'positionType', position_type,
      'eventCode', NULLIF(btrim(event_code), ''),
      'shares', shares,
      'currency', NULLIF(btrim(currency), ''),
      'previousBalanceShares', previous_balance_shares,
      'previousBalancePercent', previous_balance_percent,
      'presentBalanceShares', present_balance_shares,
      'presentBalancePercent', present_balance_percent
    ) AS position_obj
  FROM position_rows
),
position_payload AS (
  SELECT
    code,
    formtype,
    formno,
    jsonb_agg(position_obj ORDER BY array_position(ARRAY['long', 'short', 'pool'], position_type)) AS positions
  FROM position_objects
  GROUP BY code, formtype, formno
),
field_set_payload AS (
  SELECT
    code,
    array_agg(DISTINCT field_tag ORDER BY field_tag) AS field_set
  FROM position_objects
  GROUP BY code
),
disclosure_objects AS (
  SELECT
    s.code,
    s.reportdate::date AS report_date,
    'sdi_disclosure_' || lpad(s.code::text, 5, '0') || '_' || lower(s.formtype) || '_' || s.formno::bigint::text AS disclosure_id,
    jsonb_strip_nulls(
      jsonb_build_object(
        'disclosureId', 'sdi_disclosure_' || lpad(s.code::text, 5, '0') || '_' || lower(s.formtype) || '_' || s.formno::bigint::text,
        'formType', s.formtype,
        'referenceNo', s.formno2,
        'amendsReferenceNo', NULLIF(btrim(s.formno2_a), ''),
        'supersededByReferenceNo', NULLIF(btrim(s.formno2_s), ''),
        'reportDate', to_char(s.reportdate, 'YYYY-MM-DD'),
        'transactionDate', to_char(s.transdate, 'YYYY-MM-DD'),
        'holderName', jsonb_build_object(
          'en', s.engsubsharename,
          'zhHant', s.chisubsharename,
          'zhHans', s.simsubsharename
        ),
        'shareClass', s.sharetype,
        'sourceRecordId', 'netquity:sdidata.sdi:' || lpad(s.code::text, 5, '0') || ':' || s.formtype || ':' || s.formno::bigint::text,
        'positions', pp.positions
      )
    ) AS disclosure_obj
  FROM nq_sdidata.sdi s
  JOIN position_payload pp
    ON pp.code = s.code AND pp.formtype = s.formtype AND pp.formno = s.formno
),
disclosure_payload AS (
  SELECT
    code,
    jsonb_agg(disclosure_obj ORDER BY report_date DESC, disclosure_id ASC) AS disclosures
  FROM disclosure_objects
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
  'serving_netquity_sdi_disclosure_cf0fbc789c41_available_' || lpad(dp.code::text, 5, '0'),
  'serving_sdi_disclosure_netquity_cf0fbc789c41_v1',
  'instrument',
  'hkex_security_' || lpad(dp.code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'disclosures', dp.disclosures,
    'coverage', jsonb_build_object('status', 'available')
  ),
  fsp.field_set,
  'PASS',
  'netquity:sdi_disclosure.available:' || lpad(dp.code::text, 5, '0')
FROM disclosure_payload dp
JOIN field_set_payload fsp ON fsp.code = dp.code
ON CONFLICT (serving_record_id) DO NOTHING;

-- Unavailable block: every basicdata instrument with zero SDI filings
-- (16821 of 18036). The reason is a purely factual, non-alarming statement
-- -- "no filing found" is the normal state for the large majority of the
-- market at any given time, not an anomaly.
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
  'serving_netquity_sdi_disclosure_cf0fbc789c41_unavailable_' || lpad(s.code::text, 5, '0'),
  'serving_sdi_disclosure_netquity_cf0fbc789c41_v1',
  'instrument',
  'hkex_security_' || lpad(s.code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'disclosures', '[]'::jsonb,
    'coverage', jsonb_build_object(
      'status', 'unavailable',
      'reason', 'no substantial-shareholder or director/chief-executive disclosure-of-interests filing found in nq_sdidata.sdi for this instrument in the current mirrored snapshot'
    )
  ),
  ARRAY[]::text[],
  'PASS',
  'netquity:sdi_disclosure.unavailable:' || lpad(s.code::text, 5, '0')
FROM nq_basicdata.stock s
WHERE s.code NOT IN (SELECT DISTINCT code FROM nq_sdidata.sdi)
ON CONFLICT (serving_record_id) DO NOTHING;

DO $serving_readback$
DECLARE
  record_rows integer;
  distinct_entities integer;
  malformed_rows integer;
  available_rows integer;
  unavailable_rows integer;
  total_disclosure_rows bigint;
  total_position_rows bigint;
  long_position_rows bigint;
  short_position_rows bigint;
  pool_position_rows bigint;
BEGIN
  SELECT
    count(*)::integer,
    count(DISTINCT entity_id)::integer,
    count(*) FILTER (
      WHERE entity_type <> 'instrument'
         OR quality_state <> 'PASS'
         OR entity_id !~ '^hkex_security_[0-9]{5}$'
         OR (
              source_record_id !~ '^netquity:sdi_disclosure[.]available:[0-9]{5}$'
              AND source_record_id !~ '^netquity:sdi_disclosure[.]unavailable:[0-9]{5}$'
            )
         OR jsonb_typeof(payload -> 'disclosures') <> 'array'
         OR jsonb_typeof(payload -> 'coverage') <> 'object'
         OR (payload -> 'coverage' ->> 'status') NOT IN ('available', 'unavailable')
         OR NOT (field_set <@ ARRAY['disclosures.long', 'disclosures.pool', 'disclosures.short']::text[])
         OR (
              (payload -> 'coverage' ->> 'status') = 'unavailable'
              AND (jsonb_array_length(payload -> 'disclosures') <> 0 OR (payload -> 'coverage' ->> 'reason') IS NULL)
            )
         OR (
              (payload -> 'coverage' ->> 'status') = 'available'
              AND jsonb_array_length(payload -> 'disclosures') = 0
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
  WHERE serving_snapshot_id = 'serving_sdi_disclosure_netquity_cf0fbc789c41_v1';

  SELECT
    coalesce(sum(jsonb_array_length(payload -> 'disclosures')), 0),
    coalesce(sum((
      SELECT count(*)
      FROM jsonb_array_elements(payload -> 'disclosures') d, jsonb_array_elements(d -> 'positions') p
    )), 0),
    coalesce(sum((
      SELECT count(*)
      FROM jsonb_array_elements(payload -> 'disclosures') d, jsonb_array_elements(d -> 'positions') p
      WHERE p ->> 'positionType' = 'long'
    )), 0),
    coalesce(sum((
      SELECT count(*)
      FROM jsonb_array_elements(payload -> 'disclosures') d, jsonb_array_elements(d -> 'positions') p
      WHERE p ->> 'positionType' = 'short'
    )), 0),
    coalesce(sum((
      SELECT count(*)
      FROM jsonb_array_elements(payload -> 'disclosures') d, jsonb_array_elements(d -> 'positions') p
      WHERE p ->> 'positionType' = 'pool'
    )), 0)
  INTO total_disclosure_rows, total_position_rows, long_position_rows, short_position_rows, pool_position_rows
  FROM aiphabee_core.serving_record
  WHERE serving_snapshot_id = 'serving_sdi_disclosure_netquity_cf0fbc789c41_v1';

  IF record_rows <> 18036
    OR distinct_entities <> 18036
    OR malformed_rows <> 0
    OR available_rows <> 1215
    OR unavailable_rows <> 16821
    OR total_disclosure_rows <> 17514
    OR total_position_rows <> 24907
    OR long_position_rows <> 17514
    OR short_position_rows <> 5314
    OR pool_position_rows <> 2079
  THEN
    RAISE EXCEPTION
      'Netquity sdi_disclosure Serving readback mismatch: rows=%, entities=%, malformed=%, available=%, unavailable=%, total_disclosures=%, total_positions=%, long=%, short=%, pool=%',
      record_rows, distinct_entities, malformed_rows, available_rows, unavailable_rows, total_disclosure_rows, total_position_rows, long_position_rows, short_position_rows, pool_position_rows;
  END IF;
END
$serving_readback$;

UPDATE aiphabee_core.data_version_batch
SET
  release_state = 'released',
  released_at = coalesce(released_at, now())
WHERE data_version = 'netquity-sdi-disclosure-cf0fbc789c41.v1'
  AND release_state = 'held';

UPDATE aiphabee_core.serving_snapshot
SET
  release_state = 'released',
  updated_at = now()
WHERE serving_snapshot_id = 'serving_sdi_disclosure_netquity_cf0fbc789c41_v1'
  AND release_state = 'held';

DO $release_readback$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch version
    JOIN aiphabee_core.serving_snapshot snapshot
      ON snapshot.data_version = version.data_version
    WHERE version.data_version = 'netquity-sdi-disclosure-cf0fbc789c41.v1'
      AND version.release_state = 'released'
      AND snapshot.serving_snapshot_id = 'serving_sdi_disclosure_netquity_cf0fbc789c41_v1'
      AND snapshot.release_state = 'released'
      AND snapshot.quality_state = 'PASS'
      AND snapshot.row_count = 18036
  ) THEN
    RAISE EXCEPTION 'Netquity sdi_disclosure Serving release readback failed';
  END IF;
END
$release_readback$;

COMMIT;
