-- Staging-only Netquity related-warrants (per-underlying-instrument list of
-- associated derivative warrant / CBBC codes) promotion into the existing
-- Serving Store. Eighth promotion slice against the Netquity mirror (ninth
-- overall, after security_master, security_profile, financial_facts,
-- quote_snapshot, corporate_actions, sdi_disclosure, directorate,
-- ownership): promotes, per underlying instrument, the list of warrant/CBBC
-- codes nq_basicdata.relatedcode associates with it, joined on the same
-- entity universe as the prior BasicData-driven promotions
-- (nq_basicdata.stock, read here both to define the full 18036-instrument
-- entity scope and to resolve each related warrant code's own display name,
-- not for any other payload column). Authority is pinned by
-- deploy/ingest/netquity-related-warrants-staging.contract.json. This is an
-- operational data promotion packet, not a production migration.
--
-- Scope decisions (see contract.json's excluded_from_this_cut/
-- payload_shape_choice for the full rationale; this header summarizes):
--   * Only nq_basicdata.relatedcode's 5 warrant-category columns are
--     promoted: comp_warrant (6 underlying rows / 6 links), dp_warrant (65 /
--     1045), dc_warrant (303 / 5916), cc_warrant (43 / 1247), ce_warrant (41
--     / 1425) -- 9639 total (underlying, warrant) links across 309 distinct
--     underlyings. il_warrant is verified 0/2836 populated (completely
--     unpopulated in the current mirror) and is excluded, with the preflight
--     below asserting it stays exactly 0. equity/equity_reason/
--     mcountercodelist/parallelcode/rightscode are different relation types
--     (related equity classes, multi-currency-counter siblings, parallel
--     listings, rights issues), not warrants, and are not read.
--   * Every one of the 9639 warrant codes resolves 1:1 against
--     nq_basicdata.stock (verified; 0 malformed, 0 unresolved), which
--     supplies each related warrant's own tri-lingual display name. 16 of
--     the 9639 links are legitimate multi-underlying "basket" warrants (the
--     same warrant code appearing under 2+ different underlyings) --
--     verified, not deduplicated across underlyings, since each underlying's
--     promotion is independent. 0 duplicate (underlying, warrant) pairs
--     exist within the promoted universe.
--   * nq_codetable.warrantissuer/warranttype2/underlyingcode (decode tables
--     for issuer/structure-type/underlying-asset) were checked and verified
--     to have no fact table anywhere in the current mirror that references
--     them via a foreign-key-shaped column -- no strike, expiry/maturity,
--     issuer code, warrant-type code, or underlying-code fact column exists
--     for warrant instruments in this mirror (nq_marketdata.stock, checked
--     specifically for this, carries only generic cross-instrument
--     valuation/technical fields). warrants[].category is therefore promoted
--     as its raw nq_basicdata.relatedcode column key
--     (comp_warrant|dp_warrant|dc_warrant|cc_warrant|ce_warrant), never
--     decoded into an invented call/put/bull/bear label -- the same "no fact
--     table -> promote raw, do not invent" discipline sdi_disclosure applied
--     to formType/eventCode, directorate to capacity, and ownership to
--     holderType/groupType/sourceType.
--   * warrants[] is a single uniform array (category as a per-entry
--     attribute), not 5 separate typed arrays: unlike corporate_actions'
--     genuinely different action sub-schemas, every related-warrant entry
--     shares the identical {instrumentId, category, name, sourceRecordId}
--     shape regardless of category -- see contract.json's
--     payload_shape_choice.
--   * The payload is built with jsonb_strip_nulls at the outer level: a
--     zero-coverage instrument carries only a coverage object, never a
--     fabricated empty warrants array.

BEGIN;

