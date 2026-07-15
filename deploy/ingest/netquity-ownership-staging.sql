-- Staging-only Netquity ownership (share capital / free float /
-- substantial-shareholder and cross-holding structure) promotion into the
-- existing Serving Store. Seventh promotion slice against the Netquity
-- mirror (eighth overall, after security_master, security_profile,
-- financial_facts, quote_snapshot, corporate_actions, sdi_disclosure,
-- directorate): promotes per-instrument current-state ownership structure
-- from 3 independent source tables, joined on the same entity universe as
-- the prior BasicData-driven promotions (nq_basicdata.stock, read here only
-- to define the full 18036-instrument entity scope and to filter out 17
-- stale nq_listcompheld.data rows for codes outside the current listing
-- universe, not for any payload column). Authority is pinned by
-- deploy/ingest/netquity-ownership-staging.contract.json. This is an
-- operational data promotion packet, not a production migration.
--
-- Scope decisions (see contract.json's excluded_from_this_cut/
-- payload_shape_choice for the full rationale; this header summarizes):
--   * 3 tables promoted, each the clearest-coverage current-state source for
--     its concept: nq_issueshare.issueshare (shareCapital -- latest row per
--     code by announcedate; 2786/18036 codes), nq_freefloatshare2.freefloatshare
--     (freeFloat -- latest row per code by date; 2783/18036 codes; NOT
--     nq_freefloatshare2_partial, a different-purpose 213-code/5-month
--     historical series), and nq_listcompheld.data (holders[] -- ALL rows per
--     code; 2753/18036 codes after excluding 17 stale rows for 6 codes no
--     longer in nq_basicdata.stock).
--   * Deferred (not promoted this cut): nq_sharecapital.sharecapitalchange
--     (a change-event stream, not a current-state snapshot),
--     nq_issueshare.sharehold (carries its own resolvable listcode field
--     too, but is content-redundant with listcompheld -- verified 100% of
--     valid-universe listcompheld rows match a sharehold row by (code,
--     sh_engname) -- and retains thousands of SD-sourced holder rows,
--     overwhelmingly near-zero legacy stakes, that listcompheld has
--     already pruned as no longer substantial), nq_sharecapitaldata.data
--     (only 629/18036 codes, zero coverage on this cut's own validation
--     chain, undecoded type column), nq_scsharehold.data (Stock Connect
--     channel-holding, a different trading-flow domain), and
--     nq_sharehold.shareholddata (a distinct schema from
--     nq_issueshare.sharehold despite the similar name -- a genuine
--     filing-event stream overlapping the already-shipped sdi_disclosure
--     domain).
--   * nq_listcompheld.data carries no separate "cross-holdings" row set:
--     every row is one substantial-shareholder-or-director holding record,
--     and a cross-holding is simply the subset where shareholdertype='L'
--     (verified: 644/9349 valid rows, all with a populated, 5-digit,
--     resolvable listcode; 0 non-L rows carry a listcode). Each holders[]
--     entry independently optionally carries a crossHolding sub-object
--     instead of promoting a second, duplicate array -- see contract.json's
--     payload_shape_choice.
--   * shareCapital/freeFloat/each holders[] entry are built with
--     jsonb_strip_nulls at both the per-object and outer-payload level: a
--     bucket or sub-field absent for a given instrument is an absent JSON
--     key, never a fabricated null placeholder, and never backfilled from
--     another bucket (e.g. shareCapital.hkShareClass and the excluded
--     freefloatshare2.type column are never cross-substituted).
--   * holdshareallper/issuecap_total/freefloatpercent are promoted verbatim
--     from their identically-named vendor columns; freefloatshare2's own
--     issuecapshs = freefloatshs + nonfreefloatshs and freefloatpercent ~=
--     freefloatshs/issuecapshs*100 identities are preflight-asserted against
--     the exact rows this promotion reads (0 mismatches verified), matching
--     this cut's bucket self-consistency requirement -- not re-derived or
--     corrected here, only checked.
--   * No executive/independent-style classification, decode-table lookup, or
--     cross-company person graph is derived for holderType/groupType/
--     sourceType: nq_codetable.* was checked and carries no decode table for
--     shareholdertype/grouptype/sourcecode, so each is promoted as its raw
--     vendor code, the same "no decode table -> promote raw" discipline
--     sdi_disclosure applied to formType/eventCode and directorate applied
--     to capacity.
--   * holders[] ordering per company is (holdshareallper DESC NULLS LAST,
--     sh_chiname, sh_engname) -- a strict total order given the table's own
--     (code, sh_chiname, sh_engname) uniqueness, so the per-company ordinal
--     used to build each holderId/sourceRecordId is fully deterministic and
--     stable across reruns of this idempotent promotion.

