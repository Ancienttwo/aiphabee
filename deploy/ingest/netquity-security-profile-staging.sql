-- Staging-only Netquity BasicData promotion into the existing Serving Store.
-- Second promotion slice against the same pinned raw source as
-- deploy/ingest/netquity-security-resolution-staging.sql: this one projects
-- the company-header "security_profile" dataset instead of the alias-matched
-- "security_master" dataset. Authority is pinned by
-- deploy/ingest/netquity-security-profile-staging.contract.json.
-- This is an operational data promotion packet, not a production migration.

BEGIN;

DO $preflight$
DECLARE
  source_rows integer;
  distinct_codes integer;
  missing_listing_dates integer;
  missing_required_fields integer;
  invalid_codes integer;
  invalid_statuses integer;
  listed_rows integer;
  suspended_rows integer;
  delisted_rows integer;
BEGIN
  SELECT
    count(*)::integer,
    count(DISTINCT code)::integer,
    count(*) FILTER (WHERE listingdate IS NULL)::integer,
    count(*) FILTER (
      WHERE engshkname IS NULL OR btrim(engshkname) = ''
         OR chishkname IS NULL OR btrim(chishkname) = ''
         OR simshkname IS NULL OR btrim(simshkname) = ''
         OR engname IS NULL OR btrim(engname) = ''
         OR chiname IS NULL OR btrim(chiname) = ''
         OR simname IS NULL OR btrim(simname) = ''
         OR listingmarket IS NULL OR btrim(listingmarket) = ''
         OR tradecurrency IS NULL OR btrim(tradecurrency) = ''
    )::integer,
    count(*) FILTER (WHERE code < 0 OR code > 99999)::integer,
    count(*) FILTER (WHERE tradingstatus NOT IN ('N', 'S'))::integer,
    count(*) FILTER (
      WHERE (lastlistdate IS NULL OR lastlistdate >= timestamp '2026-07-11 00:00:00')
        AND tradingstatus = 'N'
    )::integer,
    count(*) FILTER (
      WHERE (lastlistdate IS NULL OR lastlistdate >= timestamp '2026-07-11 00:00:00')
        AND tradingstatus = 'S'
    )::integer,
    count(*) FILTER (WHERE lastlistdate < timestamp '2026-07-11 00:00:00')::integer
  INTO
    source_rows,
    distinct_codes,
    missing_listing_dates,
    missing_required_fields,
    invalid_codes,
    invalid_statuses,
    listed_rows,
    suspended_rows,
    delisted_rows
  FROM nq_basicdata.stock;

  IF source_rows <> 18036
    OR distinct_codes <> 18036
    OR missing_listing_dates <> 62
    OR missing_required_fields <> 0
    OR invalid_codes <> 0
    OR invalid_statuses <> 0
    OR listed_rows <> 17555
    OR suspended_rows <> 141
    OR delisted_rows <> 340
  THEN
    RAISE EXCEPTION
      'Netquity BasicData preflight mismatch: rows=%, distinct_codes=%, missing_listing_dates=%, missing_required_fields=%, invalid_codes=%, invalid_statuses=%, listed=%, suspended=%, delisted=%',
      source_rows,
      distinct_codes,
      missing_listing_dates,
      missing_required_fields,
      invalid_codes,
      invalid_statuses,
      listed_rows,
      suspended_rows,
      delisted_rows;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM nq_basicdata.stock
    WHERE listingmarket <> 'HKEX'
  ) THEN
    RAISE EXCEPTION 'Netquity BasicData contains a non-HKEX market';
  END IF;
END
$preflight$;

-- Reuses the exact raw_source_batch pinned by the security_master promotion
-- (same sha256, same source snapshot). Idempotent no-op when it already
-- exists; the DO block below re-asserts its authority either way.
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
  'src_netquity_basicdata_80cfa8bd1c73',
  'Netquity',
  'BasicData.mdb:nq_basicdata.stock',
  timestamptz '2026-07-11 00:00:00+08:00',
  timestamptz '2026-07-11 00:00:00+08:00',
  'approved',
  '80cfa8bd1c737750199ceaf0f8f0bfe5c71d7f3cb074d6ae51da5cb394f8c861',
  18036
)
ON CONFLICT (source_batch_id) DO NOTHING;

