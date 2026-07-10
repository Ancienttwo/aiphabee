-- Private authenticated Netquity Web resolver authority.
-- The SECURITY DEFINER function exposes only one active account id for one
-- exact canonical Better Auth subject. It cannot list accounts or accept the
-- legacy auth_user_id shape.
-- Existing table rights remain default_deny; this migration grants no runtime
-- table privilege and creates no public data surface.

BEGIN;

CREATE OR REPLACE FUNCTION platform.resolve_active_account_id_by_auth_subject(
  requested_auth_subject text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT account.account_id
  FROM platform.account account
  WHERE requested_auth_subject ~
    '^better-auth:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND account.auth_subject = requested_auth_subject
    AND account.status = 'active'
  LIMIT 1
$function$;

REVOKE ALL ON FUNCTION
  platform.resolve_active_account_id_by_auth_subject(text)
FROM PUBLIC;

CREATE INDEX IF NOT EXISTS data_entitlement_web_dataset_status_field_idx
  ON aiphabee_governance.data_entitlement (
    dataset,
    channel,
    status,
    field_pattern
  );

CREATE INDEX IF NOT EXISTS governance_workspace_entitlement_runtime_idx
  ON aiphabee_governance.workspace_entitlement (
    workspace_id,
    subscription_id,
    status,
    valid_from,
    valid_to
  );

CREATE INDEX IF NOT EXISTS workspace_subscription_runtime_authority_idx
  ON platform.workspace_subscription (
    workspace_id,
    billing_state,
    valid_from,
    valid_to
  );

-- The authenticated Web path turns exact alias lookup into an interactive
-- query. Keep the JSONB containment predicate indexable inside released
-- snapshots instead of expanding every instrument alias array at runtime.
CREATE INDEX IF NOT EXISTS serving_record_security_aliases_gin_idx
  ON aiphabee_core.serving_record
  USING gin ((payload -> 'aliases') jsonb_path_ops)
  WHERE entity_type = 'instrument'
    AND quality_state = 'PASS';

COMMIT;
