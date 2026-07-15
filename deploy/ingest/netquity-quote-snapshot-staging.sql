-- Staging-only Netquity EOD quote-snapshot promotion into the existing Serving
-- Store. Third promotion slice against the Netquity mirror's market-data
-- surface (fourth overall, after security_master, security_profile,
-- financial_facts): promotes the latest per-instrument end-of-day price row
-- from nq_unadjprice2.daily (close/open/high/low/volume/turnover/trade date)
-- plus an optional shares-outstanding field from nq_marketdata.stock, joined
-- on the same entity universe as the two BasicData-driven promotions
-- (nq_basicdata.stock, also read here for currency and full entity scope).
-- Authority is pinned by
-- deploy/ingest/netquity-quote-snapshot-staging.contract.json.
-- This is an operational data promotion packet, not a production migration.
--
-- Scope decisions (see contract.json for the full rationale):
--   * This is EOD data, not real-time or intraday: nq_unadjprice2.daily
--     carries exactly one row per code, all dated the same trade date
--     (2026-07-07 in this mirror). The live row type and every UI surface
--     built on it must say "closing price as of <trade date>", never
--     "real-time" or "current".
--   * Entity scope is the full nq_basicdata.stock universe (18036 codes),
--     matching security_master/security_profile -- not just the 17495 codes
--     that happen to have a nq_unadjprice2.daily row. The 541 codes with no
--     daily row get an explicit coverage.status="unavailable" marker (same
--     idiom as financial_facts' bank/insurance exclusion), never a bare
--     absence indistinguishable from "this instrument does not exist".
--     nq_unadjprice2.daily carries no reason code, so the marker states only
--     what is verifiably true (no row exists), not a specific cause: of the
--     541, only 111 are actually delisted by the security_profile lastlistdate
--     criterion, the other 430 are still nominally listed (tradingstatus='N')
--     but have no EOD row in this table for an undetermined reason (possibly
--     an instrument type this price file does not cover). Asserting
--     "delisted" for all 541 would be fabricated for the 430.
--   * Within an "available" (coverage.status="available") record, individual
--     price/volume fields are independently nullable and omitted via
--     jsonb_strip_nulls when the vendor row itself has them null --
--     never backfilled, carried forward, or estimated. Verified real
--     patterns in this mirror: status='S' (304 rows, suspended) rows have
--     every price/volume field null (no frozen last price is carried
--     forward); status='T' (9017 rows) rows always have null open/high/low
--     and a real (non-null) volume/turnover of exactly 0, with close
--     populated for 7346 of them; status='N' (8174 rows) rows are close to
--     fully populated (57 null open/high/low, 8 null close, 0 null
--     volume/turnover). The vendor's single-character `status` column itself
--     is NOT promoted: its exact business meaning (especially 'T') is not
--     documented anywhere in the mirrored schema, and the same coverage
--     /nullable-field idiom already represents the real data truthfully
--     without asserting an unverified interpretation.
--   * sharesOutstanding is sourced from nq_marketdata.stock.issue_cap, not
--     total_issue_cap: verified against real vendor marketcap values
--     (nq_marketdata.stock.marketcap), issue_cap * lastprice matches
--     marketcap for 2805 of 2808 comparable rows (within 1 unit), while
--     total_issue_cap only matches 2321 of 2808 (median mismatch in the
--     billions -- total_issue_cap appears to include a different share
--     class mix on some instruments). marketcap itself is NOT promoted: it
--     is the vendor's own derived product of price * shares, and this
--     promotion only projects 1:1 source columns, never a computed value.
--     nq_marketdata.stock covers only 2836 of 18036 codes; of the 17495
--     "available" quote records, 2809 get a populated sharesOutstanding and
--     the remaining 14686 simply omit the field (nullable, not a coverage
--     exclusion of its own -- shares outstanding is a secondary field on an
--     otherwise-available quote record, not a distinct promoted dataset).
--   * marketStatus / intraday session state is NOT part of the live payload:
--     the synthetic QuoteSnapshot type's "closed" | "post_close" session
--     concept has no meaning for a single frozen EOD row, and reusing it
--     would misleadingly imply live session tracking.

BEGIN;

DO $preflight$
DECLARE
  basicdata_rows integer;
  marketdata_rows integer;
  daily_rows integer;
  daily_distinct_codes integer;
  daily_codes_not_in_basicdata integer;
  marketdata_codes_not_in_basicdata integer;
  available_codes integer;
  unavailable_codes integer;
  shares_outstanding_populated integer;
  close_populated integer;
  open_populated integer;
  high_populated integer;
  low_populated integer;
  volume_populated integer;
  turnover_populated integer;
BEGIN
  SELECT count(*) INTO basicdata_rows FROM nq_basicdata.stock;
  SELECT count(*) INTO marketdata_rows FROM nq_marketdata.stock;
  SELECT count(*), count(DISTINCT code) INTO daily_rows, daily_distinct_codes FROM nq_unadjprice2.daily;

  IF basicdata_rows <> 18036 OR marketdata_rows <> 2836 OR daily_rows <> 17495 OR daily_distinct_codes <> 17495 THEN
    RAISE EXCEPTION
      'Netquity quote-snapshot preflight row-count mismatch: basicdata=%, marketdata=%, daily=%, daily_distinct=%',
      basicdata_rows, marketdata_rows, daily_rows, daily_distinct_codes;
  END IF;

  -- Every daily and marketdata code must already be a promoted
  -- security_master/security_profile instrument (nq_basicdata.stock).
  SELECT count(*) INTO daily_codes_not_in_basicdata
  FROM nq_unadjprice2.daily d WHERE d.code NOT IN (SELECT code FROM nq_basicdata.stock);
  SELECT count(*) INTO marketdata_codes_not_in_basicdata
  FROM nq_marketdata.stock m WHERE m.code NOT IN (SELECT code FROM nq_basicdata.stock);

  IF daily_codes_not_in_basicdata <> 0 OR marketdata_codes_not_in_basicdata <> 0 THEN
    RAISE EXCEPTION
      'Netquity quote-snapshot preflight found orphan code(s): daily_not_in_basicdata=%, marketdata_not_in_basicdata=%',
      daily_codes_not_in_basicdata, marketdata_codes_not_in_basicdata;
  END IF;

  SELECT count(*) INTO available_codes FROM nq_unadjprice2.daily;
  SELECT count(*) INTO unavailable_codes
  FROM nq_basicdata.stock s WHERE s.code NOT IN (SELECT code FROM nq_unadjprice2.daily);

  IF available_codes <> 17495 OR unavailable_codes <> 541 OR available_codes + unavailable_codes <> basicdata_rows THEN
    RAISE EXCEPTION
      'Netquity quote-snapshot preflight entity-scope mismatch: available=%, unavailable=%, basicdata=%',
      available_codes, unavailable_codes, basicdata_rows;
  END IF;

  SELECT count(*) INTO shares_outstanding_populated
  FROM nq_unadjprice2.daily d
  JOIN nq_marketdata.stock m ON m.code = d.code
  WHERE m.issue_cap IS NOT NULL;

  SELECT
    count(*) FILTER (WHERE close IS NOT NULL),
    count(*) FILTER (WHERE open IS NOT NULL),
    count(*) FILTER (WHERE high IS NOT NULL),
    count(*) FILTER (WHERE low IS NOT NULL),
    count(*) FILTER (WHERE volume IS NOT NULL),
    count(*) FILTER (WHERE turnover IS NOT NULL)
  INTO close_populated, open_populated, high_populated, low_populated, volume_populated, turnover_populated
  FROM nq_unadjprice2.daily;

  IF shares_outstanding_populated <> 2809
    OR close_populated <> 15512
    OR open_populated <> 8117
    OR high_populated <> 8117
    OR low_populated <> 8117
    OR volume_populated <> 17191
    OR turnover_populated <> 17191
  THEN
    RAISE EXCEPTION
      'Netquity quote-snapshot preflight field-population mismatch: shares_outstanding=%, close=%, open=%, high=%, low=%, volume=%, turnover=%',
      shares_outstanding_populated, close_populated, open_populated, high_populated, low_populated, volume_populated, turnover_populated;
  END IF;
END
$preflight$;

-- New raw_source_batch: this promotion reads three raw tables across three
-- different source .mdb files. checksum_sha256 is sha256 over the three
-- tables' full, unfiltered contents (COPY ... ORDER BY code[, tradeday] WITH
-- (FORMAT CSV)), concatenated in fixed alphabetical-by-schema order with a
-- "TABLE:<schema>.<table>" header line per table: nq_basicdata.stock,
-- nq_marketdata.stock, nq_unadjprice2.daily.
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
  'src_netquity_quote_snapshot_4c37391c8531',
  'Netquity',
  'BasicData.mdb:nq_basicdata.stock,MarketData.mdb:nq_marketdata.stock,UnAdjPrice2.mdb:nq_unadjprice2.daily',
  timestamptz '2026-07-15 00:00:00+08:00',
  timestamptz '2026-07-15 00:00:00+08:00',
  'approved',
  '4c37391c8531090df0c4f8c232657451ab404c97f7bdcbbe768997744f7138be',
  38367
)
ON CONFLICT (source_batch_id) DO NOTHING;