DO $source_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.raw_source_batch
    WHERE source_batch_id = 'src_netquity_basicdata_80cfa8bd1c73'
      AND source_name = 'Netquity'
      AND source_dataset = 'BasicData.mdb:nq_basicdata.stock'
      AND source_as_of = timestamptz '2026-07-11 00:00:00+08:00'
      AND source_rights_status = 'approved'
      AND checksum_sha256 = '80cfa8bd1c737750199ceaf0f8f0bfe5c71d7f3cb074d6ae51da5cb394f8c861'
      AND row_count = 18036
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity source batch authority disagrees with existing state';
  END IF;
END
$source_authority$;

-- Distinct data_version from the security_master promotion: same raw source,
-- new derived methodology (this dataset's field projection differs).
INSERT INTO aiphabee_core.data_version_batch (
  data_version,
  source_batch_id,
  methodology_version,
  rights_policy_version,
  quality_run_id,
  release_state
)
VALUES (
  'netquity-security-profile-80cfa8bd1c73.v1',
  'src_netquity_basicdata_80cfa8bd1c73',
  '2026-07-15.netquity-security-profile-promotion.v1',
  'netquity-collaboration-staging.v1',
  'netquity-security-profile-80cfa8bd1c73-quality-v1',
  'held'
)
ON CONFLICT (data_version) DO NOTHING;

DO $data_version_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch
    WHERE data_version = 'netquity-security-profile-80cfa8bd1c73.v1'
      AND source_batch_id = 'src_netquity_basicdata_80cfa8bd1c73'
      AND methodology_version = '2026-07-15.netquity-security-profile-promotion.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity security_profile data version disagrees with existing state or was withdrawn';
  END IF;
END
$data_version_authority$;

-- domain stays 'security_master': aiphabee_core.serving_dataset_domain_check
-- has no 'security_profile' value, and this dataset is a company-header
-- projection within the same security-master domain umbrella.
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
  'serving_dataset_security_profile',
  'security_profile',
  'security_master',
  'Released HKEX security company-header profile (exact entity id lookup)',
  'PASS',
  'approved',
  'netquity-collaboration-staging.v1',
  '2026-07-15.netquity-security-profile-promotion.v1',
  'src_netquity_basicdata_80cfa8bd1c73'
)
ON CONFLICT (serving_dataset_id) DO NOTHING;

DO $dataset_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_dataset
    WHERE serving_dataset_id = 'serving_dataset_security_profile'
      AND dataset = 'security_profile'
      AND domain = 'security_master'
      AND default_quality_state = 'PASS'
      AND default_rights_status = 'approved'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-15.netquity-security-profile-promotion.v1'
  ) THEN
    RAISE EXCEPTION 'security_profile Serving dataset authority disagrees with existing state';
  END IF;
END
$dataset_authority$;

-- listingId and lifecycle.suspendedAt are cataloged (nullable) but never
-- populated by this promotion: nq_basicdata.stock has no listing-id concept
-- and no suspension-date column (a suspension date would require joining
-- nq_corpact.stocksuspend/stockresume, which is not part of the sha256-pinned
-- raw_source_batch for this slice). Declared here so entitlement and the
-- toolkit can reference the field path once a richer source is pinned.
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
  'security_profile.' || field_path,
  'serving_dataset_security_profile',
  field_path,
  display_name,
  data_type,
  nullable,
  'approved',
  'PASS',
  '2026-07-15.netquity-security-profile-promotion.v1',
  'src_netquity_basicdata_80cfa8bd1c73'