DO $preflight$
DECLARE
  basicdata_rows integer;
  relatedcode_rows integer;
  relatedcode_orphan_rows integer;
  comp_underlyings integer;
  dp_underlyings integer;
  dc_underlyings integer;
  cc_underlyings integer;
  ce_underlyings integer;
  il_underlyings integer;
  comp_links integer;
  dp_links integer;
  dc_links integer;
  cc_links integer;
  ce_links integer;
  total_links integer;
  malformed_link_rows integer;
  unresolved_link_rows integer;
  duplicate_underlying_warrant_pairs integer;
  distinct_warrant_codes integer;
  available_underlyings integer;
  unavailable_underlyings integer;
  missing_name_rows integer;
BEGIN
  SELECT count(*) INTO basicdata_rows FROM nq_basicdata.stock;
  SELECT count(*) INTO relatedcode_rows FROM nq_basicdata.relatedcode;

  IF basicdata_rows <> 18036 OR relatedcode_rows <> 2836 THEN
    RAISE EXCEPTION
      'Netquity related-warrants preflight row-count mismatch: basicdata=%, relatedcode=%',
      basicdata_rows, relatedcode_rows;
  END IF;

  SELECT count(*) INTO relatedcode_orphan_rows
  FROM nq_basicdata.relatedcode
  WHERE code NOT IN (SELECT code FROM nq_basicdata.stock);

  IF relatedcode_orphan_rows <> 0 THEN
    RAISE EXCEPTION
      'Netquity related-warrants preflight found % relatedcode row(s) whose underlying code is outside the current nq_basicdata.stock universe',
      relatedcode_orphan_rows;
  END IF;

  SELECT
    count(*) FILTER (WHERE comp_warrant IS NOT NULL AND btrim(comp_warrant) <> ''),
    count(*) FILTER (WHERE dp_warrant   IS NOT NULL AND btrim(dp_warrant)   <> ''),
    count(*) FILTER (WHERE dc_warrant   IS NOT NULL AND btrim(dc_warrant)   <> ''),
    count(*) FILTER (WHERE cc_warrant   IS NOT NULL AND btrim(cc_warrant)   <> ''),
    count(*) FILTER (WHERE ce_warrant   IS NOT NULL AND btrim(ce_warrant)   <> ''),
    count(*) FILTER (WHERE il_warrant   IS NOT NULL AND btrim(il_warrant)   <> '')
  INTO comp_underlyings, dp_underlyings, dc_underlyings, cc_underlyings, ce_underlyings, il_underlyings
  FROM nq_basicdata.relatedcode;

  IF comp_underlyings <> 6 OR dp_underlyings <> 65 OR dc_underlyings <> 303
    OR cc_underlyings <> 43 OR ce_underlyings <> 41 THEN
    RAISE EXCEPTION
      'Netquity related-warrants preflight per-category underlying-row mismatch: comp=%, dp=%, dc=%, cc=%, ce=%',
      comp_underlyings, dp_underlyings, dc_underlyings, cc_underlyings, ce_underlyings;
  END IF;

  IF il_underlyings <> 0 THEN
    RAISE EXCEPTION
      'Netquity related-warrants preflight expected il_warrant to remain unpopulated (0 rows) but found %; a mirror refresh started populating a category this promotion does not yet promote -- see contract.json excluded_from_this_cut.il_warrant_column',
      il_underlyings;
  END IF;

  SELECT count(*) INTO comp_links FROM (SELECT unnest(string_to_array(comp_warrant, ',')) FROM nq_basicdata.relatedcode WHERE comp_warrant IS NOT NULL AND btrim(comp_warrant) <> '') x;
  SELECT count(*) INTO dp_links   FROM (SELECT unnest(string_to_array(dp_warrant, ','))   FROM nq_basicdata.relatedcode WHERE dp_warrant   IS NOT NULL AND btrim(dp_warrant)   <> '') x;
  SELECT count(*) INTO dc_links   FROM (SELECT unnest(string_to_array(dc_warrant, ','))   FROM nq_basicdata.relatedcode WHERE dc_warrant   IS NOT NULL AND btrim(dc_warrant)   <> '') x;
  SELECT count(*) INTO cc_links   FROM (SELECT unnest(string_to_array(cc_warrant, ','))   FROM nq_basicdata.relatedcode WHERE cc_warrant   IS NOT NULL AND btrim(cc_warrant)   <> '') x;
  SELECT count(*) INTO ce_links   FROM (SELECT unnest(string_to_array(ce_warrant, ','))   FROM nq_basicdata.relatedcode WHERE ce_warrant   IS NOT NULL AND btrim(ce_warrant)   <> '') x;
  total_links := comp_links + dp_links + dc_links + cc_links + ce_links;

  IF comp_links <> 6 OR dp_links <> 1045 OR dc_links <> 5916 OR cc_links <> 1247 OR ce_links <> 1425 OR total_links <> 9639 THEN
    RAISE EXCEPTION
      'Netquity related-warrants preflight per-category link-count mismatch: comp=%, dp=%, dc=%, cc=%, ce=%, total=%',
      comp_links, dp_links, dc_links, cc_links, ce_links, total_links;
  END IF;

  WITH warrant_links AS (
    SELECT code AS underlying_code, unnest(string_to_array(comp_warrant, ',')) AS warrant_code_text FROM nq_basicdata.relatedcode WHERE comp_warrant IS NOT NULL AND btrim(comp_warrant) <> ''
    UNION ALL
    SELECT code, unnest(string_to_array(dp_warrant, ',')) FROM nq_basicdata.relatedcode WHERE dp_warrant IS NOT NULL AND btrim(dp_warrant) <> ''
    UNION ALL
    SELECT code, unnest(string_to_array(dc_warrant, ',')) FROM nq_basicdata.relatedcode WHERE dc_warrant IS NOT NULL AND btrim(dc_warrant) <> ''
    UNION ALL
    SELECT code, unnest(string_to_array(cc_warrant, ',')) FROM nq_basicdata.relatedcode WHERE cc_warrant IS NOT NULL AND btrim(cc_warrant) <> ''
    UNION ALL
    SELECT code, unnest(string_to_array(ce_warrant, ',')) FROM nq_basicdata.relatedcode WHERE ce_warrant IS NOT NULL AND btrim(ce_warrant) <> ''
  )
  SELECT
    count(*) FILTER (WHERE warrant_code_text !~ '^[0-9]+$'),
    count(*) FILTER (WHERE warrant_code_text ~ '^[0-9]+$' AND warrant_code_text::integer NOT IN (SELECT code FROM nq_basicdata.stock)),
    count(*) - count(DISTINCT (underlying_code, warrant_code_text)),
    count(DISTINCT warrant_code_text)
  INTO malformed_link_rows, unresolved_link_rows, duplicate_underlying_warrant_pairs, distinct_warrant_codes
  FROM warrant_links;

  IF malformed_link_rows <> 0 THEN
    RAISE EXCEPTION 'Netquity related-warrants preflight found % non-numeric warrant code token(s)', malformed_link_rows;
  END IF;

  IF unresolved_link_rows <> 0 THEN
    RAISE EXCEPTION 'Netquity related-warrants preflight found % warrant code(s) that do not resolve against nq_basicdata.stock', unresolved_link_rows;
  END IF;

  IF duplicate_underlying_warrant_pairs <> 0 THEN
    RAISE EXCEPTION 'Netquity related-warrants preflight found % duplicate (underlying, warrant) pair(s) across categories', duplicate_underlying_warrant_pairs;
  END IF;

  IF distinct_warrant_codes <> 9623 THEN
    RAISE EXCEPTION 'Netquity related-warrants preflight distinct warrant-code mismatch: got % (expected 9623; 16 legitimate multi-underlying basket warrants account for 9639-9623)', distinct_warrant_codes;
  END IF;

  SELECT count(*) INTO available_underlyings
  FROM nq_basicdata.relatedcode
  WHERE (comp_warrant IS NOT NULL AND btrim(comp_warrant) <> '')
     OR (dp_warrant   IS NOT NULL AND btrim(dp_warrant)   <> '')
     OR (dc_warrant   IS NOT NULL AND btrim(dc_warrant)   <> '')
     OR (cc_warrant   IS NOT NULL AND btrim(cc_warrant)   <> '')
     OR (ce_warrant   IS NOT NULL AND btrim(ce_warrant)   <> '');
  unavailable_underlyings := basicdata_rows - available_underlyings;

  IF available_underlyings <> 309 OR unavailable_underlyings <> 17727 THEN
    RAISE EXCEPTION
      'Netquity related-warrants preflight entity-scope mismatch: available=%, unavailable=%',
      available_underlyings, unavailable_underlyings;
  END IF;

  WITH warrant_links AS (
    SELECT unnest(string_to_array(comp_warrant, ','))::integer AS warrant_code FROM nq_basicdata.relatedcode WHERE comp_warrant IS NOT NULL AND btrim(comp_warrant) <> ''
    UNION ALL
    SELECT unnest(string_to_array(dp_warrant, ','))::integer FROM nq_basicdata.relatedcode WHERE dp_warrant IS NOT NULL AND btrim(dp_warrant) <> ''
    UNION ALL
    SELECT unnest(string_to_array(dc_warrant, ','))::integer FROM nq_basicdata.relatedcode WHERE dc_warrant IS NOT NULL AND btrim(dc_warrant) <> ''
    UNION ALL
    SELECT unnest(string_to_array(cc_warrant, ','))::integer FROM nq_basicdata.relatedcode WHERE cc_warrant IS NOT NULL AND btrim(cc_warrant) <> ''
    UNION ALL
    SELECT unnest(string_to_array(ce_warrant, ','))::integer FROM nq_basicdata.relatedcode WHERE ce_warrant IS NOT NULL AND btrim(ce_warrant) <> ''
  )
  SELECT count(*) INTO missing_name_rows
  FROM warrant_links wl
  JOIN nq_basicdata.stock s ON s.code = wl.warrant_code
  WHERE s.chiname IS NULL OR btrim(s.chiname) = ''
     OR s.engname IS NULL OR btrim(s.engname) = ''
     OR s.simname IS NULL OR btrim(s.simname) = '';

  IF missing_name_rows <> 0 THEN
    RAISE EXCEPTION 'Netquity related-warrants preflight found % related-warrant row(s) with an incomplete tri-lingual name on nq_basicdata.stock', missing_name_rows;
  END IF;