DO $source_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.raw_source_batch
    WHERE source_batch_id = 'src_netquity_quote_snapshot_4c37391c8531'
      AND source_name = 'Netquity'
      AND source_dataset = 'BasicData.mdb:nq_basicdata.stock,MarketData.mdb:nq_marketdata.stock,UnAdjPrice2.mdb:nq_unadjprice2.daily'
      AND source_as_of = timestamptz '2026-07-15 00:00:00+08:00'
      AND source_rights_status = 'approved'
      AND checksum_sha256 = '4c37391c8531090df0c4f8c232657451ab404c97f7bdcbbe768997744f7138be'
      AND row_count = 38367
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity quote-snapshot source batch authority disagrees with existing state';
  END IF;
END
$source_authority$;

-- New rights_policy_version, distinct from 'netquity-collaboration-staging.v1'
-- (security_master/security_profile/financial_facts): market data is
-- authorized under its own determination. Owner confirmed on 2026-07-15 that
-- the Netquity contract covers market-data Web distribution.
INSERT INTO aiphabee_core.data_version_batch (
  data_version,
  source_batch_id,
  methodology_version,
  rights_policy_version,
  quality_run_id,
  release_state
)
VALUES (
  'netquity-quote-snapshot-4c37391c8531.v1',
  'src_netquity_quote_snapshot_4c37391c8531',
  '2026-07-15.netquity-quote-snapshot-promotion.v1',
  'netquity-market-data-staging.v1',
  'netquity-quote-snapshot-4c37391c8531-quality-v1',
  'held'
)
ON CONFLICT (data_version) DO NOTHING;

