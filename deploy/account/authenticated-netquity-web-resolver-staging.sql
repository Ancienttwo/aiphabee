-- Convergent staging-only provisioning for the single verified invited Better
-- Auth user. The raw subject is derived inside PostgreSQL and never returned.

BEGIN;

DO $verified_user_preflight$
DECLARE
  verified_user_count integer;
BEGIN
  SELECT count(*)
  INTO verified_user_count
  FROM aiphabee_auth."user"
  WHERE "emailVerified" = true;

  IF verified_user_count <> 1 THEN
    RAISE EXCEPTION 'expected exactly one verified Better Auth staging user';
  END IF;
END
$verified_user_preflight$;

INSERT INTO platform.product (
  product_id,
  product_code,
  display_name,
  status,
  default_schema_prefix
)
VALUES ('aiphabee', 'aiphabee', 'AiphaBee', 'active', 'aiphabee')
ON CONFLICT (product_code) DO UPDATE SET
  status = 'active',
  updated_at = now()
WHERE platform.product.status = 'planned';

DO $product_state$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM platform.product
    WHERE product_id = 'aiphabee'
      AND product_code = 'aiphabee'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'AiphaBee product is not active';
  END IF;
END
$product_state$;

INSERT INTO platform.subscription_plan (
  plan_code,
  plan_name,
  web_entitlement_tier,
  mcp_entitlement_tier,
  default_credit_limit,
  seat_limit,
  export_allowed_default,
  status,
  source_record_id
)
VALUES (
  'pro',
  'Pro',
  'security_master_exact',
  'default_deny',
  0,
  1,
  false,
  'active',
  'authenticated-netquity-web-resolver-staging:plan:pro'
)
ON CONFLICT (plan_code) DO UPDATE SET
  status = 'active',
  web_entitlement_tier = excluded.web_entitlement_tier,
  mcp_entitlement_tier = excluded.mcp_entitlement_tier,
  export_allowed_default = false,
  updated_at = now()
WHERE platform.subscription_plan.status = 'planned';

WITH verified_user AS (
  SELECT id
  FROM aiphabee_auth."user"
  WHERE "emailVerified" = true
)
INSERT INTO platform.account (
  account_id,
  auth_subject,
  display_name,
  status
)
SELECT
  'account_authenticated_netquity_staging',
  'better-auth:' || id::text,
  'Invited staging account',
  'active'
FROM verified_user
ON CONFLICT DO NOTHING;

DO $account_mapping$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM platform.account account
    JOIN aiphabee_auth."user" auth_user
      ON account.auth_subject = 'better-auth:' || auth_user.id::text
    WHERE account.account_id = 'account_authenticated_netquity_staging'
      AND account.status = 'active'
      AND auth_user."emailVerified" = true
  ) THEN
    RAISE EXCEPTION 'invited staging account mapping did not converge';
  END IF;
END
$account_mapping$;

INSERT INTO platform.workspace (
  workspace_id,
  owner_account_id,
  display_name,
  billing_region,
  data_region,
  status
)
VALUES (
  'workspace_authenticated_netquity_staging',
  'account_authenticated_netquity_staging',
  'Authenticated Netquity staging',
  'HK',
  'HK',
  'active'
)
ON CONFLICT (workspace_id) DO NOTHING;

INSERT INTO platform.workspace_membership (
  membership_id,
  workspace_id,
  account_id,
  role,
  status,
  valid_from
)
VALUES (
  'membership_authenticated_netquity_staging',
  'workspace_authenticated_netquity_staging',
  'account_authenticated_netquity_staging',
  'owner',
  'active',
  '2026-07-10T00:00:00Z'
)
ON CONFLICT DO NOTHING;

INSERT INTO platform.workspace_subscription (
  subscription_id,
  workspace_id,
  plan_code,
  billing_state,
  seats_purchased,
  valid_from,
  source_record_id
)
VALUES (
  'subscription_authenticated_netquity_staging',
  'workspace_authenticated_netquity_staging',
  'pro',
  'active',
  1,
  '2026-07-10T00:00:00Z',
  'authenticated-netquity-web-resolver-staging:subscription'
)
ON CONFLICT (subscription_id) DO NOTHING;

INSERT INTO platform.workspace_product_access (
  workspace_product_access_id,
  workspace_id,
  product_id,
  access_status,
  policy_version,
  valid_from
)
VALUES (
  'product_access_authenticated_netquity_staging',
  'workspace_authenticated_netquity_staging',
  'aiphabee',
  'active',
  'netquity-collaboration-staging.v1',
  '2026-07-10T00:00:00Z'
)
ON CONFLICT DO NOTHING;

