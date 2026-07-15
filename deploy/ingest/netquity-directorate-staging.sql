-- Staging-only Netquity directorate (director / senior-management
-- biography) promotion into the existing Serving Store. Sixth promotion
-- slice against the Netquity mirror (seventh overall, after
-- security_master, security_profile, financial_facts, quote_snapshot,
-- corporate_actions, sdi_disclosure): promotes per-instrument director and
-- senior-management biography rows from nq_biography.biography, joined on
-- the same entity universe as the prior BasicData-driven promotions
-- (nq_basicdata.stock, read here only to define the full 18036-instrument
-- entity scope, not for any payload column). Authority is pinned by
-- deploy/ingest/netquity-directorate-staging.contract.json. This is an
-- operational data promotion packet, not a production migration.
--
-- Scope decisions (see contract.json for the full rationale):
--   * nq_biography.biography carries no appointment/departure date column
--     (only curryearend_date/prevyearend_date, which are the fiscal
--     year-end dates the *remuneration* figures are reported against, not
--     tenure dates) and no committee-membership column (verified: only
--     67/32213 rows even mention "committee" in free-text engtitle, no
--     structured field exists) and no stable person id (the table's own
--     unique key is (code, engname, capacity, engtitle), not a synthetic
--     person id). None of "since"/tenure, committees, or a cross-company
--     person id is promoted or fabricated this cut; each is a documented
--     absence, not an oversight (see contract.json excluded_from_this_cut).
--   * capacity ('D'|'S', the only two values present) is promoted verbatim,
--     not translated into an "executive"/"independent non-executive" label:
--     nq_biography.biography carries no decode table for these two codes in
--     the mirrored schema, and while D/S align with the HKEX annual-report
--     convention "Directors" vs "Senior Management" (verified: capacity='D'
--     rows carry age 19519/21538 of the time and capacity='S' rows never
--     carry age -- age is a Listing Rules Appendix 13 director-only
--     disclosure item -- consistent with D=board director, S=senior
--     management), a finer executive/non-executive/independent
--     classification is NOT promoted or derived: it exists only as free
--     English/Chinese prose inside engtitle/chititle (e.g. "Independent
--     Non-Executive Director"), and that same free text can also describe a
--     person's *other* directorships (e.g. one real capacity='S' row's
--     engtitle is "Deputy Chairman and a Non-executive Director of HTHKH",
--     which is that person's role at a *different* listed entity, not this
--     company's own board classification) -- a keyword-matched
--     classification would misfire on exactly this kind of row, so no
--     derived isExecutive/isIndependent field is emitted; title is promoted
--     verbatim instead (the same "no decode table -> promote raw" choice
--     sdi_disclosure made for formType/l_/s_/p_eventcode).
--   * Each biography row is promoted as one directors[] entry; per-row
--     fields are independently optional and stripped via jsonb_strip_nulls
--     rather than backfilled, the same discipline sdi_disclosure applied to
--     its positions[] entries: age (populated 19519/32213), the tri-lingual
--     biography group (populated as a whole group for 27503/32213 rows --
--     verified engbiography/chibiography/simbiography are not always
--     jointly populated together, e.g. chibio_n=27336 vs engbio_n=27469, so
--     each sub-language is independently optional within the group), and
--     the remuneration group (populated as a whole group for 14493/32213
--     rows, with currency/currentAmount/currentYearEnd/previousAmount/
--     previousYearEnd each independently optional within it -- verified 14
--     rows carry currremuneration with no remunerationcurrency). Even
--     engtitle (chititle/simtitle's English counterpart) has exactly one
--     verified gap (code 610, capacity='S', "MOK Hon Wa, Kenneth"), so
--     title.en is independently optional while title.zhHant/title.zhHans
--     are not (chititle/simtitle are 100% populated, 32213/32213 each).
--   * Remuneration magnitude cross-check (per this cut's verification
--     requirement): of the 11590 rows carrying both currremuneration and a
--     nonzero prevremuneration, 11417 (98.5%) show a curr/prev ratio between
--     0.1x and 10x, a sane year-over-year range. 11 rows (0.09%, at codes
--     1767 "TS Wonders Holding Limited", 8613 "Oriental Payment Group
--     Holdings Limited", 2015, and 6888) show a ratio >= 100x; 8 of those 11
--     (all 7 populated director rows at code 1767, plus 1 row at code 8613)
--     show a ratio within 900x-1100x of exactly 1000x -- a vendor-side
--     scale/unit-encoding inconsistency isolated to those specific filings,
--     not a systemic issue across the mirror and not a column-mapping
--     error in this promotion (currremuneration/prevremuneration map
--     directly to their identically-named vendor columns with no unit
--     conversion applied). Per this cut's no-fallback/no-local-correction
--     discipline, both fields are promoted verbatim as the vendor reports
--     them -- this promotion does not invent a "corrected" value for the
--     affected rows -- and this verified anomaly is documented here and in
--     contract.json for operator awareness rather than silently promoted
--     without comment or silently excluded.
--   * Remuneration fields are promoted this cut following the user's
--     explicit 2026-07-15 confirmation that all nq_biography.biography
--     fields, including currremuneration/prevremuneration, carry Web
--     distribution rights under the existing
--     'netquity-collaboration-staging.v1' policy (individual director
--     remuneration is itself a mandatory annual-report disclosure item,
--     the same public-monitoring-data basis this cut's name/age/biography
--     fields already rely on) -- overriding the design baseline's
--     conservative default_deny assumption for this field group.
--   * No personal-data field beyond the statutorily-disclosed director /
--     senior-management biography itself is promoted or exists in
--     nq_biography.biography: the full column set (code, chiname/engname/
--     simname, capacity, age, chititle/engtitle/simtitle, chibiography/
--     engbiography/simbiography, remunerationcurrency, curryearend_date,
--     currremuneration, prevyearend_date, prevremuneration) carries no
--     address, identity-document number, date-of-birth (only integer age),
--     or contact-detail column. Name/age/title/biography/remuneration are
--     each themselves the HKEX Listing Rules Appendix 13 / Companies
--     Ordinance "Biographical Details of Directors and Senior Management"
--     annual-report disclosure this dataset exists to carry (the same
--     public-monitoring-data basis already used for company/director names
--     in security_profile and sdi_disclosure), not incidental personal data.
--   * Entity scope is the full nq_basicdata.stock universe (18036 codes),
--     matching security_master/security_profile/quote_snapshot/
--     corporate_actions/sdi_disclosure -- not just the 2783 codes that have
--     a biography row. A company with no promoted biography row is marked
--     with an explicit coverage.status="unavailable" record (the same
--     idiom), not an absent row.
--   * directors[] ordering per company is (capacity, engname, engtitle) --
--     a strict total order given the table's own (code, engname, capacity,
--     engtitle) uniqueness, so the per-company ordinal used to build each
--     profileId/sourceRecordId is fully deterministic and stable across
--     reruns of this idempotent promotion.
--   * No cross-directorship graph (a person appearing at multiple
--     companies) is built or promoted this cut: this table carries no
--     stable person id, and the task scope is this promotion's own
--     per-instrument directors[] list, not a person-level cross-company
--     view (a separate, derived concern).

BEGIN;

DO $preflight$
DECLARE
  basicdata_rows integer;
  biography_rows integer;
  missing_name_rows integer;
  orphan_codes integer;
  available_codes integer;
  unavailable_codes integer;
  capacity_d_rows integer;
  capacity_s_rows integer;
  unknown_capacity_rows integer;
  remuneration_group_rows integer;
  biography_group_rows integer;
  max_directors_per_company integer;
BEGIN
  SELECT count(*) INTO basicdata_rows FROM nq_basicdata.stock;
  SELECT count(*) INTO biography_rows FROM nq_biography.biography;

  IF basicdata_rows <> 18036 OR biography_rows <> 32213 THEN
    RAISE EXCEPTION
      'Netquity directorate preflight row-count mismatch: basicdata=%, biography=%',
      basicdata_rows, biography_rows;
  END IF;

  SELECT count(*) INTO missing_name_rows
  FROM nq_biography.biography
  WHERE btrim(chiname) = '' OR btrim(engname) = '' OR btrim(simname) = ''
     OR btrim(engtitle) = '' OR btrim(chititle) = '' OR btrim(simtitle) = '';

  IF missing_name_rows <> 0 THEN
    RAISE EXCEPTION 'Netquity directorate preflight found % row(s) with a blank (not just null) name/title field', missing_name_rows;
  END IF;

  SELECT count(*) INTO orphan_codes
  FROM (SELECT DISTINCT code FROM nq_biography.biography) bio_codes
  WHERE bio_codes.code NOT IN (SELECT code FROM nq_basicdata.stock);

  IF orphan_codes <> 0 THEN
    RAISE EXCEPTION 'Netquity directorate preflight found % code(s) with no promoted security_master instrument', orphan_codes;
  END IF;

  SELECT count(DISTINCT code) INTO available_codes FROM nq_biography.biography;
  SELECT basicdata_rows - available_codes INTO unavailable_codes;

  IF available_codes <> 2783 OR unavailable_codes <> 15253 THEN
    RAISE EXCEPTION
      'Netquity directorate preflight entity-scope mismatch: available=%, unavailable=%',
      available_codes, unavailable_codes;
  END IF;

  SELECT
    count(*) FILTER (WHERE capacity = 'D'),
    count(*) FILTER (WHERE capacity = 'S'),
    count(*) FILTER (WHERE capacity NOT IN ('D', 'S'))
  INTO capacity_d_rows, capacity_s_rows, unknown_capacity_rows
  FROM nq_biography.biography;

  IF capacity_d_rows <> 21538 OR capacity_s_rows <> 10675 OR unknown_capacity_rows <> 0 THEN
    RAISE EXCEPTION
      'Netquity directorate preflight capacity mismatch: D=%, S=%, unknown=%',
      capacity_d_rows, capacity_s_rows, unknown_capacity_rows;
  END IF;

  SELECT count(*) INTO remuneration_group_rows
  FROM nq_biography.biography
  WHERE remunerationcurrency IS NOT NULL OR currremuneration IS NOT NULL OR prevremuneration IS NOT NULL
     OR curryearend_date IS NOT NULL OR prevyearend_date IS NOT NULL;

  IF remuneration_group_rows <> 14493 THEN
    RAISE EXCEPTION 'Netquity directorate preflight remuneration-group row count mismatch: got %', remuneration_group_rows;
  END IF;

  SELECT count(*) INTO biography_group_rows
  FROM nq_biography.biography
  WHERE engbiography IS NOT NULL OR chibiography IS NOT NULL OR simbiography IS NOT NULL;

  IF biography_group_rows <> 27503 THEN
    RAISE EXCEPTION 'Netquity directorate preflight biography-group row count mismatch: got %', biography_group_rows;
  END IF;

  SELECT max(cnt) INTO max_directors_per_company FROM (SELECT code, count(*) AS cnt FROM nq_biography.biography GROUP BY code) per_code;

  IF max_directors_per_company IS NULL OR max_directors_per_company > 999 THEN
    RAISE EXCEPTION 'Netquity directorate preflight per-company row count % exceeds the 3-digit ordinal padding this promotion assumes', max_directors_per_company;
  END IF;
END
$preflight$;

-- New raw_source_batch: this promotion reads two raw tables. checksum_sha256
-- is sha256 over the two tables' full, unfiltered contents (COPY ... ORDER
-- BY <pk-or-natural-key> WITH (FORMAT CSV)), concatenated in fixed
-- alphabetical-by-schema order with a "TABLE:<schema>.<table>" header line
-- per table: nq_basicdata.stock (ORDER BY code), nq_biography.biography
-- (ORDER BY code, engname, capacity, engtitle -- the table's own unique key).
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
  'src_netquity_directorate_b0815327df55',
  'Netquity',
  'BasicData.mdb:nq_basicdata.stock,Biography.mdb:nq_biography.biography',
  timestamptz '2026-07-16 00:00:00+08:00',
  timestamptz '2026-07-16 00:00:00+08:00',
  'approved',
  'b0815327df5583e3ba71a0f932802adc405a3869d04a554cbf438ccee6dc9ec4',
  50249
)
ON CONFLICT (source_batch_id) DO NOTHING;

DO $source_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.raw_source_batch
    WHERE source_batch_id = 'src_netquity_directorate_b0815327df55'
      AND source_name = 'Netquity'
      AND source_dataset = 'BasicData.mdb:nq_basicdata.stock,Biography.mdb:nq_biography.biography'
      AND source_as_of = timestamptz '2026-07-16 00:00:00+08:00'
      AND source_rights_status = 'approved'
      AND checksum_sha256 = 'b0815327df5583e3ba71a0f932802adc405a3869d04a554cbf438ccee6dc9ec4'
      AND row_count = 50249
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity directorate source batch authority disagrees with existing state';
  END IF;
END
$source_authority$;

-- rights_policy_version reuses 'netquity-collaboration-staging.v1'
-- (security_master/security_profile/financial_facts/corporate_actions/
-- sdi_disclosure), not a new distinct value: directorate is fundamental-
-- domain regulatory disclosure data covered by the original Netquity
-- collaboration rights determination, including remuneration per the
-- user's 2026-07-15 confirmation (see header comment).
INSERT INTO aiphabee_core.data_version_batch (
  data_version,
  source_batch_id,
  methodology_version,
  rights_policy_version,
  quality_run_id,
  release_state
)
VALUES (
  'netquity-directorate-b0815327df55.v1',
  'src_netquity_directorate_b0815327df55',
  '2026-07-16.netquity-directorate-promotion.v1',
  'netquity-collaboration-staging.v1',
  'netquity-directorate-b0815327df55-quality-v1',
  'held'
)
ON CONFLICT (data_version) DO NOTHING;

DO $data_version_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch
    WHERE data_version = 'netquity-directorate-b0815327df55.v1'
      AND source_batch_id = 'src_netquity_directorate_b0815327df55'
      AND methodology_version = '2026-07-16.netquity-directorate-promotion.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned Netquity directorate data version disagrees with existing state or was withdrawn';
  END IF;
END
$data_version_authority$;

-- domain 'directorate' is a brand new value added to
-- aiphabee_core.serving_dataset_domain_check by
-- deploy/database/migrations/20260716120000_directorate_domain.sql (a
-- staging_prerequisite_migration for this promotion): like sdi_disclosure,
-- no existing domain value describes directorate.
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
  'serving_dataset_directorate',
  'directorate',
  'directorate',
  'Released HKEX director and senior-management biography records (nq_biography.biography): per-instrument name/title/age/biography and, where disclosed, individual remuneration',
  'PASS',
  'approved',
  'netquity-collaboration-staging.v1',
  '2026-07-16.netquity-directorate-promotion.v1',
  'src_netquity_directorate_b0815327df55'
)
ON CONFLICT (serving_dataset_id) DO NOTHING;