BEGIN;

DO $preflight$
DECLARE
  basicdata_rows integer;
  freefloatshare_rows integer;
  issueshare_rows integer;
  listcompheld_rows integer;
  listcompheld_orphan_rows integer;
  listcompheld_orphan_codes integer;
  listcompheld_valid_rows integer;
  cross_holding_rows integer;
  non_l_with_listcode integer;
  available_codes integer;
  unavailable_codes integer;
  with_share_capital integer;
  with_free_float integer;
  with_holders integer;
  max_holders_per_company integer;
  negative_share_capital integer;
  freefloat_percent_out_of_range integer;
  freefloat_accounting_mismatch integer;
  negative_holder_percent integer;
BEGIN
  SELECT count(*) INTO basicdata_rows FROM nq_basicdata.stock;
  SELECT count(*) INTO freefloatshare_rows FROM nq_freefloatshare2.freefloatshare;
  SELECT count(*) INTO issueshare_rows FROM nq_issueshare.issueshare;
  SELECT count(*) INTO listcompheld_rows FROM nq_listcompheld.data;

  IF basicdata_rows <> 18036 OR freefloatshare_rows <> 5566 OR issueshare_rows <> 22250 OR listcompheld_rows <> 9366 THEN
    RAISE EXCEPTION
      'Netquity ownership preflight row-count mismatch: basicdata=%, freefloatshare=%, issueshare=%, listcompheld=%',
      basicdata_rows, freefloatshare_rows, issueshare_rows, listcompheld_rows;
  END IF;

  SELECT count(*), count(DISTINCT code)
  INTO listcompheld_orphan_rows, listcompheld_orphan_codes
  FROM nq_listcompheld.data
  WHERE code NOT IN (SELECT code FROM nq_basicdata.stock);

  IF listcompheld_orphan_rows <> 17 OR listcompheld_orphan_codes <> 6 THEN
    RAISE EXCEPTION
      'Netquity ownership preflight listcompheld orphan mismatch: rows=%, codes=% (expected 17 rows / 6 codes -- see contract.json excluded_from_this_cut.listcompheld_orphan_codes)',
      listcompheld_orphan_rows, listcompheld_orphan_codes;
  END IF;

  SELECT count(*) INTO listcompheld_valid_rows
  FROM nq_listcompheld.data WHERE code IN (SELECT code FROM nq_basicdata.stock);

  IF listcompheld_valid_rows <> 9349 THEN
    RAISE EXCEPTION 'Netquity ownership preflight listcompheld valid-row mismatch: got %', listcompheld_valid_rows;
  END IF;

  SELECT count(*) INTO cross_holding_rows
  FROM nq_listcompheld.data
  WHERE code IN (SELECT code FROM nq_basicdata.stock) AND shareholdertype = 'L';

  IF cross_holding_rows <> 644 THEN
    RAISE EXCEPTION 'Netquity ownership preflight cross-holding row mismatch: got %', cross_holding_rows;
  END IF;

  SELECT count(*) INTO non_l_with_listcode
  FROM nq_listcompheld.data
  WHERE code IN (SELECT code FROM nq_basicdata.stock)
    AND shareholdertype <> 'L' AND listcode IS NOT NULL AND btrim(listcode) <> '';

  IF non_l_with_listcode <> 0 THEN
    RAISE EXCEPTION 'Netquity ownership preflight found % non-L-type row(s) unexpectedly carrying a listcode', non_l_with_listcode;
  END IF;

  IF EXISTS (
    SELECT 1 FROM nq_listcompheld.data
    WHERE code IN (SELECT code FROM nq_basicdata.stock)
      AND shareholdertype = 'L'
      AND (
        listcode IS NULL
        OR listcode !~ '^[0-9]{5}$'
        OR listcode::integer NOT IN (SELECT code FROM nq_basicdata.stock)
      )
  ) THEN
    RAISE EXCEPTION 'Netquity ownership preflight found an L-type row with a missing, malformed, or unresolvable listcode';
  END IF;

  SELECT count(DISTINCT code) INTO with_share_capital FROM nq_issueshare.issueshare;
  SELECT count(DISTINCT code) INTO with_free_float FROM nq_freefloatshare2.freefloatshare;
  SELECT count(DISTINCT code) INTO with_holders FROM nq_listcompheld.data WHERE code IN (SELECT code FROM nq_basicdata.stock);

  IF with_share_capital <> 2786 OR with_free_float <> 2783 OR with_holders <> 2753 THEN
    RAISE EXCEPTION
      'Netquity ownership preflight per-bucket coverage mismatch: share_capital=%, free_float=%, holders=%',
      with_share_capital, with_free_float, with_holders;
  END IF;

  SELECT count(*) INTO available_codes
  FROM (
    SELECT code FROM nq_issueshare.issueshare
    UNION
    SELECT code FROM nq_freefloatshare2.freefloatshare
    UNION
    SELECT code FROM nq_listcompheld.data WHERE code IN (SELECT code FROM nq_basicdata.stock)
  ) u;
  unavailable_codes := basicdata_rows - available_codes;

  IF available_codes <> 2807 OR unavailable_codes <> 15229 THEN
    RAISE EXCEPTION
      'Netquity ownership preflight entity-scope mismatch: available=%, unavailable=%',
      available_codes, unavailable_codes;
  END IF;

  SELECT max(cnt) INTO max_holders_per_company
  FROM (
    SELECT code, count(*) AS cnt
    FROM nq_listcompheld.data
    WHERE code IN (SELECT code FROM nq_basicdata.stock)
    GROUP BY code
  ) per_code;

  IF max_holders_per_company IS NULL OR max_holders_per_company > 99 THEN
    RAISE EXCEPTION 'Netquity ownership preflight per-company holder row count % exceeds the 2-digit ordinal padding this promotion assumes', max_holders_per_company;
  END IF;

  -- freeFloat bucket self-consistency, asserted against the exact rows this
  -- promotion reads (latest global date): issuecapshs must equal
  -- freefloatshs + nonfreefloatshs, and freefloatpercent must reconcile with
  -- freefloatshs/issuecapshs -- verified 0 mismatches across all 2783 rows.
  SELECT count(*) INTO freefloat_accounting_mismatch
  FROM nq_freefloatshare2.freefloatshare
  WHERE date = (SELECT max(date) FROM nq_freefloatshare2.freefloatshare)
    AND (
      abs(issuecapshs - (freefloatshs + nonfreefloatshs)) > 1
      OR (issuecapshs > 0 AND abs(freefloatpercent - (freefloatshs / issuecapshs * 100)) > 0.5)
    );

  IF freefloat_accounting_mismatch <> 0 THEN
    RAISE EXCEPTION 'Netquity ownership preflight found % freeFloat row(s) whose issuedShares/nonFreeFloatShares/freeFloatShares/freeFloatPercent do not reconcile', freefloat_accounting_mismatch;
  END IF;

  SELECT count(*) INTO freefloat_percent_out_of_range
  FROM nq_freefloatshare2.freefloatshare WHERE freefloatpercent < 0 OR freefloatpercent > 100;

  IF freefloat_percent_out_of_range <> 0 THEN
    RAISE EXCEPTION 'Netquity ownership preflight found % freeFloatPercent value(s) outside [0, 100]', freefloat_percent_out_of_range;
  END IF;

  SELECT count(*) INTO negative_share_capital
  FROM nq_issueshare.issueshare WHERE issuecap_total < 0;

  IF negative_share_capital <> 0 THEN
    RAISE EXCEPTION 'Netquity ownership preflight found % negative issuecap_total value(s)', negative_share_capital;
  END IF;

  SELECT count(*) INTO negative_holder_percent
  FROM nq_listcompheld.data WHERE code IN (SELECT code FROM nq_basicdata.stock) AND holdshareallper < 0;

  IF negative_holder_percent <> 0 THEN
    RAISE EXCEPTION 'Netquity ownership preflight found % negative holdshareallper value(s)', negative_holder_percent;
  END IF;
