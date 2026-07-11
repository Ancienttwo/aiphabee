-- Least-privilege private Web resolver role extension for the existing
-- aiphabee_runtime_rls staging role. Released Serving SELECT authority remains
-- owned by netquity-security-serving-staging.sql; this packet adds only the
-- RLS-protected product context and entitlement reads needed before Serving.

BEGIN;

DO $role_preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'aiphabee_runtime_rls'
      AND NOT rolsuper
      AND NOT rolcreatedb
      AND NOT rolcreaterole
      AND NOT rolbypassrls
  ) THEN
    RAISE EXCEPTION 'aiphabee_runtime_rls is missing or elevated';
  END IF;
END
$role_preflight$;

GRANT USAGE ON SCHEMA platform, aiphabee_governance TO aiphabee_runtime_rls;
REVOKE CREATE ON SCHEMA platform, aiphabee_governance FROM aiphabee_runtime_rls;

GRANT EXECUTE ON FUNCTION
  platform.resolve_active_account_id_by_auth_subject(text)
TO aiphabee_runtime_rls;

GRANT SELECT ON TABLE
  platform.account,
  platform.workspace,
  platform.workspace_membership,
  platform.subscription_plan,
  platform.workspace_subscription,
  platform.product,
  platform.workspace_product_access,
  platform.entitlement_policy,
  aiphabee_governance.data_entitlement,
  aiphabee_governance.workspace_entitlement
TO aiphabee_runtime_rls;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE
  platform.account,
  platform.workspace,
  platform.workspace_membership,
  platform.subscription_plan,
  platform.workspace_subscription,
  platform.product,
  platform.workspace_product_access,
  platform.entitlement_policy,
  aiphabee_governance.data_entitlement,
  aiphabee_governance.workspace_entitlement
FROM aiphabee_runtime_rls;

DO $role_readback$
DECLARE
  required_privilege text;
  target_table text;
BEGIN
  IF has_function_privilege(
    'PUBLIC',
    'platform.resolve_active_account_id_by_auth_subject(text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'PUBLIC unexpectedly executes auth-subject resolver';
  END IF;

  IF NOT has_function_privilege(
    'aiphabee_runtime_rls',
    'platform.resolve_active_account_id_by_auth_subject(text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'runtime role cannot execute auth-subject resolver';
  END IF;

  FOREACH target_table IN ARRAY ARRAY[
    'platform.account',
    'platform.workspace',
    'platform.workspace_membership',
    'platform.subscription_plan',
    'platform.workspace_subscription',
    'platform.product',
    'platform.workspace_product_access',
    'platform.entitlement_policy',
    'aiphabee_governance.data_entitlement',
    'aiphabee_governance.workspace_entitlement'
  ]
  LOOP
    IF NOT has_table_privilege('aiphabee_runtime_rls', target_table, 'SELECT') THEN
      RAISE EXCEPTION 'runtime role lacks SELECT on %', target_table;
    END IF;

    FOREACH required_privilege IN ARRAY ARRAY[
      'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
    ]
    LOOP
      IF has_table_privilege(
        'aiphabee_runtime_rls',
        target_table,
        required_privilege
      ) THEN
        RAISE EXCEPTION 'runtime role has unexpected % on %',
          required_privilege,
          target_table;
      END IF;
    END LOOP;
  END LOOP;

  IF has_schema_privilege('aiphabee_runtime_rls', 'platform', 'CREATE')
    OR has_schema_privilege('aiphabee_runtime_rls', 'aiphabee_governance', 'CREATE')
  THEN
    RAISE EXCEPTION 'runtime role unexpectedly has schema CREATE';
  END IF;

  IF has_schema_privilege('aiphabee_runtime_rls', 'aiphabee_auth', 'USAGE') THEN
    RAISE EXCEPTION 'runtime role unexpectedly has Better Auth schema USAGE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name LIKE 'nq\_%' ESCAPE '\'
      AND has_schema_privilege('aiphabee_runtime_rls', schema_name, 'USAGE')
  ) THEN
    RAISE EXCEPTION 'runtime role unexpectedly has raw Netquity schema USAGE';
  END IF;
END
$role_readback$;

COMMIT;