DO $dataset_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_dataset
    WHERE serving_dataset_id = 'serving_dataset_directorate'
      AND dataset = 'directorate'
      AND domain = 'directorate'
      AND default_quality_state = 'PASS'
      AND default_rights_status = 'approved'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-16.netquity-directorate-promotion.v1'
  ) THEN
    RAISE EXCEPTION 'directorate Serving dataset authority disagrees with existing state';
  END IF;
END
$dataset_authority$;

-- field_path granularity: two semantic groups per director entry (profile
-- vs remuneration), not one field per leaf attribute (name/title/age/
-- biography are never independently gated -- they are the single
-- statutory "biographical details" disclosure) and not one field for the
-- whole dataset (remuneration is a distinct semantic category the design
-- baseline originally modeled as separately gateable, even though this cut
-- approves it under the same policy version as profile -- see header
-- comment). This mirrors financial_facts' per-semantic-group granularity
-- more closely than corporate_actions'/sdi_disclosure's per-type
-- granularity, since directorate has no per-type axis analogous to
-- actionType/positionType.
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
  'directorate.' || field_path,
  'serving_dataset_directorate',
  field_path,
  display_name,
  data_type,
  nullable,
  'approved',
  'PASS',
  '2026-07-16.netquity-directorate-promotion.v1',
  'src_netquity_directorate_b0815327df55'
