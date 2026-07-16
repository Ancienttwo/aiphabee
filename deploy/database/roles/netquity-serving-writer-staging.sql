-- Dedicated staging-only write role for promoting Netquity live-domain SQL
-- (deploy/ingest/netquity-*-staging.sql + deploy/account/netquity-*-entitlement-staging.sql)
-- into the shared staging umbrella database's Serving Store and entitlement
-- tables. The password is set out-of-band and must never be committed or
-- echoed. Apply only after:
--   1. 20260709180000_netquity_mirror_schema.sql (nq_* mirror schema)
--   2. The full deploy/database/migrations packet through at least
--      20260716140000_related_warrants_domain.sql (adds the
--      'sdi_disclosure' / 'directorate' / 'ownership' / 'related_warrants'
--      values to aiphabee_core.serving_dataset's domain CHECK constraint)
--   3. deploy/account/authenticated-netquity-web-resolver-staging.sql (the
--      workspace_authenticated_netquity_staging / subscription_authenticated_
--      netquity_staging fixture every entitlement file's preflight requires)
--
-- RLS WRITE PATH, confirmed by running all 16 files against this role in a
-- local scratch Postgres (not by reading the RLS policies alone): both
-- aiphabee_governance.data_entitlement and
-- aiphabee_governance.workspace_entitlement have `force row level security`
-- (set by 20260623010000_platform_umbrella_schema_foundation.sql) and,
-- before this file, carried only a SELECT-command policy
-- (data_entitlement_member_read, workspace_entitlement_member_read) -- no
-- INSERT or UPDATE policy at all. PostgreSQL's default for a command with
-- zero applicable policies under FORCE ROW LEVEL SECURITY is unconditional
-- denial, confirmed empirically: `INSERT INTO
-- aiphabee_governance.data_entitlement ...` failed with `new row violates
-- row-level security policy for table "data_entitlement"` even for a role
-- holding table-level INSERT and the correct `aiphabee.account_id` session
-- claim. Granting BYPASSRLS would clear this, but the task this role was
-- built for explicitly excludes BYPASSRLS. A workspace-scoped INSERT/UPDATE
-- policy mirroring the existing SELECT policy's
-- `platform.is_workspace_member()` check was also rejected: entitlement
-- rows are the rights-grant surface itself, so a member-scoped write policy
-- would let any ordinary workspace member holding ordinary product access
-- self-grant entitlements -- a privilege-escalation hole. Instead, four
-- role-targeted policies (`TO netquity_serving_writer_staging`, see the
-- aiphabee_governance grant section below for the full derivation) close
-- the gap: the wall is unchanged for every other role, including workspace
-- members, who still only ever get the pre-existing SELECT policy.
--
-- A second, non-obvious empirical finding shaped the final policy set: an
-- `INSERT ... ON CONFLICT (...) DO UPDATE ... WHERE ...` statement against
-- an RLS table requires the inserting role to have SELECT-policy visibility
-- into the row identity, even when no actual conflict occurs for that row.
-- Confirmed by isolated test: the exact same INSERT that succeeds as a
-- plain `INSERT ... VALUES (...)` (no ON CONFLICT clause) fails with `new
-- row violates row-level security policy` the moment an
-- `ON CONFLICT (...) DO UPDATE ... WHERE ...` clause is added back, even
-- when zero rows actually conflict -- PostgreSQL evaluates the applicable
-- SELECT policy against the would-be row as part of authorizing the
-- conflict-detection path structurally, not just at runtime. The
-- pre-existing data_entitlement_member_read SELECT policy cannot supply
-- this for a brand-new entitlement_id, because it requires a matching
-- workspace_entitlement row that -- for a first-time INSERT -- does not
-- exist yet (it is only created by that same file's second INSERT
-- statement, after this one). Every one of the 8
-- deploy/account/netquity-*-entitlement-staging.sql files' first INSERT
-- uses exactly this `ON CONFLICT (dataset, channel, field_pattern,
-- rights_policy_version) DO UPDATE ... WHERE status = 'approved'` shape, so
-- this role also needs its own role-targeted SELECT policy on
-- data_entitlement (below). workspace_entitlement's second INSERT is always
-- `ON CONFLICT DO NOTHING`, which was confirmed NOT to need this -- a
-- `DO NOTHING` conflict target needs no SELECT visibility because it never
-- constructs or returns a post-conflict row, so workspace_entitlement gets
-- no equivalent SELECT policy.
--
-- Grant scope is derived from a literal enumeration of every INSERT/UPDATE/
-- SELECT/FROM/JOIN target across the 16 promotion files (8 ingest + 8
-- entitlement), not a schema-level wildcard:
--   * aiphabee_core: all 6 promotion tables get INSERT + SELECT (every file
--     inserts raw_source_batch/data_version_batch/serving_dataset/
--     serving_field/serving_snapshot/serving_record via
--     `ON CONFLICT ... DO NOTHING`, and empirically -- confirmed by running
--     the actual promotion files against this role in a local scratch
--     Postgres, not by reading the PostgreSQL grant docs alone -- even a
--     no-op `ON CONFLICT (id) DO NOTHING` requires SELECT on the target
--     table: PostgreSQL raises `permission denied for table serving_field`
--     on that clause with INSERT-only privilege, even though the identical
--     statement without the ON CONFLICT clause succeeds past the privilege
--     check with INSERT alone). Only data_version_batch and serving_snapshot
--     also get an explicit standalone
--     `UPDATE ... SET release_state = 'released' ...` guardrail statement,
--     so only those two get UPDATE.
--   * aiphabee_governance: data_entitlement gets INSERT + UPDATE (its
--     `ON CONFLICT (dataset, channel, field_pattern, rights_policy_version)
--     DO UPDATE SET ...`) + SELECT (joined by the readback DO block and by
--     the second INSERT's FROM clause). workspace_entitlement is always
--     `ON CONFLICT DO NOTHING` (INSERT only) + SELECT (joined by the
--     readback DO block). The GRANT alone does not make these commands
--     work under FORCE ROW LEVEL SECURITY -- see the role-targeted POLICY
--     block immediately after this GRANT/REVOKE section for the matching
--     INSERT/UPDATE policies and their WITH CHECK derivation.
--   * platform: only workspace_subscription is read directly, by each
--     entitlement file's preflight DO block. No other platform.* table is
--     queried by any of the 16 files' own text (platform.workspace_product_
--     access appears only in prose comments, never in an executable
--     statement) -- but platform.workspace_subscription (like
--     aiphabee_governance.data_entitlement/workspace_entitlement) has
--     `force row level security` with a SELECT policy gated by
--     `platform.is_workspace_member(workspace_id)`, and that (non-SECURITY-
--     DEFINER, per the committed migration) helper function itself reads
--     platform.workspace_membership and platform.account under the
--     *caller's* privileges. So this role also gets: (1) SELECT on
--     platform.workspace_membership and platform.account -- transitively
--     required for is_workspace_member() to be queryable at all instead of
--     raising `permission denied for table workspace_membership`, confirmed
--     empirically; and (2) a role-level `aiphabee.account_id` session claim
--     default (see ALTER ROLE ... SET below) pinned to
--     account_authenticated_netquity_staging -- the one dedicated staging
--     account deploy/account/authenticated-netquity-web-resolver-staging.sql
--     provisions and every one of these 16 files' entitlement chain is
--     already scoped to -- so is_workspace_member() resolves true for
--     workspace_authenticated_netquity_staging instead of false (no claim
--     set = current_account_id() is null = never matches). This makes the
--     SELECT-gated reads (workspace_subscription preflight,
--     data_entitlement/workspace_entitlement readback) work; it does not
--     and cannot fix the INSERT/UPDATE blocker above, which has no
--     claim-gated policy to satisfy in the first place.
--   * nq_* mirror: 12 schemas / 21 tables are read by the 8 ingest files'
--     actual FROM/JOIN clauses, verified by stripping every `-- ...` prose
--     comment line first and re-grepping only the executable SQL (the first
--     pass over raw file text produced 9 false positives -- e.g.
--     nq_capitalraised.{capitalraised,methodcode}, nq_codetable.warrantissuer,
--     nq_corpact.stocksuspend, nq_scsharehold.data,
--     nq_sharecapital.sharecapitalchange, nq_sharecapitaldata.data,
--     nq_sharehold.shareholddata, nq_issueshare.sharehold -- all of them
--     named only inside each file's own "Scope decisions" comment block as
--     a source explicitly declined/deferred/not-promoted-this-cut, never as
--     a real FROM/JOIN target). The verified 21 tables: nq_basicdata.
--     {relatedcode,stock}, nq_biography.biography, nq_corpact.
--     {stockcons,stocksplit}, nq_dividendinfo.dividendinfo, nq_finreport.
--     {bal_b,bal_i,bal_nb,cf,pla_b,pla_i,pla_nb},
--     nq_freefloatshare2.freefloatshare, nq_issueshare.issueshare,
--     nq_listcompheld.data, nq_marketdata.stock, nq_sdidata.
--     {dataperiod,sdi}, nq_sharebuyback.daily_data, nq_unadjprice2.daily. No
--     other nq_* schema (netquity_staging already covers the full nq_%
--     mirror for load/update/verify) is granted here.
--
-- No CREATE anywhere, no DELETE/TRUNCATE anywhere (every promotion INSERT is
-- `ON CONFLICT ... DO NOTHING`/`DO UPDATE`, never a delete), no BYPASSRLS,
-- no SUPERUSER. This role cannot run DDL: the 4 domain migrations above must
-- be applied through the existing admin/Hyperdrive-origin apply path first.

BEGIN;

DO $netquity_serving_writer_role$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'netquity_serving_writer_staging'
  ) THEN
    CREATE ROLE netquity_serving_writer_staging
      LOGIN;
  END IF;
END
$netquity_serving_writer_role$;

ALTER ROLE netquity_serving_writer_staging
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT
  NOBYPASSRLS;

ALTER ROLE netquity_serving_writer_staging SET search_path TO pg_catalog;

-- Row-level security claim default. platform.workspace_subscription and
-- aiphabee_governance.data_entitlement/workspace_entitlement all carry a
-- SELECT policy gated by platform.is_workspace_member(workspace_id), which
-- reads platform.current_account_id() = current_setting('aiphabee.account_id',
-- true). Pinning this role's own session default to the one dedicated
-- staging account this entire promotion packet's entitlement chain is
-- scoped to (provisioned by
-- deploy/account/authenticated-netquity-web-resolver-staging.sql) lets
-- those SELECT-gated reads resolve instead of seeing zero rows under a null
-- claim. This is a session default, not an elevated privilege: any role can
-- set an aiphabee.* GUC in its own session, and it has no effect on table-
-- or schema-level ACL checks.
ALTER ROLE netquity_serving_writer_staging
  SET aiphabee.account_id = 'account_authenticated_netquity_staging';

-- aiphabee_core: Serving Store promotion targets.

GRANT USAGE ON SCHEMA aiphabee_core TO netquity_serving_writer_staging;
REVOKE CREATE ON SCHEMA aiphabee_core FROM netquity_serving_writer_staging;

GRANT SELECT, INSERT ON TABLE
  aiphabee_core.raw_source_batch,
  aiphabee_core.serving_dataset,
  aiphabee_core.serving_field,
  aiphabee_core.serving_record
TO netquity_serving_writer_staging;

GRANT SELECT, INSERT, UPDATE ON TABLE
  aiphabee_core.data_version_batch,
  aiphabee_core.serving_snapshot
TO netquity_serving_writer_staging;

REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE
  aiphabee_core.raw_source_batch,
  aiphabee_core.data_version_batch,
  aiphabee_core.serving_dataset,
  aiphabee_core.serving_field,
  aiphabee_core.serving_snapshot,
  aiphabee_core.serving_record
FROM netquity_serving_writer_staging;

REVOKE UPDATE ON TABLE
  aiphabee_core.serving_field
FROM netquity_serving_writer_staging;

-- aiphabee_governance: entitlement promotion targets.

GRANT USAGE ON SCHEMA aiphabee_governance TO netquity_serving_writer_staging;
REVOKE CREATE ON SCHEMA aiphabee_governance FROM netquity_serving_writer_staging;

GRANT SELECT, INSERT, UPDATE ON TABLE
  aiphabee_governance.data_entitlement
TO netquity_serving_writer_staging;

GRANT SELECT, INSERT ON TABLE
  aiphabee_governance.workspace_entitlement
TO netquity_serving_writer_staging;

REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE
  aiphabee_governance.data_entitlement,
  aiphabee_governance.workspace_entitlement
FROM netquity_serving_writer_staging;

REVOKE UPDATE ON TABLE
  aiphabee_governance.workspace_entitlement
FROM netquity_serving_writer_staging;

-- aiphabee_governance: role-targeted SELECT/INSERT/UPDATE policies.
--
-- Both tables above have `force row level security` with only a
-- SELECT-command policy (data_entitlement_member_read,
-- workspace_entitlement_member_read) -- see the RLS WRITE PATH note at the
-- top of this file. PostgreSQL denies INSERT/UPDATE unconditionally when
-- zero policies apply to that command, regardless of the GRANTs above.
-- These four policies are deliberately role-targeted
-- (`TO netquity_serving_writer_staging`), not member-scoped
-- (`is_workspace_member()`-gated, matching the existing SELECT policy's
-- shape): entitlement rows are the rights-grant surface itself, so a
-- member-scoped INSERT/UPDATE policy would let any workspace member
-- holding ordinary product access self-grant entitlements. Scoping to this
-- one staging-only role instead keeps the wall unchanged for every other
-- role and confines the new write surface to exactly the automated
-- promotion path this role exists for.
--
-- WITH CHECK conditions are derived from a literal read of what all 8
-- deploy/account/netquity-*-entitlement-staging.sql files' INSERT
-- statements actually write (not a guess at future rows): every file
-- inserts channel = 'web', status = 'approved', export_allowed = false, one
-- of the 8 netquity domain names as dataset, one of the 2
-- rights_policy_version values used across those 8 files
-- ('netquity-collaboration-staging.v1' for 7 of them,
-- 'netquity-market-data-staging.v1' for quote_snapshot), a field_pattern
-- prefixed by its own dataset, and a source_record_id prefixed
-- 'netquity-...-entitlement-staging:'. Tightening to exactly these observed
-- values is defense in depth on top of the role grant: even a compromised
-- or buggy writer-role session cannot use this policy to approve a
-- non-Web channel, a foreign dataset, or a non-'approved' status row.

DROP POLICY IF EXISTS netquity_serving_writer_entitlement_insert
  ON aiphabee_governance.data_entitlement;

CREATE POLICY netquity_serving_writer_entitlement_insert
ON aiphabee_governance.data_entitlement
FOR INSERT
TO netquity_serving_writer_staging
WITH CHECK (
  channel = 'web'
  AND status = 'approved'
  AND export_allowed = false
  AND dataset IN (
    'security_profile', 'financial_facts', 'quote_snapshot',
    'corporate_actions', 'sdi_disclosure', 'directorate',
    'ownership', 'related_warrants'
  )
  AND rights_policy_version IN (
    'netquity-collaboration-staging.v1',
    'netquity-market-data-staging.v1'
  )
  AND field_pattern LIKE dataset || '.%'
  AND source_record_id LIKE 'netquity-%-entitlement-staging:%'
);

-- SELECT policy backs the `ON CONFLICT (...) DO UPDATE ... WHERE ...`
-- clause every one of the 8 entitlement files' first INSERT uses --
-- required even on a first-time insert with zero actual conflicts. See the
-- empirical finding at the top of this file: without a SELECT policy that
-- grants this role visibility into the row identity independent of
-- workspace_entitlement, the conflict-detection path structurally fails
-- with `new row violates row-level security policy`, because the
-- pre-existing data_entitlement_member_read policy needs a
-- workspace_entitlement row that does not exist yet for a brand-new
-- entitlement_id. USING is self-contained to data_entitlement's own columns
-- (unlike data_entitlement_member_read) so it never depends on a row in
-- another table that this same promotion has not written yet.
DROP POLICY IF EXISTS netquity_serving_writer_entitlement_select
  ON aiphabee_governance.data_entitlement;

CREATE POLICY netquity_serving_writer_entitlement_select
ON aiphabee_governance.data_entitlement
FOR SELECT
TO netquity_serving_writer_staging
USING (
  channel = 'web'
  AND status = 'approved'
  AND dataset IN (
    'security_profile', 'financial_facts', 'quote_snapshot',
    'corporate_actions', 'sdi_disclosure', 'directorate',
    'ownership', 'related_warrants'
  )
  AND rights_policy_version IN (
    'netquity-collaboration-staging.v1',
    'netquity-market-data-staging.v1'
  )
);

-- UPDATE policy backs the same `ON CONFLICT (dataset, channel,
-- field_pattern, rights_policy_version) DO UPDATE SET export_allowed =
-- false, source_record_id = excluded.source_record_id, updated_at = now()
-- WHERE ...status = 'approved'` clause on idempotent replay, once a real
-- conflicting row exists. USING mirrors the INSERT policy's identity
-- predicate (a conflicting row can only exist if a prior INSERT under this
-- same policy already wrote it, so it already satisfies the same
-- dataset/channel/rights_policy_version shape) plus the pre-image
-- status = 'approved' the files' own ON CONFLICT WHERE clause requires.
-- WITH CHECK reuses the INSERT policy's full predicate since the DO UPDATE
-- SET list never changes dataset, channel, field_pattern,
-- rights_policy_version, or status.
DROP POLICY IF EXISTS netquity_serving_writer_entitlement_update
  ON aiphabee_governance.data_entitlement;

CREATE POLICY netquity_serving_writer_entitlement_update
ON aiphabee_governance.data_entitlement
FOR UPDATE
TO netquity_serving_writer_staging
USING (
  channel = 'web'
  AND status = 'approved'
  AND dataset IN (
    'security_profile', 'financial_facts', 'quote_snapshot',
    'corporate_actions', 'sdi_disclosure', 'directorate',
    'ownership', 'related_warrants'
  )
  AND rights_policy_version IN (
    'netquity-collaboration-staging.v1',
    'netquity-market-data-staging.v1'
  )
)
WITH CHECK (
  channel = 'web'
  AND status = 'approved'
  AND export_allowed = false
  AND dataset IN (
    'security_profile', 'financial_facts', 'quote_snapshot',
    'corporate_actions', 'sdi_disclosure', 'directorate',
    'ownership', 'related_warrants'
  )
  AND rights_policy_version IN (
    'netquity-collaboration-staging.v1',
    'netquity-market-data-staging.v1'
  )
  AND field_pattern LIKE dataset || '.%'
  AND source_record_id LIKE 'netquity-%-entitlement-staging:%'
);

-- workspace_entitlement: INSERT only -- every one of the 8 files' second
-- INSERT is `ON CONFLICT DO NOTHING`, never DO UPDATE, so no UPDATE policy
-- is needed here (matching the GRANT layer above, which also grants no
-- UPDATE on this table to this role). workspace_id/subscription_id are
-- pinned to the single dedicated staging pairing every one of the 16 files'
-- entitlement chain is scoped to -- the same pairing this role's own
-- `aiphabee.account_id` session default (above) resolves
-- is_workspace_member() against.
DROP POLICY IF EXISTS netquity_serving_writer_workspace_entitlement_insert
  ON aiphabee_governance.workspace_entitlement;

CREATE POLICY netquity_serving_writer_workspace_entitlement_insert
ON aiphabee_governance.workspace_entitlement
FOR INSERT
TO netquity_serving_writer_staging
WITH CHECK (
  workspace_id = 'workspace_authenticated_netquity_staging'
  AND subscription_id = 'subscription_authenticated_netquity_staging'
  AND status = 'approved'
  AND source_record_id LIKE 'netquity-%-entitlement-staging:workspace:%'
);

-- platform: read-only preflight source for the entitlement promotion chain.

GRANT USAGE ON SCHEMA platform TO netquity_serving_writer_staging;
REVOKE CREATE ON SCHEMA platform FROM netquity_serving_writer_staging;

GRANT SELECT ON TABLE
  platform.workspace_subscription,
  platform.workspace_membership,
  platform.account
TO netquity_serving_writer_staging;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE
  platform.workspace_subscription,
  platform.workspace_membership,
  platform.account
FROM netquity_serving_writer_staging;

-- nq_* mirror: read-only sources for the 8 ingest promotion files. Exactly
-- the 12 schemas / 21 tables enumerated above -- not the full nq_% mirror
-- (netquity_staging already owns that for load/update/verify).

GRANT USAGE ON SCHEMA
  nq_basicdata,
  nq_biography,
  nq_corpact,
  nq_dividendinfo,
  nq_finreport,
  nq_freefloatshare2,
  nq_issueshare,
  nq_listcompheld,
  nq_marketdata,
  nq_sdidata,
  nq_sharebuyback,
  nq_unadjprice2
TO netquity_serving_writer_staging;

REVOKE CREATE ON SCHEMA
  nq_basicdata,
  nq_biography,
  nq_corpact,
  nq_dividendinfo,
  nq_finreport,
  nq_freefloatshare2,
  nq_issueshare,
  nq_listcompheld,
  nq_marketdata,
  nq_sdidata,
  nq_sharebuyback,
  nq_unadjprice2
FROM netquity_serving_writer_staging;

GRANT SELECT ON TABLE
  nq_basicdata.relatedcode,
  nq_basicdata.stock,
  nq_biography.biography,
  nq_corpact.stockcons,
  nq_corpact.stocksplit,
  nq_dividendinfo.dividendinfo,
  nq_finreport.bal_b,
  nq_finreport.bal_i,
  nq_finreport.bal_nb,
  nq_finreport.cf,
  nq_finreport.pla_b,
  nq_finreport.pla_i,
  nq_finreport.pla_nb,
  nq_freefloatshare2.freefloatshare,
  nq_issueshare.issueshare,
  nq_listcompheld.data,
  nq_marketdata.stock,
  nq_sdidata.dataperiod,
  nq_sdidata.sdi,
  nq_sharebuyback.daily_data,
  nq_unadjprice2.daily
TO netquity_serving_writer_staging;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE
  nq_basicdata.relatedcode,
  nq_basicdata.stock,
  nq_biography.biography,
  nq_corpact.stockcons,
  nq_corpact.stocksplit,
  nq_dividendinfo.dividendinfo,
  nq_finreport.bal_b,
  nq_finreport.bal_i,
  nq_finreport.bal_nb,
  nq_finreport.cf,
  nq_finreport.pla_b,
  nq_finreport.pla_i,
  nq_finreport.pla_nb,
  nq_freefloatshare2.freefloatshare,
  nq_issueshare.issueshare,
  nq_listcompheld.data,
  nq_marketdata.stock,
  nq_sdidata.dataperiod,
  nq_sdidata.sdi,
  nq_sharebuyback.daily_data,
  nq_unadjprice2.daily
FROM netquity_serving_writer_staging;

DO $role_readback$
DECLARE
  target_table text;
  write_table text;
  update_table text;
  other_table_name text;
  nq_schema text;
  nq_schemas text[] := ARRAY[
    'nq_basicdata', 'nq_biography', 'nq_corpact', 'nq_dividendinfo',
    'nq_finreport', 'nq_freefloatshare2', 'nq_issueshare', 'nq_listcompheld',
    'nq_marketdata', 'nq_sdidata', 'nq_sharebuyback', 'nq_unadjprice2'
  ];
  nq_read_only_tables text[] := ARRAY[
    'nq_basicdata.relatedcode', 'nq_basicdata.stock',
    'nq_biography.biography',
    'nq_corpact.stockcons', 'nq_corpact.stocksplit',
    'nq_dividendinfo.dividendinfo',
    'nq_finreport.bal_b', 'nq_finreport.bal_i', 'nq_finreport.bal_nb',
    'nq_finreport.cf', 'nq_finreport.pla_b', 'nq_finreport.pla_i',
    'nq_finreport.pla_nb',
    'nq_freefloatshare2.freefloatshare',
    'nq_issueshare.issueshare',
    'nq_listcompheld.data',
    'nq_marketdata.stock',
    'nq_sdidata.dataperiod', 'nq_sdidata.sdi',
    'nq_sharebuyback.daily_data',
    'nq_unadjprice2.daily'
  ];
BEGIN
  -- Role attributes: LOGIN, otherwise least-privilege.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'netquity_serving_writer_staging'
      AND rolcanlogin
      AND NOT rolsuper
      AND NOT rolcreatedb
      AND NOT rolcreaterole
      AND NOT rolinherit
      AND NOT rolbypassrls
  ) THEN
    RAISE EXCEPTION 'netquity_serving_writer_staging is missing or has unexpected role attributes';
  END IF;

  -- Row-level security claim default: aiphabee.account_id must be pinned to
  -- the dedicated staging account so is_workspace_member()-gated SELECT
  -- policies resolve for this role's own sessions.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_db_role_setting s
    JOIN pg_roles r ON r.oid = s.setrole
    WHERE r.rolname = 'netquity_serving_writer_staging'
      AND s.setdatabase = 0
      AND 'aiphabee.account_id=account_authenticated_netquity_staging' = ANY (s.setconfig)
  ) THEN
    RAISE EXCEPTION 'netquity_serving_writer_staging is missing its aiphabee.account_id session default';
  END IF;

  -- aiphabee_core: INSERT+SELECT tables (no UPDATE).
  FOREACH target_table IN ARRAY ARRAY[
    'aiphabee_core.raw_source_batch',
    'aiphabee_core.serving_dataset',
    'aiphabee_core.serving_field',
    'aiphabee_core.serving_record'
  ]
  LOOP
    IF NOT has_table_privilege('netquity_serving_writer_staging', target_table, 'SELECT') THEN
      RAISE EXCEPTION 'missing SELECT on %', target_table;
    END IF;
    IF NOT has_table_privilege('netquity_serving_writer_staging', target_table, 'INSERT') THEN
      RAISE EXCEPTION 'missing INSERT on %', target_table;
    END IF;
    IF has_table_privilege('netquity_serving_writer_staging', target_table, 'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
      RAISE EXCEPTION 'unexpected write privilege beyond INSERT/SELECT on %', target_table;
    END IF;
  END LOOP;

  -- aiphabee_core: INSERT+UPDATE+SELECT tables (the guardrail-UPDATE targets).
  FOREACH update_table IN ARRAY ARRAY[
    'aiphabee_core.data_version_batch',
    'aiphabee_core.serving_snapshot'
  ]
  LOOP
    IF NOT has_table_privilege('netquity_serving_writer_staging', update_table, 'SELECT') THEN
      RAISE EXCEPTION 'missing SELECT on %', update_table;
    END IF;
    IF NOT has_table_privilege('netquity_serving_writer_staging', update_table, 'INSERT') THEN
      RAISE EXCEPTION 'missing INSERT on %', update_table;
    END IF;
    IF NOT has_table_privilege('netquity_serving_writer_staging', update_table, 'UPDATE') THEN
      RAISE EXCEPTION 'missing UPDATE on %', update_table;
    END IF;
    IF has_table_privilege('netquity_serving_writer_staging', update_table, 'DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
      RAISE EXCEPTION 'unexpected write privilege beyond INSERT/UPDATE/SELECT on %', update_table;
    END IF;
  END LOOP;

  IF has_schema_privilege('netquity_serving_writer_staging', 'aiphabee_core', 'CREATE') THEN
    RAISE EXCEPTION 'netquity_serving_writer_staging unexpectedly has CREATE on aiphabee_core';
  END IF;

  -- aiphabee_governance.data_entitlement: INSERT+UPDATE+SELECT.
  IF NOT has_table_privilege('netquity_serving_writer_staging', 'aiphabee_governance.data_entitlement', 'SELECT') THEN
    RAISE EXCEPTION 'missing SELECT on aiphabee_governance.data_entitlement';
  END IF;
  IF NOT has_table_privilege('netquity_serving_writer_staging', 'aiphabee_governance.data_entitlement', 'INSERT') THEN
    RAISE EXCEPTION 'missing INSERT on aiphabee_governance.data_entitlement';
  END IF;
  IF NOT has_table_privilege('netquity_serving_writer_staging', 'aiphabee_governance.data_entitlement', 'UPDATE') THEN
    RAISE EXCEPTION 'missing UPDATE on aiphabee_governance.data_entitlement';
  END IF;
  IF has_table_privilege('netquity_serving_writer_staging', 'aiphabee_governance.data_entitlement', 'DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
    RAISE EXCEPTION 'unexpected write privilege beyond INSERT/UPDATE/SELECT on aiphabee_governance.data_entitlement';
  END IF;

  -- aiphabee_governance.workspace_entitlement: INSERT+SELECT (no UPDATE).
  IF NOT has_table_privilege('netquity_serving_writer_staging', 'aiphabee_governance.workspace_entitlement', 'SELECT') THEN
    RAISE EXCEPTION 'missing SELECT on aiphabee_governance.workspace_entitlement';
  END IF;
  IF NOT has_table_privilege('netquity_serving_writer_staging', 'aiphabee_governance.workspace_entitlement', 'INSERT') THEN
    RAISE EXCEPTION 'missing INSERT on aiphabee_governance.workspace_entitlement';
  END IF;
  IF has_table_privilege('netquity_serving_writer_staging', 'aiphabee_governance.workspace_entitlement', 'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
    RAISE EXCEPTION 'unexpected write privilege beyond INSERT/SELECT on aiphabee_governance.workspace_entitlement';
  END IF;

  IF has_schema_privilege('netquity_serving_writer_staging', 'aiphabee_governance', 'CREATE') THEN
    RAISE EXCEPTION 'netquity_serving_writer_staging unexpectedly has CREATE on aiphabee_governance';
  END IF;

  -- Role-targeted policies: each of the four must exist and be scoped to
  -- exactly this role -- not member-scoped, not PUBLIC, not shared with any
  -- other role.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'aiphabee_governance'
      AND tablename = 'data_entitlement'
      AND policyname = 'netquity_serving_writer_entitlement_select'
      AND cmd = 'SELECT'
      AND roles = ARRAY['netquity_serving_writer_staging']::name[]
  ) THEN
    RAISE EXCEPTION 'netquity_serving_writer_entitlement_select policy is missing or not scoped to exactly netquity_serving_writer_staging';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'aiphabee_governance'
      AND tablename = 'data_entitlement'
      AND policyname = 'netquity_serving_writer_entitlement_insert'
      AND cmd = 'INSERT'
      AND roles = ARRAY['netquity_serving_writer_staging']::name[]
  ) THEN
    RAISE EXCEPTION 'netquity_serving_writer_entitlement_insert policy is missing or not scoped to exactly netquity_serving_writer_staging';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'aiphabee_governance'
      AND tablename = 'data_entitlement'
      AND policyname = 'netquity_serving_writer_entitlement_update'
      AND cmd = 'UPDATE'
      AND roles = ARRAY['netquity_serving_writer_staging']::name[]
  ) THEN
    RAISE EXCEPTION 'netquity_serving_writer_entitlement_update policy is missing or not scoped to exactly netquity_serving_writer_staging';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'aiphabee_governance'
      AND tablename = 'workspace_entitlement'
      AND policyname = 'netquity_serving_writer_workspace_entitlement_insert'
      AND cmd = 'INSERT'
      AND roles = ARRAY['netquity_serving_writer_staging']::name[]
  ) THEN
    RAISE EXCEPTION 'netquity_serving_writer_workspace_entitlement_insert policy is missing or not scoped to exactly netquity_serving_writer_staging';
  END IF;

  -- Reverse assertion: none of the four role-targeted policies apply to
  -- PUBLIC. The exact-roles-array checks above already imply this, but this
  -- is asserted independently so a future loosening of those checks (e.g.
  -- to a containment check) cannot silently reopen entitlement writes to
  -- every role.
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'aiphabee_governance'
      AND tablename IN ('data_entitlement', 'workspace_entitlement')
      AND policyname IN (
        'netquity_serving_writer_entitlement_select',
        'netquity_serving_writer_entitlement_insert',
        'netquity_serving_writer_entitlement_update',
        'netquity_serving_writer_workspace_entitlement_insert'
      )
      AND 'public' = ANY (roles)
  ) THEN
    RAISE EXCEPTION 'a netquity_serving_writer_staging entitlement policy unexpectedly applies to PUBLIC';
  END IF;

  -- platform.workspace_subscription/workspace_membership/account:
  -- SELECT-only preflight and is_workspace_member() helper sources.
  FOREACH target_table IN ARRAY ARRAY[
    'platform.workspace_subscription',
    'platform.workspace_membership',
    'platform.account'
  ]
  LOOP
    IF NOT has_table_privilege('netquity_serving_writer_staging', target_table, 'SELECT') THEN
      RAISE EXCEPTION 'missing SELECT on %', target_table;
    END IF;
    IF has_table_privilege('netquity_serving_writer_staging', target_table, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
      RAISE EXCEPTION 'unexpected write privilege on %', target_table;
    END IF;
  END LOOP;

  IF has_schema_privilege('netquity_serving_writer_staging', 'platform', 'CREATE') THEN
    RAISE EXCEPTION 'netquity_serving_writer_staging unexpectedly has CREATE on platform';
  END IF;

  -- No other platform.* table is reachable beyond the three above. A
  -- procedural loop is used instead of a single
  -- EXISTS(... AND has_table_privilege(...)) because PostgreSQL does
  -- not guarantee WHERE-clause evaluation order: the planner may evaluate
  -- has_table_privilege() on a format()-built name before the table_schema
  -- filter runs, and has_table_privilege() raises (not just returns false)
  -- for a schema.table combination that does not exist.
  FOR other_table_name IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'platform'
      AND table_name NOT IN ('workspace_subscription', 'workspace_membership', 'account')
  LOOP
    IF has_table_privilege('netquity_serving_writer_staging', format('platform.%I', other_table_name), 'SELECT') THEN
      RAISE EXCEPTION 'netquity_serving_writer_staging unexpectedly reads platform.% beyond workspace_subscription/workspace_membership/account', other_table_name;
    END IF;
  END LOOP;

  -- No other aiphabee_governance.* table is reachable beyond the two
  -- entitlement tables.
  FOR other_table_name IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'aiphabee_governance'
      AND table_name NOT IN ('data_entitlement', 'workspace_entitlement')
  LOOP
    IF has_table_privilege('netquity_serving_writer_staging', format('aiphabee_governance.%I', other_table_name), 'SELECT,INSERT') THEN
      RAISE EXCEPTION 'netquity_serving_writer_staging unexpectedly reaches aiphabee_governance.% beyond data_entitlement/workspace_entitlement', other_table_name;
    END IF;
  END LOOP;

  -- No other aiphabee_core.* table is reachable beyond the six promotion
  -- targets.
  FOR other_table_name IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'aiphabee_core'
      AND table_name NOT IN (
        'raw_source_batch', 'data_version_batch', 'serving_dataset',
        'serving_field', 'serving_snapshot', 'serving_record'
      )
  LOOP
    IF has_table_privilege('netquity_serving_writer_staging', format('aiphabee_core.%I', other_table_name), 'SELECT,INSERT') THEN
      RAISE EXCEPTION 'netquity_serving_writer_staging unexpectedly reaches aiphabee_core.% beyond the six promotion targets', other_table_name;
    END IF;
  END LOOP;

  -- nq_* mirror: exactly the 12 enumerated schemas are usable, no others.
  IF EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name LIKE 'nq\_%' ESCAPE '\'
      AND schema_name <> ALL (nq_schemas)
      AND has_schema_privilege('netquity_serving_writer_staging', schema_name, 'USAGE')
  ) THEN
    RAISE EXCEPTION 'netquity_serving_writer_staging unexpectedly has USAGE on an nq_* schema outside the 12-schema promotion source list';
  END IF;

  FOREACH nq_schema IN ARRAY nq_schemas
  LOOP
    IF NOT has_schema_privilege('netquity_serving_writer_staging', nq_schema, 'USAGE') THEN
      RAISE EXCEPTION 'missing USAGE on schema %', nq_schema;
    END IF;
    IF has_schema_privilege('netquity_serving_writer_staging', nq_schema, 'CREATE') THEN
      RAISE EXCEPTION 'netquity_serving_writer_staging unexpectedly has CREATE on schema %', nq_schema;
    END IF;
  END LOOP;

  -- nq_* mirror: exactly the 21 enumerated tables are readable, SELECT only.
  FOREACH write_table IN ARRAY nq_read_only_tables
  LOOP
    IF NOT has_table_privilege('netquity_serving_writer_staging', write_table, 'SELECT') THEN
      RAISE EXCEPTION 'missing SELECT on %', write_table;
    END IF;
    IF has_table_privilege('netquity_serving_writer_staging', write_table, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
      RAISE EXCEPTION 'unexpected write privilege on %', write_table;
    END IF;
  END LOOP;

  -- No Better Auth schema access: this role has nothing to do with identity.
  IF has_schema_privilege('netquity_serving_writer_staging', 'aiphabee_auth', 'USAGE') THEN
    RAISE EXCEPTION 'netquity_serving_writer_staging unexpectedly has aiphabee_auth schema USAGE';
  END IF;
END
$role_readback$;

COMMIT;
