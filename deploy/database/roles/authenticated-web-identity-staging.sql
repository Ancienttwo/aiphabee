-- Least-privilege Better Auth staging role. PlanetScale authenticates this role
-- with the branch-qualified connection username
-- `aiphabee_auth_staging.v20dtpdoz3ik`; the database role remains unqualified.
-- Password assignment is managed out of band.

BEGIN;

DO $auth_role$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'aiphabee_auth_staging'
  ) THEN
    CREATE ROLE aiphabee_auth_staging
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      NOBYPASSRLS;
  END IF;
END
$auth_role$;

REVOKE ALL ON SCHEMA aiphabee_auth FROM PUBLIC;
GRANT USAGE ON SCHEMA aiphabee_auth TO aiphabee_auth_staging;
REVOKE CREATE ON SCHEMA aiphabee_auth FROM aiphabee_auth_staging;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  aiphabee_auth."user",
  aiphabee_auth."session",
  aiphabee_auth."account",
  aiphabee_auth."verification",
  aiphabee_auth."rateLimit"
TO aiphabee_auth_staging;

ALTER ROLE aiphabee_auth_staging
  SET search_path TO aiphabee_auth, pg_catalog;

DO $cross_schema_revoke$
DECLARE
  target_schema record;
BEGIN
  FOR target_schema IN
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name IN (
      'platform',
      'platform_audit',
      'aiphabee_core',
      'aiphabee_governance',
      'aiphabee_audit'
    ) OR schema_name LIKE 'nq\_%' ESCAPE '\'
  LOOP
    EXECUTE format(
      'REVOKE ALL ON ALL TABLES IN SCHEMA %I FROM aiphabee_auth_staging',
      target_schema.schema_name
    );
    EXECUTE format(
      'REVOKE ALL ON ALL SEQUENCES IN SCHEMA %I FROM aiphabee_auth_staging',
      target_schema.schema_name
    );
    EXECUTE format(
      'REVOKE ALL ON SCHEMA %I FROM aiphabee_auth_staging',
      target_schema.schema_name
    );
  END LOOP;
END
$cross_schema_revoke$;

DO $auth_role_readback$
DECLARE
  auth_table text;
  forbidden_object record;
  required_privilege text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_auth_members membership
    JOIN pg_roles member_role ON member_role.oid = membership.member
    WHERE member_role.rolname = 'aiphabee_auth_staging'
  ) THEN
    RAISE EXCEPTION 'aiphabee_auth_staging unexpectedly inherits another role';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'aiphabee_auth_staging'
      AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'aiphabee_auth_staging has an elevated role attribute';
  END IF;

  FOREACH auth_table IN ARRAY ARRAY[
    'user', 'session', 'account', 'verification', 'rateLimit'
  ]
  LOOP
    FOREACH required_privilege IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']
    LOOP
      IF NOT has_table_privilege(
        'aiphabee_auth_staging',
        format('aiphabee_auth.%I', auth_table),
        required_privilege
      ) THEN
        RAISE EXCEPTION 'missing Better Auth % privilege on %',
          required_privilege,
          auth_table;
      END IF;
    END LOOP;

    IF has_table_privilege(
      'aiphabee_auth_staging',
      format('aiphabee_auth.%I', auth_table),
      'TRUNCATE,REFERENCES,TRIGGER'
    ) THEN
      RAISE EXCEPTION 'unexpected elevated table privilege on %', auth_table;
    END IF;
  END LOOP;

  IF has_schema_privilege('aiphabee_auth_staging', 'aiphabee_auth', 'CREATE') THEN
    RAISE EXCEPTION 'aiphabee_auth_staging unexpectedly has schema CREATE';
  END IF;

  IF has_database_privilege(
    'aiphabee_auth_staging',
    current_database(),
    'CREATE'
  ) THEN
    RAISE EXCEPTION 'aiphabee_auth_staging unexpectedly has database CREATE';
  END IF;

  IF has_schema_privilege('aiphabee_auth_staging', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'aiphabee_auth_staging unexpectedly has public schema CREATE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE (
      schema_name IN (
        'platform',
        'platform_audit',
        'aiphabee_core',
        'aiphabee_governance',
        'aiphabee_audit'
      ) OR schema_name LIKE 'nq\_%' ESCAPE '\'
    )
      AND has_schema_privilege('aiphabee_auth_staging', schema_name, 'USAGE')
  ) THEN
    RAISE EXCEPTION 'aiphabee_auth_staging has cross-schema USAGE';
  END IF;

  FOR forbidden_object IN
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema IN (
      'platform',
      'platform_audit',
      'aiphabee_core',
      'aiphabee_governance',
      'aiphabee_audit'
    ) OR table_schema LIKE 'nq\_%' ESCAPE '\'
  LOOP
    IF has_table_privilege(
      'aiphabee_auth_staging',
      format('%I.%I', forbidden_object.table_schema, forbidden_object.table_name),
      'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
    ) THEN
      RAISE EXCEPTION 'aiphabee_auth_staging has cross-schema table privilege on %.%',
        forbidden_object.table_schema,
        forbidden_object.table_name;
    END IF;
  END LOOP;

  FOR forbidden_object IN
    SELECT sequence_schema, sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema IN (
      'platform',
      'platform_audit',
      'aiphabee_core',
      'aiphabee_governance',
      'aiphabee_audit'
    ) OR sequence_schema LIKE 'nq\_%' ESCAPE '\'
  LOOP
    IF has_sequence_privilege(
      'aiphabee_auth_staging',
      format('%I.%I', forbidden_object.sequence_schema, forbidden_object.sequence_name),
      'USAGE,SELECT,UPDATE'
    ) THEN
      RAISE EXCEPTION 'aiphabee_auth_staging has cross-schema sequence privilege on %.%',
        forbidden_object.sequence_schema,
        forbidden_object.sequence_name;
    END IF;
  END LOOP;
END
$auth_role_readback$;

COMMIT;