END
$preflight$;

-- New raw_source_batch: this promotion reads two raw tables. checksum_sha256
-- is sha256 over the two tables' full, unfiltered contents (COPY ... ORDER
-- BY <pk-or-natural-key> WITH (FORMAT CSV)), concatenated in fixed
-- alphabetical-by-schema-then-table order with a "TABLE:<schema>.<table>"
-- header line per table: nq_basicdata.relatedcode (ORDER BY code),
-- nq_basicdata.stock (ORDER BY code).
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
  'src_netquity_related_warrants_6f4019928e9b',
  'Netquity',
  'BasicData.mdb:nq_basicdata.relatedcode,BasicData.mdb:nq_basicdata.stock',
  timestamptz '2026-07-16 00:00:00+08:00',
  timestamptz '2026-07-16 00:00:00+08:00',
  'approved',
  '6f4019928e9b0f4db6dc30ea0a9a4f352750c4898f7970c441ad660235716027',
  20872
)
ON CONFLICT (source_batch_id) DO NOTHING;

DO $source_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.raw_source_batch
    WHERE source_batch_id = 'src_netquity_related_warrants_6f4019928e9b'
      AND source_name = 'Netquity'
      AND source_dataset = 'BasicData.mdb:nq_basicdata.relatedcode,BasicData.mdb:nq_basicdata.stock'
      AND source_as_of = timestamptz '2026-07-16 00:00:00+08:00'
      AND source_rights_status = 'approved'
      AND checksum_sha256 = '6f4019928e9b0f4db6dc30ea0a9a4f352750c4898f7970c441ad660235716027'
      AND row_count = 20872
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity related-warrants source batch authority disagrees with existing state';
  END IF;
