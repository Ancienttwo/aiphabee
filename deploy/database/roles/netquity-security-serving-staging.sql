-- Narrow staging runtime access to released Serving Store authority.
-- The runtime role never receives raw Netquity schema access or write authority.

BEGIN;

DO $role_preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'aiphabee_runtime_rls'
      AND NOT rolsuper
      AND NOT rolbypassrls
  ) THEN
    RAISE EXCEPTION 'aiphabee_runtime_rls is missing, superuser, or BYPASSRLS';
  END IF;
END
$role_preflight$;

GRANT USAGE ON SCHEMA aiphabee_core TO aiphabee_runtime_rls;
REVOKE CREATE ON SCHEMA aiphabee_core FROM aiphabee_runtime_rls;

GRANT SELECT ON TABLE
  aiphabee_core.raw_source_batch,
  aiphabee_core.data_version_batch,
  aiphabee_core.serving_dataset,
  aiphabee_core.serving_snapshot,
  aiphabee_core.serving_record
TO aiphabee_runtime_rls;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE
  aiphabee_core.raw_source_batch,
  aiphabee_core.data_version_batch,
  aiphabee_core.serving_dataset,
  aiphabee_core.serving_snapshot,
  aiphabee_core.serving_record
FROM aiphabee_runtime_rls;

DO $raw_schema_revoke$
DECLARE
  raw_schema record;
BEGIN
  FOR raw_schema IN
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'nq\_%' ESCAPE '\'
    ORDER BY schema_name
  LOOP
    EXECUTE format(
      'REVOKE ALL ON ALL TABLES IN SCHEMA %I FROM aiphabee_runtime_rls',
      raw_schema.schema_name
    );
    EXECUTE format(
      'REVOKE ALL ON SCHEMA %I FROM aiphabee_runtime_rls',
      raw_schema.schema_name
    );
  END LOOP;
END
$raw_schema_revoke$;

DO $role_readback$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'raw_source_batch',
    'data_version_batch',
    'serving_dataset',
    'serving_snapshot',
    'serving_record'
  ]
  LOOP
    IF NOT has_table_privilege(
      'aiphabee_runtime_rls',
      format('aiphabee_core.%I', target_table),
      'SELECT'
    ) THEN
      RAISE EXCEPTION 'Missing SELECT privilege on aiphabee_core.%', target_table;
    END IF;

    IF has_table_privilege(
      'aiphabee_runtime_rls',
      format('aiphabee_core.%I', target_table),
      'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
    ) THEN
      RAISE EXCEPTION 'Unexpected write privilege on aiphabee_core.%', target_table;
    END IF;
  END LOOP;

  IF has_schema_privilege('aiphabee_runtime_rls', 'aiphabee_core', 'CREATE') THEN
    RAISE EXCEPTION 'aiphabee_runtime_rls unexpectedly has CREATE on aiphabee_core';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name LIKE 'nq\_%' ESCAPE '\'
      AND has_schema_privilege('aiphabee_runtime_rls', schema_name, 'USAGE')
  ) THEN
    RAISE EXCEPTION 'aiphabee_runtime_rls unexpectedly has raw Netquity schema USAGE';
  END IF;
END
$role_readback$;

COMMIT;