DO $data_version_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch
    WHERE data_version = 'netquity-quote-snapshot-4c37391c8531.v1'
      AND source_batch_id = 'src_netquity_quote_snapshot_4c37391c8531'
      AND methodology_version = '2026-07-15.netquity-quote-snapshot-promotion.v1'
      AND rights_policy_version = 'netquity-market-data-staging.v1'
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity quote_snapshot data version disagrees with existing state or was withdrawn';
  END IF;
END
$data_version_authority$;

-- dataset and domain are both literally 'quote_snapshot':
-- aiphabee_core.serving_dataset_domain_check already carries this exact
-- value, and unlike financial_facts (plural dataset / singular domain) there
-- is no naming mismatch here.
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
  'serving_dataset_quote_snapshot',
  'quote_snapshot',
  'quote_snapshot',
  'Released HKEX per-instrument latest EOD quote snapshot (close/open/high/low/volume/turnover/trade date from nq_unadjprice2.daily, optional shares outstanding from nq_marketdata.stock)',
  'PASS',
  'approved',
  'netquity-market-data-staging.v1',
  '2026-07-15.netquity-quote-snapshot-promotion.v1',
  'src_netquity_quote_snapshot_4c37391c8531'
)
ON CONFLICT (serving_dataset_id) DO NOTHING;