FROM (
  VALUES
    ('symbol', 'Canonical symbol', 'text', false),
    ('name.en', 'English name', 'text', false),
    ('name.zhHant', 'Traditional Chinese name', 'text', false),
    ('name.zhHans', 'Simplified Chinese name', 'text', false),
    ('listingStatus', 'Listing status', 'text', false),
    ('lifecycle.listedAt', 'Listing start date', 'date', true),
    ('lifecycle.delistedAt', 'Delisting date', 'date', true),
    ('lifecycle.suspendedAt', 'Suspension start date (not yet source-backed)', 'date', true),
    ('listingId', 'Opaque listing id (not yet source-backed)', 'text', true),
    ('exchange', 'Exchange', 'text', false),
    ('market', 'Market', 'text', false),
    ('currency', 'Trade currency', 'text', false)
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
  'serving_security_profile_netquity_basicdata_80cfa8bd1c73_v1',
  'serving_dataset_security_profile',
  'netquity-security-profile-80cfa8bd1c73.v1',
  'netquity-collaboration-staging.v1',
  '2026-07-15.netquity-security-profile-promotion.v1',
  timestamptz '2026-07-11 00:00:00+08:00',
  'closed',
  'PASS',
  18036,
  'held',
  'src_netquity_basicdata_80cfa8bd1c73'
)
ON CONFLICT (serving_snapshot_id) DO NOTHING;

DO $snapshot_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_snapshot
    WHERE serving_snapshot_id = 'serving_security_profile_netquity_basicdata_80cfa8bd1c73_v1'
      AND serving_dataset_id = 'serving_dataset_security_profile'
      AND data_version = 'netquity-security-profile-80cfa8bd1c73.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-15.netquity-security-profile-promotion.v1'
      AND as_of = timestamptz '2026-07-11 00:00:00+08:00'
      AND quality_state = 'PASS'
      AND row_count = 18036
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned security_profile snapshot disagrees with existing state or was withdrawn';
  END IF;
END
$snapshot_authority$;

-- entity_id is deliberately identical in shape and value to the
-- security_master promotion (hkex_security_<5-digit-code>): the same
-- instrument identity space, so a resolve_security candidate's instrumentId
-- can be used directly as the profile lookup key.
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
  'serving_netquity_basicdata_80cfa8bd1c73_profile_' || lpad(stock.code::text, 5, '0'),
  'serving_security_profile_netquity_basicdata_80cfa8bd1c73_v1',
  'instrument',
  'hkex_security_' || lpad(stock.code::text, 5, '0'),
  stock.listingdate::date,
  CASE
    WHEN stock.lastlistdate < timestamp '2026-07-11 00:00:00'
      THEN stock.lastlistdate::date
    ELSE NULL
  END,
  jsonb_strip_nulls(
    jsonb_build_object(
      'symbol', lpad(stock.code::text, 5, '0') || '.HK',
      'exchange', 'HKEX',
      'market', 'HK',
      'currency', stock.tradecurrency,
      'name', jsonb_build_object(
        'en', stock.engname,
        'zhHant', stock.chiname,
        'zhHans', stock.simname
      ),
      'listingStatus', CASE
        WHEN stock.lastlistdate < timestamp '2026-07-11 00:00:00' THEN 'delisted'
        WHEN stock.tradingstatus = 'S' THEN 'suspended'
        WHEN stock.tradingstatus = 'N' THEN 'listed'
        ELSE NULL
      END,
      'lifecycle', jsonb_build_object(
        'listedAt', to_char(stock.listingdate, 'YYYY-MM-DD'),
        'delistedAt', CASE
          WHEN stock.lastlistdate < timestamp '2026-07-11 00:00:00'
            THEN to_char(stock.lastlistdate, 'YYYY-MM-DD')
          ELSE NULL
        END
      )
    )
  ),
  ARRAY[
    'symbol',
    'exchange',
    'market',
    'currency',
    'name.en',
    'name.zhHant',
    'name.zhHans',
    'listingStatus'
  ]::text[]
    || CASE WHEN stock.listingdate IS NULL THEN ARRAY[]::text[] ELSE ARRAY['lifecycle.listedAt']::text[] END
    || CASE
      WHEN stock.lastlistdate < timestamp '2026-07-11 00:00:00'
        THEN ARRAY['lifecycle.delistedAt']::text[]
      ELSE ARRAY[]::text[]
    END,
  'PASS',
  'netquity:basicdata.stock:' || lpad(stock.code::text, 5, '0')