END
$preflight$;

-- New raw_source_batch: this promotion reads four raw tables. checksum_sha256
-- is sha256 over the four tables' full, unfiltered contents (COPY ... ORDER
-- BY <pk-or-natural-key> WITH (FORMAT CSV)), concatenated in fixed
-- alphabetical-by-schema order with a "TABLE:<schema>.<table>" header line
-- per table: nq_basicdata.stock (ORDER BY code), nq_freefloatshare2.freefloatshare
-- (ORDER BY code, date), nq_issueshare.issueshare (ORDER BY code, announcedate),
-- nq_listcompheld.data (ORDER BY code, sh_chiname, sh_engname).
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
  'src_netquity_ownership_acef407fd957',
  'Netquity',
  'BasicData.mdb:nq_basicdata.stock,FreeFloatShare2.mdb:nq_freefloatshare2.freefloatshare,IssueShare.mdb:nq_issueshare.issueshare,ListCompHeld.mdb:nq_listcompheld.data',
  timestamptz '2026-07-16 00:00:00+08:00',
  timestamptz '2026-07-16 00:00:00+08:00',
  'approved',
  'acef407fd957b491f8e2b95b697ed8202f36ad654eaf2393382db90f63cfc156',
  55218
)
ON CONFLICT (source_batch_id) DO NOTHING;