DO $dataset_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_dataset
    WHERE serving_dataset_id = 'serving_dataset_quote_snapshot'
      AND dataset = 'quote_snapshot'
      AND domain = 'quote_snapshot'
      AND default_quality_state = 'PASS'
      AND default_rights_status = 'approved'
      AND rights_policy_version = 'netquity-market-data-staging.v1'
      AND methodology_version = '2026-07-15.netquity-quote-snapshot-promotion.v1'
  ) THEN
    RAISE EXCEPTION 'quote_snapshot Serving dataset authority disagrees with existing state';
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
  'quote_snapshot.' || field_path,
  'serving_dataset_quote_snapshot',
  field_path,
  display_name,
  data_type,
  nullable,
  'approved',
  'PASS',
  '2026-07-15.netquity-quote-snapshot-promotion.v1',
  'src_netquity_quote_snapshot_4c37391c8531'
FROM (
  VALUES
    ('quote.tradeDate', 'EOD trade date (nq_unadjprice2.daily.tradeday)', 'date', false),
    ('quote.currency', 'Trade currency (nq_basicdata.stock.tradecurrency)', 'text', false),
    ('quote.open', 'Opening price (nq_unadjprice2.daily.open)', 'numeric', true),
    ('quote.high', 'Intraday high (nq_unadjprice2.daily.high)', 'numeric', true),
    ('quote.low', 'Intraday low (nq_unadjprice2.daily.low)', 'numeric', true),
    ('quote.close', 'Closing price (nq_unadjprice2.daily.close)', 'numeric', true),
    ('quote.volume', 'Traded volume (nq_unadjprice2.daily.volume)', 'numeric', true),
    ('quote.turnover', 'Traded turnover (nq_unadjprice2.daily.turnover)', 'numeric', true),
    ('quote.sharesOutstanding', 'Shares outstanding (nq_marketdata.stock.issue_cap)', 'numeric', true),
    ('coverage.status', 'Whether an EOD quote row is covered for this instrument', 'text', false),
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
  'serving_quote_snapshot_netquity_unadjprice2_4c37391c8531_v1',
  'serving_dataset_quote_snapshot',
  'netquity-quote-snapshot-4c37391c8531.v1',
  'netquity-market-data-staging.v1',
  '2026-07-15.netquity-quote-snapshot-promotion.v1',
  timestamptz '2026-07-15 00:00:00+08:00',
  'closed',
  'PASS',
  18036,
  'held',
  'src_netquity_quote_snapshot_4c37391c8531'
)
ON CONFLICT (serving_snapshot_id) DO NOTHING;

DO $snapshot_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_snapshot
    WHERE serving_snapshot_id = 'serving_quote_snapshot_netquity_unadjprice2_4c37391c8531_v1'
      AND serving_dataset_id = 'serving_dataset_quote_snapshot'
      AND data_version = 'netquity-quote-snapshot-4c37391c8531.v1'
      AND rights_policy_version = 'netquity-market-data-staging.v1'
      AND methodology_version = '2026-07-15.netquity-quote-snapshot-promotion.v1'
      AND as_of = timestamptz '2026-07-15 00:00:00+08:00'
      AND quality_state = 'PASS'
      AND row_count = 18036
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned quote_snapshot snapshot disagrees with existing state or was withdrawn';
  END IF;
END
$snapshot_authority$;