FROM nq_basicdata.stock stock
ON CONFLICT (serving_record_id) DO NOTHING;

DO $serving_readback$
DECLARE
  record_rows integer;
  distinct_entities integer;
  malformed_rows integer;
  listed_rows integer;
  suspended_rows integer;
  delisted_rows integer;
BEGIN
  SELECT
    count(*)::integer,
    count(DISTINCT entity_id)::integer,
    count(*) FILTER (
      WHERE entity_type <> 'instrument'
         OR quality_state <> 'PASS'
         OR entity_id !~ '^hkex_security_[0-9]{5}$'
         OR source_record_id !~ '^netquity:basicdata[.]stock:[0-9]{5}$'
         OR payload ->> 'exchange' <> 'HKEX'
         OR payload ->> 'market' <> 'HK'
         OR payload ->> 'symbol' !~ '^[0-9]{5}[.]HK$'
         OR payload ->> 'currency' IS NULL
         OR jsonb_typeof(payload -> 'name') <> 'object'
         OR (payload -> 'name' ->> 'en') IS NULL
         OR (payload -> 'name' ->> 'zhHant') IS NULL
         OR (payload -> 'name' ->> 'zhHans') IS NULL
         OR jsonb_typeof(payload -> 'lifecycle') <> 'object'
         OR payload ? 'listingId'
         OR (payload -> 'lifecycle') ? 'suspendedAt'
    )::integer,
    count(*) FILTER (WHERE payload ->> 'listingStatus' = 'listed')::integer,
    count(*) FILTER (WHERE payload ->> 'listingStatus' = 'suspended')::integer,
    count(*) FILTER (WHERE payload ->> 'listingStatus' = 'delisted')::integer
  INTO
    record_rows,
    distinct_entities,
    malformed_rows,
    listed_rows,
    suspended_rows,
    delisted_rows
  FROM aiphabee_core.serving_record
  WHERE serving_snapshot_id = 'serving_security_profile_netquity_basicdata_80cfa8bd1c73_v1';

  IF record_rows <> 18036
    OR distinct_entities <> 18036
    OR malformed_rows <> 0
    OR listed_rows <> 17555
    OR suspended_rows <> 141
    OR delisted_rows <> 340
  THEN
    RAISE EXCEPTION
      'Netquity security profile Serving readback mismatch: rows=%, entities=%, malformed=%, listed=%, suspended=%, delisted=%',
      record_rows,
      distinct_entities,
      malformed_rows,
      listed_rows,
      suspended_rows,
      delisted_rows;
  END IF;
END
$serving_readback$;

UPDATE aiphabee_core.data_version_batch
SET
  release_state = 'released',
  released_at = coalesce(released_at, now())
WHERE data_version = 'netquity-security-profile-80cfa8bd1c73.v1'
  AND release_state = 'held';

UPDATE aiphabee_core.serving_snapshot
SET
  release_state = 'released',
  updated_at = now()
WHERE serving_snapshot_id = 'serving_security_profile_netquity_basicdata_80cfa8bd1c73_v1'
  AND release_state = 'held';

DO $release_readback$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch version
    JOIN aiphabee_core.serving_snapshot snapshot
      ON snapshot.data_version = version.data_version
    WHERE version.data_version = 'netquity-security-profile-80cfa8bd1c73.v1'
      AND version.release_state = 'released'
      AND snapshot.serving_snapshot_id = 'serving_security_profile_netquity_basicdata_80cfa8bd1c73_v1'
      AND snapshot.release_state = 'released'
      AND snapshot.quality_state = 'PASS'
      AND snapshot.row_count = 18036
  ) THEN
    RAISE EXCEPTION 'Netquity security profile Serving release readback failed';
  END IF;
END
$release_readback$;

COMMIT;