DO $source_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.raw_source_batch
    WHERE source_batch_id = 'src_netquity_ownership_acef407fd957'
      AND source_name = 'Netquity'
      AND source_dataset = 'BasicData.mdb:nq_basicdata.stock,FreeFloatShare2.mdb:nq_freefloatshare2.freefloatshare,IssueShare.mdb:nq_issueshare.issueshare,ListCompHeld.mdb:nq_listcompheld.data'
      AND source_as_of = timestamptz '2026-07-16 00:00:00+08:00'
      AND source_rights_status = 'approved'
      AND checksum_sha256 = 'acef407fd957b491f8e2b95b697ed8202f36ad654eaf2393382db90f63cfc156'
      AND row_count = 55218
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity ownership source batch authority disagrees with existing state';
  END IF;
END
$source_authority$;

-- rights_policy_version reuses 'netquity-collaboration-staging.v1'
-- (security_master/security_profile/financial_facts/corporate_actions/
-- sdi_disclosure/directorate), not a new distinct value: ownership is
-- fundamental-domain regulatory disclosure data covered by the original
-- Netquity collaboration rights determination.
INSERT INTO aiphabee_core.data_version_batch (
  data_version,
  source_batch_id,
  methodology_version,
  rights_policy_version,
  quality_run_id,
  release_state
)
VALUES (
  'netquity-ownership-acef407fd957.v1',
  'src_netquity_ownership_acef407fd957',
  '2026-07-16.netquity-ownership-promotion.v1',
  'netquity-collaboration-staging.v1',
  'netquity-ownership-acef407fd957-quality-v1',
  'held'
)
ON CONFLICT (data_version) DO NOTHING;

DO $data_version_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch
    WHERE data_version = 'netquity-ownership-acef407fd957.v1'
      AND source_batch_id = 'src_netquity_ownership_acef407fd957'
      AND methodology_version = '2026-07-16.netquity-ownership-promotion.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity ownership data version disagrees with existing state or was withdrawn';
  END IF;
END
$data_version_authority$;

-- domain 'ownership' is a brand new value added to
-- aiphabee_core.serving_dataset_domain_check by
-- deploy/database/migrations/20260716130000_ownership_domain.sql (a
-- staging_prerequisite_migration for this promotion): like sdi_disclosure and
-- directorate, no existing domain value describes ownership.
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
  'serving_dataset_ownership',
  'ownership',
  'ownership',
  'Released HKEX ownership-structure records: per-instrument current share capital (nq_issueshare.issueshare), free float (nq_freefloatshare2.freefloatshare), and substantial-shareholder/cross-holding rows (nq_listcompheld.data)',
  'PASS',
  'approved',
  'netquity-collaboration-staging.v1',
  '2026-07-16.netquity-ownership-promotion.v1',
  'src_netquity_ownership_acef407fd957'
)
ON CONFLICT (serving_dataset_id) DO NOTHING;

