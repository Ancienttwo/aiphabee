-- Dedicated FastClaw staging authority inside the shared PlanetScale database.
-- The password is rotated out-of-band; it must never be committed or echoed.

BEGIN;

DO $fastclaw_role$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'fastclaw_aiphabee_staging'
  ) THEN
    CREATE ROLE fastclaw_aiphabee_staging
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      NOBYPASSRLS;
  END IF;
END
$fastclaw_role$;

GRANT fastclaw_aiphabee_staging TO CURRENT_USER;

CREATE SCHEMA IF NOT EXISTS fastclaw_aiphabee
  AUTHORIZATION fastclaw_aiphabee_staging;
ALTER SCHEMA fastclaw_aiphabee OWNER TO fastclaw_aiphabee_staging;
REVOKE fastclaw_aiphabee_staging FROM CURRENT_USER;
REVOKE ALL ON SCHEMA fastclaw_aiphabee FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA fastclaw_aiphabee TO fastclaw_aiphabee_staging;

ALTER ROLE fastclaw_aiphabee_staging
  SET search_path TO fastclaw_aiphabee, pg_catalog;

REVOKE ALL ON SCHEMA platform FROM fastclaw_aiphabee_staging;
REVOKE ALL ON SCHEMA aiphabee_core FROM fastclaw_aiphabee_staging;
REVOKE ALL ON SCHEMA aiphabee_audit FROM fastclaw_aiphabee_staging;
REVOKE ALL ON SCHEMA devision FROM fastclaw_aiphabee_staging;
REVOKE ALL ON SCHEMA devision_drizzle FROM fastclaw_aiphabee_staging;
REVOKE ALL ON SCHEMA platform_audit FROM fastclaw_aiphabee_staging;

COMMIT;