END
$source_authority$;

-- rights_policy_version reuses 'netquity-collaboration-staging.v1'
-- (security_master/security_profile/financial_facts/corporate_actions/
-- sdi_disclosure/directorate/ownership), not a new distinct value:
-- related_warrants is reference/structural regulatory-filing-adjacent data
-- (which warrant codes are linked to which underlying), not market data,
-- and is covered by the original Netquity collaboration rights approval.
INSERT INTO aiphabee_core.data_version_batch (
  data_version,
  source_batch_id,
  methodology_version,
  rights_policy_version,
  quality_run_id,
  release_state
)
VALUES (
  'netquity-related-warrants-6f4019928e9b.v1',
  'src_netquity_related_warrants_6f4019928e9b',
  '2026-07-16.netquity-related-warrants-promotion.v1',
  'netquity-collaboration-staging.v1',
  'netquity-related-warrants-6f4019928e9b-quality-v1',
  'held'
)
ON CONFLICT (data_version) DO NOTHING;

DO $data_version_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch
    WHERE data_version = 'netquity-related-warrants-6f4019928e9b.v1'
      AND source_batch_id = 'src_netquity_related_warrants_6f4019928e9b'
      AND methodology_version = '2026-07-16.netquity-related-warrants-promotion.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity related-warrants data version disagrees with existing state or was withdrawn';
  END IF;
