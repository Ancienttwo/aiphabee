-- Staging-only entitlement promotion for the corporate_actions dataset.
-- Adds Web field rights for the corporate-actions RPC on top of the
-- existing invited-account chain provisioned by
-- deploy/account/authenticated-netquity-web-resolver-staging.sql (account,
-- workspace, subscription, product access, entitlement policy already exist
-- and are reused as-is by workspace_id/subscription_id below).
--
-- Unlike netquity-quote-snapshot-entitlement-staging.sql, this dataset's
-- rights_policy_version is 'netquity-collaboration-staging.v1' -- the same
-- value already used by security_master/security_profile/financial_facts
-- (see deploy/ingest/netquity-corporate-actions-staging.contract.json's
-- "rights_basis" for why): corporate actions are fundamental-domain data
-- covered by the original Netquity collaboration rights determination, not
-- a separately-confirmed market-data rights basis. The account's own
-- platform.workspace_product_access.policy_version already carries this
-- value (unchanged by this file), so the worker resolver
-- (apps/worker/src/authenticated-netquity-web-resolver.ts) can filter this
-- dataset's rights/snapshot queries by context.rights_policy_version, the
-- same as resolveProfile/resolveFinancialFacts.

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
    ('corporate_actions.actions.buyback'),
    ('corporate_actions.actions.consolidation'),
    ('corporate_actions.actions.dividend'),
    ('corporate_actions.actions.split'),
    ('corporate_actions.coverage.reason'),
    ('corporate_actions.coverage.status')
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
  'corporate_actions',
  'web',
  field_pattern,
  false,
  'approved',
  'netquity-collaboration-staging.v1',
  'netquity-corporate-actions-entitlement-staging:' || field_pattern
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
  'netquity-corporate-actions-entitlement-staging:workspace:' || entitlement.field_pattern
FROM aiphabee_governance.data_entitlement entitlement
WHERE entitlement.dataset = 'corporate_actions'
  AND entitlement.channel = 'web'
  AND entitlement.rights_policy_version = 'netquity-collaboration-staging.v1'
  AND entitlement.field_pattern = ANY (ARRAY[
    'corporate_actions.actions.buyback',
    'corporate_actions.actions.consolidation',
    'corporate_actions.actions.dividend',
    'corporate_actions.actions.split',
    'corporate_actions.coverage.reason',
    'corporate_actions.coverage.status'
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
    AND data_entitlement.dataset = 'corporate_actions'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = 'netquity-collaboration-staging.v1';

  IF approved_field_count <> 6 THEN
    RAISE EXCEPTION 'corporate_actions staging entitlement readback failed: expected 6 approved fields, found %', approved_field_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM aiphabee_governance.data_entitlement
    WHERE rights_policy_version = 'netquity-collaboration-staging.v1'
      AND dataset = 'corporate_actions'
      AND channel IN ('api', 'mcp', 'export')
      AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'non-Web corporate_actions rights unexpectedly approved';
  END IF;
END
$provisioning_readback$;

COMMIT;