DO $dataset_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_dataset
    WHERE serving_dataset_id = 'serving_dataset_ownership'
      AND dataset = 'ownership'
      AND domain = 'ownership'
      AND default_quality_state = 'PASS'
      AND default_rights_status = 'approved'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-16.netquity-ownership-promotion.v1'
  ) THEN
    RAISE EXCEPTION 'ownership Serving dataset authority disagrees with existing state';
  END IF;
END
$dataset_authority$;

-- field_path granularity: 3 top-level buckets (shareCapital / freeFloat /
-- holders.profile), each independently optional per instrument, plus a
-- 4th field group (holders.crossHolding) independently optional per
-- holders[] entry within holders.profile -- see contract.json's
-- payload_shape_choice for why crossHolding is a nested field group rather
-- than a 4th top-level array.
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
  'ownership.' || field_path,
  'serving_dataset_ownership',
  field_path,
  display_name,
  data_type,
  nullable,
  'approved',
  'PASS',
  '2026-07-16.netquity-ownership-promotion.v1',
  'src_netquity_ownership_acef407fd957'
FROM (
  VALUES
    ('shareCapital', 'Current issued share capital, share class, WVR ratio, and CCASS split (nq_issueshare.issueshare)', 'json', true),
    ('freeFloat', 'Current free-float shares and percentage (nq_freefloatshare2.freefloatshare)', 'json', true),
    ('holders.profile', 'Substantial shareholder / director holding rows: name, holder/group/source type, held shares and percentage (nq_listcompheld.data)', 'json', true),
    ('holders.crossHolding', 'Cross-holding reference to another HKEX-listed instrument, present only for holders that are themselves listed (nq_listcompheld.data.listcode)', 'json', true),
    ('coverage.status', 'Whether any share capital, free float, or holder record is covered for this instrument', 'text', false),
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
  'serving_ownership_netquity_acef407fd957_v1',
  'serving_dataset_ownership',
  'netquity-ownership-acef407fd957.v1',
  'netquity-collaboration-staging.v1',
  '2026-07-16.netquity-ownership-promotion.v1',
  timestamptz '2026-07-16 00:00:00+08:00',
  'not_applicable',
  'PASS',
  18036,
  'held',
  'src_netquity_ownership_acef407fd957'
)
ON CONFLICT (serving_snapshot_id) DO NOTHING;

DO $snapshot_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_snapshot
    WHERE serving_snapshot_id = 'serving_ownership_netquity_acef407fd957_v1'
      AND serving_dataset_id = 'serving_dataset_ownership'
      AND data_version = 'netquity-ownership-acef407fd957.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-16.netquity-ownership-promotion.v1'
      AND as_of = timestamptz '2026-07-16 00:00:00+08:00'
      AND quality_state = 'PASS'
      AND row_count = 18036
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned ownership snapshot disagrees with existing state or was withdrawn';
  END IF;
END
$snapshot_authority$;

