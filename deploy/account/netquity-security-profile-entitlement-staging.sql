-- Staging-only entitlement promotion for the security_profile dataset.
-- Adds Web field rights for the company-header profile RPC on top of the
-- existing invited-account chain provisioned by
-- deploy/account/authenticated-netquity-web-resolver-staging.sql (account,
-- workspace, subscription, product access, entitlement policy already exist
-- and are reused as-is by workspace_id/subscription_id below).

BEGIN;

DO $existing_workspace_preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM platform.workspace_subscription
    WHERE workspace_id = 'workspace_authenticated_netquity_staging'
      AND subscription_id = 'subscription_authenticated_netquity_staging'
      AND billing_state = 'active'
  ) THEN
    RAISE EXCEPTION 'expected the authenticated-netquity-web-resolver-staging workspace/subscription to already be provisioned';
  END IF;
END
$existing_workspace_preflight$;

WITH fields(field_pattern) AS (
  VALUES
    ('security_profile.currency'),
    ('security_profile.exchange'),
    ('security_profile.instrument_id'),
    ('security_profile.lifecycle.delisted_at'),
    ('security_profile.lifecycle.listed_at'),
    ('security_profile.lifecycle.suspended_at'),
    ('security_profile.listing_id'),
    ('security_profile.listing_status'),
    ('security_profile.market'),
    ('security_profile.name.en'),
    ('security_profile.name.zh_hans'),
    ('security_profile.name.zh_hant'),
    ('security_profile.symbol')
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
  'security_profile',
  'web',
  field_pattern,
  false,
  'approved',
  'netquity-collaboration-staging.v1',
  'netquity-security-profile-entitlement-staging:' || field_pattern
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
  '2026-07-15T00:00:00Z',
  'netquity-security-profile-entitlement-staging:workspace:' || entitlement.field_pattern
FROM aiphabee_governance.data_entitlement entitlement
WHERE entitlement.dataset = 'security_profile'
  AND entitlement.channel = 'web'
  AND entitlement.rights_policy_version = 'netquity-collaboration-staging.v1'
  AND entitlement.field_pattern = ANY (ARRAY[
    'security_profile.currency',
    'security_profile.exchange',
    'security_profile.instrument_id',
    'security_profile.lifecycle.delisted_at',
    'security_profile.lifecycle.listed_at',
    'security_profile.lifecycle.suspended_at',
    'security_profile.listing_id',
    'security_profile.listing_status',
    'security_profile.market',
    'security_profile.name.en',
    'security_profile.name.zh_hans',
    'security_profile.name.zh_hant',
    'security_profile.symbol'
  ])
ON CONFLICT DO NOTHING;

DO $provisioning_readback$
DECLARE
  approved_field_count integer;
BEGIN
  SELECT count(*)
  INTO approved_field_count
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = 'workspace_authenticated_netquity_staging'
    AND workspace_entitlement.subscription_id = 'subscription_authenticated_netquity_staging'
    AND workspace_entitlement.status = 'approved'
    AND data_entitlement.status = 'approved'
    AND data_entitlement.dataset = 'security_profile'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = 'netquity-collaboration-staging.v1';

  IF approved_field_count <> 13 THEN
    RAISE EXCEPTION 'security_profile staging entitlement readback failed: expected 13 approved fields, found %', approved_field_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM aiphabee_governance.data_entitlement
    WHERE rights_policy_version = 'netquity-collaboration-staging.v1'
      AND dataset = 'security_profile'
      AND channel IN ('api', 'mcp', 'export')
      AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'non-Web security_profile rights unexpectedly approved';
  END IF;
END
$provisioning_readback$;

COMMIT;