-- Available block: every instrument with a nq_unadjprice2.daily row.
-- entity_id is deliberately identical in shape and value to the
-- security_master/security_profile/financial_facts promotions
-- (hkex_security_<5-digit-code>): the same instrument identity space.
-- Individual price/volume fields are stripped when null (jsonb_strip_nulls),
-- never backfilled or estimated; sharesOutstanding is independently nullable
-- (nq_marketdata.stock covers a minority of instruments).
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
  'serving_netquity_quote_snapshot_4c37391c8531_quote_' || lpad(d.code::text, 5, '0'),
  'serving_quote_snapshot_netquity_unadjprice2_4c37391c8531_v1',
  'instrument',
  'hkex_security_' || lpad(d.code::text, 5, '0'),
  d.tradeday::date,
  d.tradeday::date,
  jsonb_build_object(
    'quote', jsonb_strip_nulls(
      jsonb_build_object(
        'tradeDate', to_char(d.tradeday, 'YYYY-MM-DD'),
        'currency', s.tradecurrency,
        'open', d.open::numeric,
        'high', d.high::numeric,
        'low', d.low::numeric,
        'close', d.close::numeric,
        'volume', d.volume::numeric,
        'turnover', d.turnover::numeric,
        'sharesOutstanding', m.issue_cap::numeric
      )
    ),
    'coverage', jsonb_build_object('status', 'available')
  ),
  ARRAY['quote.tradeDate', 'quote.currency', 'coverage.status']::text[]
    || CASE WHEN d.open IS NULL THEN ARRAY[]::text[] ELSE ARRAY['quote.open']::text[] END
    || CASE WHEN d.high IS NULL THEN ARRAY[]::text[] ELSE ARRAY['quote.high']::text[] END
    || CASE WHEN d.low IS NULL THEN ARRAY[]::text[] ELSE ARRAY['quote.low']::text[] END
    || CASE WHEN d.close IS NULL THEN ARRAY[]::text[] ELSE ARRAY['quote.close']::text[] END
    || CASE WHEN d.volume IS NULL THEN ARRAY[]::text[] ELSE ARRAY['quote.volume']::text[] END
    || CASE WHEN d.turnover IS NULL THEN ARRAY[]::text[] ELSE ARRAY['quote.turnover']::text[] END
    || CASE WHEN m.issue_cap IS NULL THEN ARRAY[]::text[] ELSE ARRAY['quote.sharesOutstanding']::text[] END,
  'PASS',
  'netquity:unadjprice2.daily:' || lpad(d.code::text, 5, '0')
FROM nq_unadjprice2.daily d
JOIN nq_basicdata.stock s ON s.code = d.code
LEFT JOIN nq_marketdata.stock m ON m.code = d.code
ON CONFLICT (serving_record_id) DO NOTHING;

-- Unavailable block: basicdata instruments with no nq_unadjprice2.daily row
-- at all (541 codes). The reason states only the verified fact (no row in
-- this table), not a specific cause -- most of these are not actually
-- delisted (see header comment).
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
  'serving_netquity_quote_snapshot_4c37391c8531_unavailable_' || lpad(s.code::text, 5, '0'),
  'serving_quote_snapshot_netquity_unadjprice2_4c37391c8531_v1',
  'instrument',
  'hkex_security_' || lpad(s.code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'coverage', jsonb_build_object(
      'status', 'unavailable',
      'reason', 'no EOD price row exists in nq_unadjprice2.daily for this instrument as of the mirrored snapshot date; nq_unadjprice2.daily does not encode a reason (delisting, an instrument type outside this price feed''s coverage, or a vendor coverage gap are all possible and indistinguishable from this table alone)'
    )
  ),
  ARRAY['coverage.status', 'coverage.reason']::text[],
  'PASS',
  'netquity:unadjprice2.unavailable:' || lpad(s.code::text, 5, '0')
FROM nq_basicdata.stock s
WHERE s.code NOT IN (SELECT code FROM nq_unadjprice2.daily)
ON CONFLICT (serving_record_id) DO NOTHING;

DO $serving_readback$
DECLARE
  record_rows integer;
  distinct_entities integer;
  malformed_rows integer;
  available_rows integer;
  unavailable_rows integer;
  shares_outstanding_rows integer;
  close_rows integer;