END
$data_version_authority$;

-- domain 'related_warrants' is a brand new value added to
-- aiphabee_core.serving_dataset_domain_check by
-- deploy/database/migrations/20260716140000_related_warrants_domain.sql (a
-- staging_prerequisite_migration for this promotion): like sdi_disclosure,
-- directorate, and ownership, no existing domain value describes related
-- warrants.
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
  'serving_dataset_related_warrants',
  'related_warrants',
  'related_warrants',
  'Released HKEX per-instrument related-warrant links: derivative warrant / CBBC codes associated with an underlying instrument (nq_basicdata.relatedcode), each resolved to its own instrument id and display name (nq_basicdata.stock)',
  'PASS',
  'approved',
  'netquity-collaboration-staging.v1',
  '2026-07-16.netquity-related-warrants-promotion.v1',
  'src_netquity_related_warrants_6f4019928e9b'
)
ON CONFLICT (serving_dataset_id) DO NOTHING;

DO $dataset_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_dataset
    WHERE serving_dataset_id = 'serving_dataset_related_warrants'
      AND dataset = 'related_warrants'
      AND domain = 'related_warrants'
      AND default_quality_state = 'PASS'
      AND default_rights_status = 'approved'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-16.netquity-related-warrants-promotion.v1'
  ) THEN
    RAISE EXCEPTION 'related_warrants Serving dataset authority disagrees with existing state';
  END IF;
END
$dataset_authority$;

-- field_path granularity: 1 top-level bucket (warrants), independently
-- optional per instrument, plus coverage.status (always present) and
-- coverage.reason (present only when unavailable) -- see contract.json's
-- payload_shape_choice for why category is a per-entry attribute inside
-- warrants[] rather than a separate field_path per category.
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
  'related_warrants.' || field_path,
  'serving_dataset_related_warrants',
  field_path,
  display_name,
  data_type,
  nullable,
  'approved',
  'PASS',
  '2026-07-16.netquity-related-warrants-promotion.v1',
  'src_netquity_related_warrants_6f4019928e9b'
FROM (
  VALUES
    ('warrants', 'Related derivative warrant / CBBC codes for this underlying instrument: instrument id, raw relatedcode category, and display name per entry (nq_basicdata.relatedcode joined to nq_basicdata.stock)', 'json', true),
    ('coverage.status', 'Whether any related-warrant link is covered for this instrument', 'text', false),
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
  'serving_related_warrants_netquity_6f4019928e9b_v1',
  'serving_dataset_related_warrants',
  'netquity-related-warrants-6f4019928e9b.v1',
  'netquity-collaboration-staging.v1',
  '2026-07-16.netquity-related-warrants-promotion.v1',
  timestamptz '2026-07-16 00:00:00+08:00',
  'not_applicable',
  'PASS',
  18036,
  'held',
  'src_netquity_related_warrants_6f4019928e9b'
)
ON CONFLICT (serving_snapshot_id) DO NOTHING;