INSERT INTO platform.entitlement_policy (
  entitlement_policy_id,
  product_id,
  policy_version,
  status,
  default_rights_status,
  source_ref,
  effective_from
)
VALUES (
  'entitlement_policy_authenticated_netquity_staging',
  'aiphabee',
  'netquity-collaboration-staging.v1',
  'active',
  'default_deny',
  'deploy/account/authenticated-netquity-web-resolver-staging.sql',
  '2026-07-10T00:00:00Z'
)
ON CONFLICT DO NOTHING;

WITH fields(field_pattern) AS (
  VALUES
    ('security_master.currency'),
    ('security_master.exchange'),
    ('security_master.instrument_id'),
    ('security_master.listing_id'),
    ('security_master.market'),
    ('security_master.match_reason'),
    ('security_master.name.en'),
    ('security_master.name.zh_hans'),
    ('security_master.name.zh_hant'),
    ('security_master.status'),
    ('security_master.symbol'),
    ('security_master.valid_from'),
    ('security_master.valid_to')
)
INSERT INTO aiphabee_governance.data_entitlement (
  entitlement_id,
  dataset,
  channel,
  field_pattern,
  export_allowed,
  status,
  rights_policy_version,
  source_record_id
)
SELECT
  'entitlement_authenticated_netquity_' || replace(field_pattern, '.', '_'),
  'security_master',
  'web',
  field_pattern,
  false,
  'approved',
  'netquity-collaboration-staging.v1',
  'authenticated-netquity-web-resolver-staging:' || field_pattern
FROM fields
ON CONFLICT (dataset, channel, field_pattern, rights_policy_version) DO UPDATE SET
  export_allowed = false,
  source_record_id = excluded.source_record_id,
  updated_at = now()
WHERE aiphabee_governance.data_entitlement.status = 'approved';

INSERT INTO aiphabee_governance.workspace_entitlement (
  workspace_entitlement_id,
  workspace_id,
  subscription_id,
  entitlement_id,
  status,
  valid_from,
  source_record_id
)
SELECT
  'workspace_' || entitlement.entitlement_id,
  'workspace_authenticated_netquity_staging',
  'subscription_authenticated_netquity_staging',
  entitlement.entitlement_id,
  'approved',
  '2026-07-10T00:00:00Z',
  'authenticated-netquity-web-resolver-staging:workspace:' || entitlement.field_pattern
FROM aiphabee_governance.data_entitlement entitlement
WHERE entitlement.dataset = 'security_master'
  AND entitlement.channel = 'web'
  AND entitlement.rights_policy_version = 'netquity-collaboration-staging.v1'
  AND entitlement.field_pattern = ANY (ARRAY[
    'security_master.currency',
    'security_master.exchange',
    'security_master.instrument_id',
    'security_master.listing_id',
    'security_master.market',
    'security_master.match_reason',
    'security_master.name.en',
    'security_master.name.zh_hans',
    'security_master.name.zh_hant',
    'security_master.status',
    'security_master.symbol',
    'security_master.valid_from',
    'security_master.valid_to'
  ])
ON CONFLICT DO NOTHING;

DO $provisioning_readback$
DECLARE
  approved_field_count integer;
  mapped_account_count integer;
BEGIN
  SELECT count(*)
  INTO mapped_account_count
  FROM platform.account
  WHERE account_id = 'account_authenticated_netquity_staging'
    AND status = 'active'
    AND auth_subject LIKE 'better-auth:%';

  SELECT count(*)
  INTO approved_field_count
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = 'workspace_authenticated_netquity_staging'
    AND workspace_entitlement.subscription_id = 'subscription_authenticated_netquity_staging'
    AND workspace_entitlement.status = 'approved'
    AND data_entitlement.status = 'approved'
    AND data_entitlement.dataset = 'security_master'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = 'netquity-collaboration-staging.v1';

  IF mapped_account_count <> 1 OR approved_field_count <> 13 THEN
    RAISE EXCEPTION 'authenticated Netquity staging provisioning readback failed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM aiphabee_governance.data_entitlement
    WHERE rights_policy_version = 'netquity-collaboration-staging.v1'
      AND dataset = 'security_master'
      AND channel IN ('api', 'mcp', 'export')
      AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'non-Web security_master rights unexpectedly approved';
  END IF;
END
$provisioning_readback$;

COMMIT;