BEGIN
  SELECT
    count(*)::integer,
    count(DISTINCT entity_id)::integer,
    count(*) FILTER (
      WHERE entity_type <> 'instrument'
         OR quality_state <> 'PASS'
         OR entity_id !~ '^hkex_security_[0-9]{5}$'
         OR (
              source_record_id !~ '^netquity:unadjprice2[.]daily:[0-9]{5}$'
              AND source_record_id !~ '^netquity:unadjprice2[.]unavailable:[0-9]{5}$'
            )
         OR jsonb_typeof(payload -> 'coverage') <> 'object'
         OR (payload -> 'coverage' ->> 'status') NOT IN ('available', 'unavailable')
         OR NOT (field_set <@ ARRAY[
              'quote.tradeDate', 'quote.currency', 'quote.open', 'quote.high', 'quote.low',
              'quote.close', 'quote.volume', 'quote.turnover', 'quote.sharesOutstanding',
              'coverage.status', 'coverage.reason'
            ]::text[])
         OR (
              (payload -> 'coverage' ->> 'status') = 'unavailable'
              AND (payload ? 'quote' OR (payload -> 'coverage' ->> 'reason') IS NULL)
            )
         OR (
              (payload -> 'coverage' ->> 'status') = 'available'
              AND (
                jsonb_typeof(payload -> 'quote') <> 'object'
                OR (payload -> 'quote' ->> 'tradeDate') IS NULL
                OR (payload -> 'quote' ->> 'currency') IS NULL
              )
            )
    )::integer,
    count(*) FILTER (WHERE (payload -> 'coverage' ->> 'status') = 'available')::integer,
    count(*) FILTER (WHERE (payload -> 'coverage' ->> 'status') = 'unavailable')::integer,
    count(*) FILTER (WHERE (payload -> 'quote' ? 'sharesOutstanding'))::integer,
    count(*) FILTER (WHERE (payload -> 'quote' ? 'close'))::integer
  INTO
    record_rows,
    distinct_entities,
    malformed_rows,
    available_rows,
    unavailable_rows,
    shares_outstanding_rows,
    close_rows
  FROM aiphabee_core.serving_record
  WHERE serving_snapshot_id = 'serving_quote_snapshot_netquity_unadjprice2_4c37391c8531_v1';

  IF record_rows <> 18036
    OR distinct_entities <> 18036
    OR malformed_rows <> 0
    OR available_rows <> 17495
    OR unavailable_rows <> 541
    OR shares_outstanding_rows <> 2809
    OR close_rows <> 15512
  THEN
    RAISE EXCEPTION
      'Netquity quote_snapshot Serving readback mismatch: rows=%, entities=%, malformed=%, available=%, unavailable=%, shares_outstanding=%, close=%',
      record_rows, distinct_entities, malformed_rows, available_rows, unavailable_rows, shares_outstanding_rows, close_rows;
  END IF;
END
$serving_readback$;

UPDATE aiphabee_core.data_version_batch
SET
  release_state = 'released',
  released_at = coalesce(released_at, now())
WHERE data_version = 'netquity-quote-snapshot-4c37391c8531.v1'
  AND release_state = 'held';

UPDATE aiphabee_core.serving_snapshot
SET
  release_state = 'released',
  updated_at = now()
WHERE serving_snapshot_id = 'serving_quote_snapshot_netquity_unadjprice2_4c37391c8531_v1'
  AND release_state = 'held';

DO $release_readback$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch version
    JOIN aiphabee_core.serving_snapshot snapshot
      ON snapshot.data_version = version.data_version
    WHERE version.data_version = 'netquity-quote-snapshot-4c37391c8531.v1'
      AND version.release_state = 'released'
      AND snapshot.serving_snapshot_id = 'serving_quote_snapshot_netquity_unadjprice2_4c37391c8531_v1'
      AND snapshot.release_state = 'released'
      AND snapshot.quality_state = 'PASS'
      AND snapshot.row_count = 18036
  ) THEN
    RAISE EXCEPTION 'Netquity quote_snapshot Serving release readback failed';
  END IF;
END
$release_readback$;

COMMIT;
