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
      LOGIN;
  END IF;
END
$netquity_role$;

ALTER ROLE netquity_staging
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT;

DO $netquity_grants$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'nq\_%' ESCAPE '\'
    ORDER BY schema_name
  LOOP
    EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC', item.schema_name);
    EXECUTE format(
      'GRANT USAGE ON SCHEMA %I TO netquity_staging',
      item.schema_name
    );
    EXECUTE format(
      'REVOKE ALL ON ALL TABLES IN SCHEMA %I FROM PUBLIC',
      item.schema_name
    );
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA %I TO netquity_staging',
      item.schema_name
    );
  END LOOP;
END
$netquity_grants$;

-- PlanetScale's Cloudflare integration role can create roles and own the mirror objects, but it
-- does not own the shared `postgres` database and therefore cannot rewrite database ACLs. The new
-- role receives no database-level CREATE grant here; CONNECT remains the platform's PUBLIC default.

ALTER ROLE netquity_staging SET search_path TO pg_catalog;

COMMIT;
