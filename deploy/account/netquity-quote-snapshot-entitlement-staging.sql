-- Staging-only entitlement promotion for the quote_snapshot dataset.
-- Adds Web field rights for the quote-snapshot RPC on top of the existing
-- invited-account chain provisioned by
-- deploy/account/authenticated-netquity-web-resolver-staging.sql (account,
-- workspace, subscription, product access, entitlement policy already exist
-- and are reused as-is by workspace_id/subscription_id below).
--
-- Unlike netquity-financial-facts-entitlement-staging.sql and
-- netquity-security-profile-entitlement-staging.sql, this dataset's
-- rights_policy_version is 'netquity-market-data-staging.v1' -- a distinct
-- value from 'netquity-collaboration-staging.v1' (see
-- deploy/ingest/netquity-quote-snapshot-staging.contract.json's
-- "rights_basis" for why). The account's own
-- platform.workspace_product_access.policy_version is NOT changed by this
-- file and stays 'netquity-collaboration-staging.v1': the worker resolver
-- (apps/worker/src/authenticated-netquity-web-resolver.ts) filters this
-- dataset's rights/snapshot queries by the hardcoded
-- NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION constant, not by the account
-- context's rights_policy_version, so no platform.* row needs to change and
-- the 3 already-shipped RPCs (resolveSecurity/resolveProfile/
-- resolveFinancialFacts) are unaffected.

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
    ('quote_snapshot.coverage.reason'),
    ('quote_snapshot.coverage.status'),
    ('quote_snapshot.quote.close'),
    ('quote_snapshot.quote.currency'),
    ('quote_snapshot.quote.high'),
    ('quote_snapshot.quote.low'),
    ('quote_snapshot.quote.open'),
    ('quote_snapshot.quote.sharesOutstanding'),
    ('quote_snapshot.quote.tradeDate'),
    ('quote_snapshot.quote.turnover'),
    ('quote_snapshot.quote.volume')
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
  'quote_snapshot',
  'web',
  field_pattern,
  false,
  'approved',
  'netquity-market-data-staging.v1',
  'netquity-quote-snapshot-entitlement-staging:' || field_pattern
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
  'netquity-quote-snapshot-entitlement-staging:workspace:' || entitlement.field_pattern
FROM aiphabee_governance.data_entitlement entitlement
WHERE entitlement.dataset = 'quote_snapshot'
  AND entitlement.channel = 'web'
  AND entitlement.rights_policy_version = 'netquity-market-data-staging.v1'
  AND entitlement.field_pattern = ANY (ARRAY[
    'quote_snapshot.coverage.reason',
    'quote_snapshot.coverage.status',
    'quote_snapshot.quote.close',
    'quote_snapshot.quote.currency',
    'quote_snapshot.quote.high',
    'quote_snapshot.quote.low',
    'quote_snapshot.quote.open',
    'quote_snapshot.quote.sharesOutstanding',
    'quote_snapshot.quote.tradeDate',
    'quote_snapshot.quote.turnover',
    'quote_snapshot.quote.volume'
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
    AND data_entitlement.dataset = 'quote_snapshot'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = 'netquity-market-data-staging.v1';

  IF approved_field_count <> 11 THEN
    RAISE EXCEPTION 'quote_snapshot staging entitlement readback failed: expected 11 approved fields, found %', approved_field_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM aiphabee_governance.data_entitlement
    WHERE rights_policy_version = 'netquity-market-data-staging.v1'
      AND dataset = 'quote_snapshot'
      AND channel IN ('api', 'mcp', 'export')
      AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'non-Web quote_snapshot rights unexpectedly approved';
  END IF;
END
$provisioning_readback$;

COMMIT;