DO $snapshot_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_snapshot
    WHERE serving_snapshot_id = 'serving_related_warrants_netquity_6f4019928e9b_v1'
      AND serving_dataset_id = 'serving_dataset_related_warrants'
      AND data_version = 'netquity-related-warrants-6f4019928e9b.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-16.netquity-related-warrants-promotion.v1'
      AND as_of = timestamptz '2026-07-16 00:00:00+08:00'
      AND quality_state = 'PASS'
      AND row_count = 18036
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned related-warrants snapshot disagrees with existing state or was withdrawn';
  END IF;
END
$snapshot_authority$;

-- Available block: every underlying instrument with at least 1 populated
-- warrant-category entry in nq_basicdata.relatedcode (309 of 18036).
-- entity_id is deliberately identical in shape and value to the
-- security_master/security_profile/financial_facts/quote_snapshot/
-- corporate_actions/sdi_disclosure/directorate/ownership promotions
-- (hkex_security_<5-digit-code>); warrants[].instrumentId uses the same
-- shape for each related warrant's own id.
WITH warrant_links AS (
  SELECT code AS underlying_code, 'comp_warrant'::text AS category, unnest(string_to_array(comp_warrant, ','))::integer AS warrant_code
  FROM nq_basicdata.relatedcode
  WHERE code IN (SELECT code FROM nq_basicdata.stock)
    AND comp_warrant IS NOT NULL AND btrim(comp_warrant) <> ''
  UNION ALL
  SELECT code, 'dp_warrant', unnest(string_to_array(dp_warrant, ','))::integer
  FROM nq_basicdata.relatedcode
  WHERE code IN (SELECT code FROM nq_basicdata.stock)
    AND dp_warrant IS NOT NULL AND btrim(dp_warrant) <> ''
  UNION ALL
  SELECT code, 'dc_warrant', unnest(string_to_array(dc_warrant, ','))::integer
  FROM nq_basicdata.relatedcode
  WHERE code IN (SELECT code FROM nq_basicdata.stock)
    AND dc_warrant IS NOT NULL AND btrim(dc_warrant) <> ''
  UNION ALL
  SELECT code, 'cc_warrant', unnest(string_to_array(cc_warrant, ','))::integer
  FROM nq_basicdata.relatedcode
  WHERE code IN (SELECT code FROM nq_basicdata.stock)
    AND cc_warrant IS NOT NULL AND btrim(cc_warrant) <> ''
  UNION ALL
  SELECT code, 'ce_warrant', unnest(string_to_array(ce_warrant, ','))::integer
  FROM nq_basicdata.relatedcode
  WHERE code IN (SELECT code FROM nq_basicdata.stock)
    AND ce_warrant IS NOT NULL AND btrim(ce_warrant) <> ''
),
warrant_link_objects AS (
  SELECT
    wl.underlying_code,
    jsonb_build_object(
      'instrumentId', 'hkex_security_' || lpad(wl.warrant_code::text, 5, '0'),
      'category', wl.category,
      'name', jsonb_build_object(
        'en', s.engname,
        'zhHant', s.chiname,
        'zhHans', s.simname
      ),
      'sourceRecordId', 'netquity:relatedcode.' || wl.category || ':' || lpad(wl.underlying_code::text, 5, '0') || ':' || lpad(wl.warrant_code::text, 5, '0')
    ) AS warrant_obj
  FROM warrant_links wl
  JOIN nq_basicdata.stock s ON s.code = wl.warrant_code
),
warrants_payload AS (
  SELECT
    underlying_code,
    jsonb_agg(warrant_obj ORDER BY (warrant_obj ->> 'sourceRecordId')) AS warrants
  FROM warrant_link_objects
  GROUP BY underlying_code
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
  'serving_netquity_related_warrants_6f4019928e9b_available_' || lpad(wp.underlying_code::text, 5, '0'),
  'serving_related_warrants_netquity_6f4019928e9b_v1',
  'instrument',
  'hkex_security_' || lpad(wp.underlying_code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'warrants', wp.warrants,
    'coverage', jsonb_build_object('status', 'available')
  ),
  ARRAY['warrants']::text[],
  'PASS',
  'netquity:related_warrants.available:' || lpad(wp.underlying_code::text, 5, '0')
FROM warrants_payload wp
ON CONFLICT (serving_record_id) DO NOTHING;

-- Unavailable block: every basicdata instrument with no populated
-- warrant-category entry in nq_basicdata.relatedcode (17727 of 18036,
-- including instruments with no relatedcode row at all and instruments with
-- a relatedcode row whose 5 warrant-category columns are all empty). The
-- reason is a purely factual, non-alarming statement: most listed
-- instruments simply have no associated derivative warrant or CBBC, not an
-- anomaly.
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
  'serving_netquity_related_warrants_6f4019928e9b_unavailable_' || lpad(s.code::text, 5, '0'),
  'serving_related_warrants_netquity_6f4019928e9b_v1',
  'instrument',
  'hkex_security_' || lpad(s.code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'coverage', jsonb_build_object(
      'status', 'unavailable',
      'reason', 'no derivative warrant or CBBC code is associated with this instrument in nq_basicdata.relatedcode in the current mirrored snapshot'
    )
  ),
  ARRAY[]::text[],
  'PASS',
  'netquity:related_warrants.unavailable:' || lpad(s.code::text, 5, '0')
FROM nq_basicdata.stock s
WHERE s.code NOT IN (
  SELECT code FROM nq_basicdata.relatedcode
  WHERE (comp_warrant IS NOT NULL AND btrim(comp_warrant) <> '')
     OR (dp_warrant   IS NOT NULL AND btrim(dp_warrant)   <> '')
     OR (dc_warrant   IS NOT NULL AND btrim(dc_warrant)   <> '')
     OR (cc_warrant   IS NOT NULL AND btrim(cc_warrant)   <> '')
     OR (ce_warrant   IS NOT NULL AND btrim(ce_warrant)   <> '')
)
ON CONFLICT (serving_record_id) DO NOTHING;

DO $serving_readback$
DECLARE
  record_rows integer;
  distinct_entities integer;
  malformed_rows integer;
  available_rows integer;
  unavailable_rows integer;
  total_warrant_link_rows bigint;
  comp_warrant_rows bigint;
  dp_warrant_rows bigint;
  dc_warrant_rows bigint;
  cc_warrant_rows bigint;
  ce_warrant_rows bigint;
  other_category_rows bigint;
BEGIN
  SELECT
    count(*)::integer,
    count(DISTINCT entity_id)::integer,
    count(*) FILTER (
      WHERE entity_type <> 'instrument'
         OR quality_state <> 'PASS'
         OR entity_id !~ '^hkex_security_[0-9]{5}$'
         OR (
              source_record_id !~ '^netquity:related_warrants[.]available:[0-9]{5}$'
              AND source_record_id !~ '^netquity:related_warrants[.]unavailable:[0-9]{5}$'
            )
         OR jsonb_typeof(payload -> 'coverage') <> 'object'
         OR (payload -> 'coverage' ->> 'status') NOT IN ('available', 'unavailable')
         OR (payload ? 'warrants' AND jsonb_typeof(payload -> 'warrants') <> 'array')
         OR (payload ? 'warrants' AND jsonb_array_length(payload -> 'warrants') = 0)
         OR (payload ? 'warrants' AND NOT ('warrants' = ANY(field_set)))
         OR (NOT (payload ? 'warrants') AND 'warrants' = ANY(field_set))
         OR NOT (field_set <@ ARRAY['warrants']::text[])
         OR (
              (payload -> 'coverage' ->> 'status') = 'unavailable'
              AND (
                payload ? 'warrants'
                OR (payload -> 'coverage' ->> 'reason') IS NULL
                OR cardinality(field_set) <> 0
              )
            )
         OR (
              (payload -> 'coverage' ->> 'status') = 'available'
              AND NOT (payload ? 'warrants')
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
  WHERE serving_snapshot_id = 'serving_related_warrants_netquity_6f4019928e9b_v1';

  SELECT
    count(*) FILTER (WHERE true),
    count(*) FILTER (WHERE warrant ->> 'category' = 'comp_warrant'),
    count(*) FILTER (WHERE warrant ->> 'category' = 'dp_warrant'),
    count(*) FILTER (WHERE warrant ->> 'category' = 'dc_warrant'),
    count(*) FILTER (WHERE warrant ->> 'category' = 'cc_warrant'),
    count(*) FILTER (WHERE warrant ->> 'category' = 'ce_warrant'),
    count(*) FILTER (WHERE warrant ->> 'category' NOT IN ('comp_warrant', 'dp_warrant', 'dc_warrant', 'cc_warrant', 'ce_warrant'))
  INTO
    total_warrant_link_rows,
    comp_warrant_rows,
    dp_warrant_rows,
    dc_warrant_rows,
    cc_warrant_rows,
    ce_warrant_rows,
    other_category_rows
  FROM aiphabee_core.serving_record record,
       LATERAL jsonb_array_elements(record.payload -> 'warrants') AS warrant
  WHERE record.serving_snapshot_id = 'serving_related_warrants_netquity_6f4019928e9b_v1'
    AND record.payload ? 'warrants';

  IF record_rows <> 18036
    OR distinct_entities <> 18036
    OR malformed_rows <> 0
    OR available_rows <> 309
    OR unavailable_rows <> 17727
    OR total_warrant_link_rows <> 9639
    OR comp_warrant_rows <> 6
    OR dp_warrant_rows <> 1045
    OR dc_warrant_rows <> 5916
    OR cc_warrant_rows <> 1247
    OR ce_warrant_rows <> 1425
    OR other_category_rows <> 0
  THEN
    RAISE EXCEPTION
      'Netquity related-warrants Serving readback mismatch: rows=%, entities=%, malformed=%, available=%, unavailable=%, total_links=%, comp=%, dp=%, dc=%, cc=%, ce=%, other=%',
      record_rows, distinct_entities, malformed_rows, available_rows, unavailable_rows,
      total_warrant_link_rows, comp_warrant_rows, dp_warrant_rows, dc_warrant_rows, cc_warrant_rows, ce_warrant_rows, other_category_rows;
  END IF;
END
$serving_readback$;

UPDATE aiphabee_core.data_version_batch
SET
  release_state = 'released',
  released_at = coalesce(released_at, now())
WHERE data_version = 'netquity-related-warrants-6f4019928e9b.v1'
  AND release_state = 'held';

UPDATE aiphabee_core.serving_snapshot
SET
  release_state = 'released',
  updated_at = now()
WHERE serving_snapshot_id = 'serving_related_warrants_netquity_6f4019928e9b_v1'
  AND release_state = 'held';

DO $release_readback$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch version
    JOIN aiphabee_core.serving_snapshot snapshot
      ON snapshot.data_version = version.data_version
    WHERE version.data_version = 'netquity-related-warrants-6f4019928e9b.v1'
      AND version.release_state = 'released'
      AND snapshot.serving_snapshot_id = 'serving_related_warrants_netquity_6f4019928e9b_v1'
      AND snapshot.release_state = 'released'
      AND snapshot.quality_state = 'PASS'
      AND snapshot.row_count = 18036
  ) THEN
    RAISE EXCEPTION 'Netquity related-warrants Serving release readback failed';
  END IF;
END
$release_readback$;

COMMIT;