FROM (
  VALUES
    ('directors.profile', 'Director / senior-management name, capacity, title, age and biography (nq_biography.biography core fields)', 'json', true),
    ('directors.remuneration', 'Director / senior-management individual remuneration (nq_biography.biography remuneration fields)', 'json', true),
    ('coverage.status', 'Whether any director/senior-management biography record is covered for this instrument', 'text', false),
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
  'serving_directorate_netquity_b0815327df55_v1',
  'serving_dataset_directorate',
  'netquity-directorate-b0815327df55.v1',
  'netquity-collaboration-staging.v1',
  '2026-07-16.netquity-directorate-promotion.v1',
  timestamptz '2026-07-16 00:00:00+08:00',
  'not_applicable',
  'PASS',
  18036,
  'held',
  'src_netquity_directorate_b0815327df55'
)
ON CONFLICT (serving_snapshot_id) DO NOTHING;

DO $snapshot_authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.serving_snapshot
    WHERE serving_snapshot_id = 'serving_directorate_netquity_b0815327df55_v1'
      AND serving_dataset_id = 'serving_dataset_directorate'
      AND data_version = 'netquity-directorate-b0815327df55.v1'
      AND rights_policy_version = 'netquity-collaboration-staging.v1'
      AND methodology_version = '2026-07-16.netquity-directorate-promotion.v1'
      AND as_of = timestamptz '2026-07-16 00:00:00+08:00'
      AND quality_state = 'PASS'
      AND row_count = 18036
      AND release_state IN ('held', 'released')
  ) THEN
    RAISE EXCEPTION 'Pinned directorate snapshot disagrees with existing state or was withdrawn';
  END IF;