-- Available block: every instrument present in at least one of the 3 source
-- tables. entity_id is deliberately identical in shape and value to the
-- security_master/security_profile/financial_facts/quote_snapshot/
-- corporate_actions/sdi_disclosure/directorate promotions
-- (hkex_security_<5-digit-code>).
WITH share_capital_latest AS (
  SELECT DISTINCT ON (code)
    code, announcedate, hshare_type, secondlist, issuecap_total, issuecap_totalchange,
    issuecap_hk, shareclass_hk, vrratio_hk, issuecap_nhk, shareclass_nhk,
    total_share_ccass, total_share_non_ccass, prefshare_total
  FROM nq_issueshare.issueshare
  ORDER BY code, announcedate DESC
),
share_capital_payload AS (
  SELECT
    code,
    jsonb_strip_nulls(
      jsonb_build_object(
        'issuedShares', issuecap_total,
        'issuedSharesChange', issuecap_totalchange,
        'hkShareClass', NULLIF(btrim(shareclass_hk), ''),
        'hkShares', issuecap_hk,
        'nonHkShareClass', NULLIF(btrim(shareclass_nhk), ''),
        'nonHkShares', issuecap_nhk,
        'weightedVotingRightsRatio', vrratio_hk,
        'isHShare', NULLIF(btrim(hshare_type), ''),
        'hasSecondaryListing', NULLIF(btrim(secondlist), ''),
        'sharesInCcass', total_share_ccass,
        'sharesOutsideCcass', total_share_non_ccass,
        'preferenceShares', prefshare_total,
        'asOf', to_char(announcedate, 'YYYY-MM-DD')
      )
    ) AS share_capital_obj
  FROM share_capital_latest
),
free_float_latest AS (
  SELECT DISTINCT ON (code)
    code, date, issuecapshs, nonfreefloatshs, freefloatshs, freefloatpercent
  FROM nq_freefloatshare2.freefloatshare
  ORDER BY code, date DESC
),
free_float_payload AS (
  SELECT
    code,
    jsonb_strip_nulls(
      jsonb_build_object(
        'issuedShares', issuecapshs,
        'nonFreeFloatShares', nonfreefloatshs,
        'freeFloatShares', freefloatshs,
        'freeFloatPercent', freefloatpercent,
        'asOf', to_char(date, 'YYYY-MM-DD')
      )
    ) AS free_float_obj
  FROM free_float_latest
),
holder_rows AS (
  SELECT
    l.code,
    row_number() OVER (
      PARTITION BY l.code
      ORDER BY l.holdshareallper DESC NULLS LAST, l.sh_chiname, l.sh_engname
    ) AS ordinal,
    l.sh_engname,
    l.sh_chiname,
    l.sh_simname,
    l.shareholdertype,
    l.grouptype,
    l.sourcecode,
    l.holdshareall,
    l.holdshareallper,
    l.effectivedate,
    l.listcode
  FROM nq_listcompheld.data l
  WHERE l.code IN (SELECT code FROM nq_basicdata.stock)
),
holder_objects AS (
  SELECT
    code,
    (shareholdertype = 'L') AS is_cross_holding,
    jsonb_strip_nulls(
      jsonb_build_object(
        'holderId', 'ownership_' || lpad(code::text, 5, '0') || '_' || lpad(ordinal::text, 2, '0'),
        'sourceRecordId', 'netquity:listcompheld.data:' || lpad(code::text, 5, '0') || ':' || lpad(ordinal::text, 2, '0'),
        'name', jsonb_build_object(
          'en', sh_engname,
          'zhHant', sh_chiname,
          'zhHans', sh_simname
        ),
        'holderType', shareholdertype,
        'groupType', grouptype,
        'sourceType', sourcecode,
        'heldShares', holdshareall,
        'heldPercent', holdshareallper,
        'asOf', to_char(effectivedate, 'YYYY-MM-DD'),
        'crossHolding', CASE
          WHEN shareholdertype = 'L'
          THEN jsonb_build_object('instrumentId', 'hkex_security_' || listcode)
          ELSE NULL
        END
      )
    ) AS holder_obj
  FROM holder_rows
),
holders_payload AS (
  SELECT
    code,
    jsonb_agg(holder_obj ORDER BY (holder_obj ->> 'holderId')) AS holders,
    bool_or(is_cross_holding) AS has_cross_holding
  FROM holder_objects
  GROUP BY code
),
field_set_payload AS (
  SELECT
    code,
    array_agg(DISTINCT field_tag ORDER BY field_tag) AS field_set
  FROM (
    SELECT code, 'shareCapital'::text AS field_tag FROM share_capital_payload
    UNION ALL
    SELECT code, 'freeFloat'::text FROM free_float_payload
    UNION ALL
    SELECT code, 'holders.profile'::text FROM holders_payload
    UNION ALL
    SELECT code, 'holders.crossHolding'::text FROM holders_payload WHERE has_cross_holding
  ) tags
  GROUP BY code
),
available_codes AS (
  SELECT code FROM share_capital_payload
  UNION
  SELECT code FROM free_float_payload
  UNION
  SELECT code FROM holders_payload
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
  'serving_netquity_ownership_acef407fd957_available_' || lpad(ac.code::text, 5, '0'),
  'serving_ownership_netquity_acef407fd957_v1',
  'instrument',
  'hkex_security_' || lpad(ac.code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_strip_nulls(
    jsonb_build_object(
      'shareCapital', scp.share_capital_obj,
      'freeFloat', ffp.free_float_obj,
      'holders', hp.holders,
      'coverage', jsonb_build_object('status', 'available')
    )
  ),
  coalesce(fsp.field_set, ARRAY[]::text[]),
  'PASS',
  'netquity:ownership.available:' || lpad(ac.code::text, 5, '0')
FROM available_codes ac
LEFT JOIN share_capital_payload scp ON scp.code = ac.code
LEFT JOIN free_float_payload ffp ON ffp.code = ac.code
LEFT JOIN holders_payload hp ON hp.code = ac.code
LEFT JOIN field_set_payload fsp ON fsp.code = ac.code
ON CONFLICT (serving_record_id) DO NOTHING;

-- Unavailable block: every basicdata instrument absent from all 3 source
-- tables (15229 of 18036). The reason is a purely factual, non-alarming
-- statement: most listed instruments simply have no promoted ownership row
-- in the mirrored window, not an anomaly.
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
  'serving_netquity_ownership_acef407fd957_unavailable_' || lpad(s.code::text, 5, '0'),
  'serving_ownership_netquity_acef407fd957_v1',
  'instrument',
  'hkex_security_' || lpad(s.code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'coverage', jsonb_build_object(
      'status', 'unavailable',
      'reason', 'no share capital, free float, or substantial-shareholder/cross-holding record found in nq_issueshare.issueshare, nq_freefloatshare2.freefloatshare, or nq_listcompheld.data for this instrument in the current mirrored snapshot'
    )
  ),
  ARRAY[]::text[],
  'PASS',
  'netquity:ownership.unavailable:' || lpad(s.code::text, 5, '0')
FROM nq_basicdata.stock s
WHERE s.code NOT IN (
  SELECT code FROM nq_issueshare.issueshare
  UNION
  SELECT code FROM nq_freefloatshare2.freefloatshare
  UNION
  SELECT code FROM nq_listcompheld.data WHERE code IN (SELECT code FROM nq_basicdata.stock)
)
ON CONFLICT (serving_record_id) DO NOTHING;

DO $serving_readback$
DECLARE
  record_rows integer;
  distinct_entities integer;
  malformed_rows integer;
  available_rows integer;
  unavailable_rows integer;
  with_share_capital_rows integer;
  with_free_float_rows integer;
  with_holders_rows integer;
  total_holder_rows bigint;
  cross_holding_rows bigint;
BEGIN
  SELECT
    count(*)::integer,
    count(DISTINCT entity_id)::integer,
    count(*) FILTER (
      WHERE entity_type <> 'instrument'
         OR quality_state <> 'PASS'
         OR entity_id !~ '^hkex_security_[0-9]{5}$'
         OR (
              source_record_id !~ '^netquity:ownership[.]available:[0-9]{5}$'
              AND source_record_id !~ '^netquity:ownership[.]unavailable:[0-9]{5}$'
            )
         OR jsonb_typeof(payload -> 'coverage') <> 'object'
         OR (payload -> 'coverage' ->> 'status') NOT IN ('available', 'unavailable')
         OR (payload ? 'shareCapital' AND jsonb_typeof(payload -> 'shareCapital') <> 'object')
         OR (payload ? 'freeFloat' AND jsonb_typeof(payload -> 'freeFloat') <> 'object')
         OR (payload ? 'holders' AND jsonb_typeof(payload -> 'holders') <> 'array')
         OR (payload ? 'holders' AND jsonb_array_length(payload -> 'holders') = 0)
         OR (payload ? 'shareCapital' AND NOT ('shareCapital' = ANY(field_set)))
         OR (NOT (payload ? 'shareCapital') AND 'shareCapital' = ANY(field_set))
         OR (payload ? 'freeFloat' AND NOT ('freeFloat' = ANY(field_set)))
         OR (NOT (payload ? 'freeFloat') AND 'freeFloat' = ANY(field_set))
         OR (payload ? 'holders' AND NOT ('holders.profile' = ANY(field_set)))
         OR (NOT (payload ? 'holders') AND (
              'holders.profile' = ANY(field_set) OR 'holders.crossHolding' = ANY(field_set)
            ))
         OR NOT (field_set <@ ARRAY['shareCapital', 'freeFloat', 'holders.profile', 'holders.crossHolding']::text[])
         OR (
              (payload -> 'coverage' ->> 'status') = 'unavailable'
              AND (
                payload ? 'shareCapital' OR payload ? 'freeFloat' OR payload ? 'holders'
                OR (payload -> 'coverage' ->> 'reason') IS NULL
                OR cardinality(field_set) <> 0
              )
            )
         OR (
              (payload -> 'coverage' ->> 'status') = 'available'
              AND NOT (payload ? 'shareCapital' OR payload ? 'freeFloat' OR payload ? 'holders')
            )
    )::integer,
    count(*) FILTER (WHERE (payload -> 'coverage' ->> 'status') = 'available')::integer,
    count(*) FILTER (WHERE (payload -> 'coverage' ->> 'status') = 'unavailable')::integer,
    count(*) FILTER (WHERE payload ? 'shareCapital')::integer,
    count(*) FILTER (WHERE payload ? 'freeFloat')::integer,
    count(*) FILTER (WHERE payload ? 'holders')::integer
  INTO
    record_rows,
    distinct_entities,
    malformed_rows,
    available_rows,
    unavailable_rows,
    with_share_capital_rows,
    with_free_float_rows,
    with_holders_rows
  FROM aiphabee_core.serving_record
  WHERE serving_snapshot_id = 'serving_ownership_netquity_acef407fd957_v1';

  SELECT coalesce(sum(jsonb_array_length(payload -> 'holders')) FILTER (WHERE payload ? 'holders'), 0)
  INTO total_holder_rows
  FROM aiphabee_core.serving_record
  WHERE serving_snapshot_id = 'serving_ownership_netquity_acef407fd957_v1';

  SELECT count(*)
  INTO cross_holding_rows
  FROM aiphabee_core.serving_record record,
       LATERAL jsonb_array_elements(record.payload -> 'holders') AS holder
  WHERE record.serving_snapshot_id = 'serving_ownership_netquity_acef407fd957_v1'
    AND record.payload ? 'holders'
    AND holder ? 'crossHolding';

  IF record_rows <> 18036
    OR distinct_entities <> 18036
    OR malformed_rows <> 0
    OR available_rows <> 2807
    OR unavailable_rows <> 15229
    OR with_share_capital_rows <> 2786
    OR with_free_float_rows <> 2783
    OR with_holders_rows <> 2753
    OR total_holder_rows <> 9349
    OR cross_holding_rows <> 644
  THEN
    RAISE EXCEPTION
      'Netquity ownership Serving readback mismatch: rows=%, entities=%, malformed=%, available=%, unavailable=%, share_capital=%, free_float=%, holders=%, total_holder_rows=%, cross_holding_rows=%',
      record_rows, distinct_entities, malformed_rows, available_rows, unavailable_rows,
      with_share_capital_rows, with_free_float_rows, with_holders_rows, total_holder_rows, cross_holding_rows;
  END IF;
END
$serving_readback$;

UPDATE aiphabee_core.data_version_batch
SET
  release_state = 'released',
  released_at = coalesce(released_at, now())
WHERE data_version = 'netquity-ownership-acef407fd957.v1'
  AND release_state = 'held';

UPDATE aiphabee_core.serving_snapshot
SET
  release_state = 'released',
  updated_at = now()
WHERE serving_snapshot_id = 'serving_ownership_netquity_acef407fd957_v1'
  AND release_state = 'held';

DO $release_readback$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch version
    JOIN aiphabee_core.serving_snapshot snapshot
      ON snapshot.data_version = version.data_version
    WHERE version.data_version = 'netquity-ownership-acef407fd957.v1'
      AND version.release_state = 'released'
      AND snapshot.serving_snapshot_id = 'serving_ownership_netquity_acef407fd957_v1'
      AND snapshot.release_state = 'released'
      AND snapshot.quality_state = 'PASS'
      AND snapshot.row_count = 18036
  ) THEN
    RAISE EXCEPTION 'Netquity ownership Serving release readback failed';
  END IF;
END
$release_readback$;

COMMIT;
