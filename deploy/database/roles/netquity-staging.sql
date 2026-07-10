-- Dedicated Netquity staging authority inside the shared PlanetScale database.
-- The password is set out-of-band and must never be committed or echoed.
-- Apply only after 20260709180000_netquity_mirror_schema.sql.

BEGIN;

DO $netquity_role$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'netquity_staging'
  ) THEN
    CREATE ROLE netquity_staging
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      NOBYPASSRLS;
  END IF;
END
$netquity_role$;

ALTER ROLE netquity_staging
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT
  NOBYPASSRLS;

GRANT netquity_staging TO CURRENT_USER;

DO $netquity_ownership$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'nq\_%' ESCAPE '\'
    ORDER BY schema_name
  LOOP
    EXECUTE format('ALTER SCHEMA %I OWNER TO netquity_staging', item.schema_name);
    EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC', item.schema_name);
    EXECUTE format(
      'GRANT USAGE, CREATE ON SCHEMA %I TO netquity_staging',
      item.schema_name
    );
  END LOOP;

  FOR item IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname LIKE 'nq\_%' ESCAPE '\'
    ORDER BY schemaname, tablename
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I OWNER TO netquity_staging',
      item.schemaname,
      item.tablename
    );
    EXECUTE format(
      'REVOKE ALL ON TABLE %I.%I FROM PUBLIC',
      item.schemaname,
      item.tablename
    );
  END LOOP;
END
$netquity_ownership$;

REVOKE netquity_staging FROM CURRENT_USER;
REVOKE ALL ON DATABASE postgres FROM netquity_staging;
GRANT CONNECT ON DATABASE postgres TO netquity_staging;

ALTER ROLE netquity_staging SET search_path TO pg_catalog;

COMMIT;