END
$snapshot_authority$;

-- Available block: every instrument with at least one biography row.
-- entity_id is deliberately identical in shape and value to the
-- security_master/security_profile/financial_facts/quote_snapshot/
-- corporate_actions/sdi_disclosure promotions (hkex_security_<5-digit-code>).
WITH director_rows AS (
  SELECT
    b.code,
    row_number() OVER (PARTITION BY b.code ORDER BY b.capacity, b.engname, b.engtitle) AS ordinal,
    b.capacity,
    b.engname,
    b.chiname,
    b.simname,
    b.age,
    b.engtitle,
    b.chititle,
    b.simtitle,
    b.engbiography,
    b.chibiography,
    b.simbiography,
    b.remunerationcurrency,
    b.curryearend_date,
    b.currremuneration,
    b.prevyearend_date,
    b.prevremuneration
  FROM nq_biography.biography b
),
director_objects AS (
  SELECT
    code,
    (remunerationcurrency IS NOT NULL OR currremuneration IS NOT NULL OR prevremuneration IS NOT NULL
       OR curryearend_date IS NOT NULL OR prevyearend_date IS NOT NULL) AS has_remuneration,
    jsonb_strip_nulls(
      jsonb_build_object(
        'profileId', 'directorate_' || lpad(code::text, 5, '0') || '_' || lpad(ordinal::text, 3, '0'),
        'capacity', capacity,
        'name', jsonb_build_object(
          'en', engname,
          'zhHant', chiname,
          'zhHans', simname
        ),
        'title', jsonb_build_object(
          'en', NULLIF(btrim(engtitle), ''),
          'zhHant', chititle,
          'zhHans', simtitle
        ),
        'age', age,
        'biography', CASE
          WHEN engbiography IS NOT NULL OR chibiography IS NOT NULL OR simbiography IS NOT NULL
          THEN jsonb_build_object(
            'en', NULLIF(btrim(engbiography), ''),
            'zhHant', NULLIF(btrim(chibiography), ''),
            'zhHans', NULLIF(btrim(simbiography), '')
          )
          ELSE NULL
        END,
        'remuneration', CASE
          WHEN remunerationcurrency IS NOT NULL OR currremuneration IS NOT NULL OR prevremuneration IS NOT NULL
            OR curryearend_date IS NOT NULL OR prevyearend_date IS NOT NULL
          THEN jsonb_build_object(
            'currency', NULLIF(btrim(remunerationcurrency), ''),
            'currentAmount', currremuneration,
            'currentYearEnd', to_char(curryearend_date, 'YYYY-MM-DD'),
            'previousAmount', prevremuneration,
            'previousYearEnd', to_char(prevyearend_date, 'YYYY-MM-DD')
          )
          ELSE NULL
        END,
        'sourceRecordId', 'netquity:biography.biography:' || lpad(code::text, 5, '0') || ':' || lpad(ordinal::text, 3, '0')
      )
    ) AS director_obj
  FROM director_rows
),
field_set_payload AS (
  SELECT
    code,
    array_agg(DISTINCT field_tag ORDER BY field_tag) AS field_set
  FROM (
    SELECT code, 'directors.profile'::text AS field_tag FROM director_objects
    UNION ALL
    SELECT code, 'directors.remuneration'::text FROM director_objects WHERE has_remuneration
  ) tags
  GROUP BY code
),
directorate_payload AS (
  SELECT
    code,
    jsonb_agg(director_obj ORDER BY (director_obj ->> 'profileId')) AS directors
  FROM director_objects
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
  'serving_netquity_directorate_b0815327df55_available_' || lpad(dp.code::text, 5, '0'),
  'serving_directorate_netquity_b0815327df55_v1',
  'instrument',
  'hkex_security_' || lpad(dp.code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'directors', dp.directors,
    'coverage', jsonb_build_object('status', 'available')
  ),
  fsp.field_set,
  'PASS',
  'netquity:directorate.available:' || lpad(dp.code::text, 5, '0')
FROM directorate_payload dp
JOIN field_set_payload fsp ON fsp.code = dp.code
ON CONFLICT (serving_record_id) DO NOTHING;

-- Unavailable block: every basicdata instrument with zero biography rows
-- (15253 of 18036). The reason is a purely factual, non-alarming statement:
-- most listed instruments simply have no promoted director/senior-management
-- biography row in the mirrored window (the source table only covers 2783
-- of 18036 codes), not an anomaly.
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
  'serving_netquity_directorate_b0815327df55_unavailable_' || lpad(s.code::text, 5, '0'),
  'serving_directorate_netquity_b0815327df55_v1',
  'instrument',
  'hkex_security_' || lpad(s.code::text, 5, '0'),
  NULL,
  NULL,
  jsonb_build_object(
    'directors', '[]'::jsonb,
    'coverage', jsonb_build_object(
      'status', 'unavailable',
      'reason', 'no director or senior-management biography record found in nq_biography.biography for this instrument in the current mirrored snapshot'
    )
  ),
  ARRAY[]::text[],
  'PASS',
  'netquity:directorate.unavailable:' || lpad(s.code::text, 5, '0')
FROM nq_basicdata.stock s
WHERE s.code NOT IN (SELECT DISTINCT code FROM nq_biography.biography)
ON CONFLICT (serving_record_id) DO NOTHING;

DO $serving_readback$
DECLARE
  record_rows integer;
  distinct_entities integer;
  malformed_rows integer;
  available_rows integer;
  unavailable_rows integer;
  total_director_rows bigint;
  profile_only_rows integer;
  with_remuneration_rows integer;
BEGIN
  SELECT
    count(*)::integer,
    count(DISTINCT entity_id)::integer,
    count(*) FILTER (
      WHERE entity_type <> 'instrument'
         OR quality_state <> 'PASS'
         OR entity_id !~ '^hkex_security_[0-9]{5}$'
         OR (
              source_record_id !~ '^netquity:directorate[.]available:[0-9]{5}$'
              AND source_record_id !~ '^netquity:directorate[.]unavailable:[0-9]{5}$'
            )
         OR jsonb_typeof(payload -> 'directors') <> 'array'
         OR jsonb_typeof(payload -> 'coverage') <> 'object'
         OR (payload -> 'coverage' ->> 'status') NOT IN ('available', 'unavailable')
         OR NOT (field_set <@ ARRAY['directors.profile', 'directors.remuneration']::text[])
         OR (
              (payload -> 'coverage' ->> 'status') = 'unavailable'
              AND (jsonb_array_length(payload -> 'directors') <> 0 OR (payload -> 'coverage' ->> 'reason') IS NULL)
            )
         OR (
              (payload -> 'coverage' ->> 'status') = 'available'
              AND jsonb_array_length(payload -> 'directors') = 0
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
  WHERE serving_snapshot_id = 'serving_directorate_netquity_b0815327df55_v1';

  SELECT
    coalesce(sum(jsonb_array_length(payload -> 'directors')), 0),
    count(*) FILTER (WHERE field_set = ARRAY['directors.profile']::text[]),
    count(*) FILTER (WHERE field_set = ARRAY['directors.profile', 'directors.remuneration']::text[])
  INTO total_director_rows, profile_only_rows, with_remuneration_rows
  FROM aiphabee_core.serving_record
  WHERE serving_snapshot_id = 'serving_directorate_netquity_b0815327df55_v1';

  IF record_rows <> 18036
    OR distinct_entities <> 18036
    OR malformed_rows <> 0
    OR available_rows <> 2783
    OR unavailable_rows <> 15253
    OR total_director_rows <> 32213
    OR profile_only_rows <> 195
    OR with_remuneration_rows <> 2588
  THEN
    RAISE EXCEPTION
      'Netquity directorate Serving readback mismatch: rows=%, entities=%, malformed=%, available=%, unavailable=%, total_directors=%, profile_only=%, with_remuneration=%',
      record_rows, distinct_entities, malformed_rows, available_rows, unavailable_rows, total_director_rows, profile_only_rows, with_remuneration_rows;
  END IF;
END
$serving_readback$;

UPDATE aiphabee_core.data_version_batch
SET
  release_state = 'released',
  released_at = coalesce(released_at, now())
WHERE data_version = 'netquity-directorate-b0815327df55.v1'
  AND release_state = 'held';

UPDATE aiphabee_core.serving_snapshot
SET
  release_state = 'released',
  updated_at = now()
WHERE serving_snapshot_id = 'serving_directorate_netquity_b0815327df55_v1'
  AND release_state = 'held';

DO $release_readback$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM aiphabee_core.data_version_batch version
    JOIN aiphabee_core.serving_snapshot snapshot
      ON snapshot.data_version = version.data_version
    WHERE version.data_version = 'netquity-directorate-b0815327df55.v1'
      AND version.release_state = 'released'
      AND snapshot.serving_snapshot_id = 'serving_directorate_netquity_b0815327df55_v1'
      AND snapshot.release_state = 'released'
      AND snapshot.quality_state = 'PASS'
      AND snapshot.row_count = 18036
  ) THEN
    RAISE EXCEPTION 'Netquity directorate Serving release readback failed';
  END IF;
END
$release_readback$;

COMMIT;
