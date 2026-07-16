-- Staging-only provisioning for the anonymous public read layer: a
-- dedicated platform.account + platform.workspace that is NOT tied to any
-- Better Auth user row. Its auth_subject is the fixed sentinel
-- 'better-auth:00000000-0000-4000-8000-000000000000', which passes
-- platform.resolve_active_account_id_by_auth_subject(text)'s canonical
-- Better Auth subject regex
-- (deploy/database/migrations/20260711054300_authenticated_netquity_web_resolver.sql)
-- the exact same way any other 'better-auth:<uuid>' subject would. Every
-- resolver in apps/worker/src/authenticated-netquity-web-resolver.ts
-- therefore resolves and gates this account with zero resolver code
-- changes: the resolver never branches on "is this the public account", it
-- only reacts to what the SECURITY DEFINER function and the entitlement
-- tables return for whatever authSubject it was called with. There is no
-- corresponding aiphabee_auth."user" row for this sentinel and none is
-- required -- the resolver never queries aiphabee_auth.
--
-- Unlike authenticated-netquity-web-resolver-staging.sql, this file does
-- NOT create platform.product / platform.subscription_plan /
-- platform.entitlement_policy: those are shared, already-active platform
-- singletons that authenticated-netquity-web-resolver-staging.sql already
-- provisions, and the preflight below fails closed if they are not already
-- active instead of silently re-provisioning them. This file also does NOT
-- insert any new aiphabee_governance.data_entitlement rows: it only grants
-- the new public workspace the SAME already-approved Web field rights the
-- 9 live Netquity datasets already carry (this file's own security_master
-- rows come from authenticated-netquity-web-resolver-staging.sql; the
-- other 8 datasets' rows come from the 8 netquity-*-entitlement-staging.sql
-- files), via one broad set-based aiphabee_governance.workspace_entitlement
-- INSERT keyed only on (channel, status, dataset IN (9), rights_policy_
-- version IN (2)) -- not one hand-enumerated field_pattern array per
-- dataset like those files use -- so any future field added to an
-- already-approved Web dataset/policy flows to the public workspace
-- automatically without touching this file again.
--
-- Admin channel, like authenticated-netquity-web-resolver-staging.sql: it
-- writes platform.* tables, and the netquity_serving_writer_staging role
-- (deploy/database/roles/netquity-serving-writer-staging.sql) only has
-- SELECT on platform.* -- its 4 governance INSERT/UPDATE/SELECT policies
-- are scoped to the shape the 8 entitlement-staging.sql files write (field
-- grants against the *existing* authenticated workspace/subscription IDs
-- baked into deploy/database/netquity-staging-promotions.contract.json's
-- rls_write_path trace), not to inserting a brand-new platform.account/
-- workspace/workspace_membership/workspace_subscription/
-- workspace_product_access chain or a new workspace_id's
-- workspace_entitlement rows. This file is therefore NOT added to that
-- contract's 16-file writer allowlist; it is applied the same way
-- authenticated-netquity-web-resolver-staging.sql is -- per prerequisite
-- (4) in that contract and deploy/database/roles/README-netquity-serving-
-- writer.md's Preconditions -- through the elevated staging admin
-- credential, as a separate manual ops step.

BEGIN;

DO $prerequisite_preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM platform.product
    WHERE product_id = 'aiphabee'
      AND product_code = 'aiphabee'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'AiphaBee product is not active -- apply authenticated-netquity-web-resolver-staging.sql first';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM platform.subscription_plan
    WHERE plan_code = 'pro' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'pro subscription plan is not active -- apply authenticated-netquity-web-resolver-staging.sql first';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM platform.entitlement_policy
    WHERE product_id = 'aiphabee'
      AND policy_version = 'netquity-collaboration-staging.v1'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'netquity-collaboration-staging.v1 entitlement policy is not active -- apply authenticated-netquity-web-resolver-staging.sql first';
  END IF;
END
$prerequisite_preflight$;

INSERT INTO platform.account (
  account_id,
  auth_subject,
  display_name,
  status
)
VALUES (
  'account_public_netquity_staging',
  'better-auth:00000000-0000-4000-8000-000000000000',
  'Public anonymous read account',
  'active'
)
ON CONFLICT DO NOTHING;

DO $account_state$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM platform.account
    WHERE account_id = 'account_public_netquity_staging'
      AND auth_subject = 'better-auth:00000000-0000-4000-8000-000000000000'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'public anonymous account did not converge';
  END IF;
END
$account_state$;

INSERT INTO platform.workspace (
  workspace_id,
  owner_account_id,
  display_name,
  billing_region,
  data_region,
  status
)
VALUES (
  'workspace_public_netquity_staging',
  'account_public_netquity_staging',
  'Public anonymous Netquity staging',
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
  'membership_public_netquity_staging',
  'workspace_public_netquity_staging',
  'account_public_netquity_staging',
  'owner',
  'active',
  '2026-07-16T00:00:00Z'
)
ON CONFLICT DO NOTHING;

-- plan_code reuses 'pro' (the same already-verified, already-active plan
-- authenticated-netquity-web-resolver-staging.sql provisions) rather than
-- introducing a new plan row: this account's field-level ceiling is set
-- entirely by which aiphabee_governance.workspace_entitlement rows exist
-- below, and reusing an already-live plan_code/seat_limit/credit_limit
-- shape lowers risk versus provisioning an unreviewed new one.
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
  'subscription_public_netquity_staging',
  'workspace_public_netquity_staging',
  'pro',
  'active',
  1,
  '2026-07-16T00:00:00Z',
  'netquity-public-anonymous-provisioning-staging:subscription'
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
  'product_access_public_netquity_staging',
  'workspace_public_netquity_staging',
  'aiphabee',
  'active',
  'netquity-collaboration-staging.v1',
  '2026-07-16T00:00:00Z'
)
ON CONFLICT DO NOTHING;

-- Broad set-based grant: link every currently-approved Web field right for
-- the 9 live Netquity datasets to the public workspace/subscription. This
-- reuses aiphabee_governance.data_entitlement rows created by
-- authenticated-netquity-web-resolver-staging.sql (security_master) and the
-- 8 netquity-*-entitlement-staging.sql files (the rest); it inserts no new
-- data_entitlement row and does not enumerate individual field_pattern
-- values.
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
  'workspace_public_' || entitlement.entitlement_id,
  'workspace_public_netquity_staging',
  'subscription_public_netquity_staging',
  entitlement.entitlement_id,
  'approved',
  '2026-07-16T00:00:00Z',
  'netquity-public-anonymous-provisioning-staging:workspace:' || entitlement.entitlement_id
FROM aiphabee_governance.data_entitlement entitlement
WHERE entitlement.channel = 'web'
  AND entitlement.status = 'approved'
  AND entitlement.dataset = ANY (ARRAY[
    'security_master',
    'security_profile',
    'financial_facts',
    'quote_snapshot',
    'corporate_actions',
    'sdi_disclosure',
    'directorate',
    'ownership',
    'related_warrants'
  ])
  AND entitlement.rights_policy_version = ANY (ARRAY[
    'netquity-collaboration-staging.v1',
    'netquity-market-data-staging.v1'
  ])
ON CONFLICT DO NOTHING;

DO $provisioning_readback$
DECLARE
  expected_field_count integer;
  public_field_count integer;
  public_dataset_count integer;
BEGIN
  SELECT count(*)
  INTO expected_field_count
  FROM aiphabee_governance.data_entitlement
  WHERE channel = 'web'
    AND status = 'approved'
    AND dataset = ANY (ARRAY[
      'security_master',
      'security_profile',
      'financial_facts',
      'quote_snapshot',
      'corporate_actions',
      'sdi_disclosure',
      'directorate',
      'ownership',
      'related_warrants'
    ])
    AND rights_policy_version = ANY (ARRAY[
      'netquity-collaboration-staging.v1',
      'netquity-market-data-staging.v1'
    ]);

  IF expected_field_count = 0 THEN
    RAISE EXCEPTION 'no approved Web field entitlements found for the 9 Netquity datasets -- apply authenticated-netquity-web-resolver-staging.sql and the 8 netquity-*-entitlement-staging.sql files first';
  END IF;

  SELECT count(*), count(DISTINCT data_entitlement.dataset)
  INTO public_field_count, public_dataset_count
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = 'workspace_public_netquity_staging'
    AND workspace_entitlement.subscription_id = 'subscription_public_netquity_staging'
    AND workspace_entitlement.status = 'approved'
    AND data_entitlement.status = 'approved'
    AND data_entitlement.channel = 'web';

  IF public_field_count <> expected_field_count OR public_dataset_count <> 9 THEN
    RAISE EXCEPTION 'public anonymous workspace entitlement readback failed: expected % approved Web fields across 9 datasets, found % fields across % datasets', expected_field_count, public_field_count, public_dataset_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM aiphabee_governance.workspace_entitlement workspace_entitlement
    JOIN aiphabee_governance.data_entitlement data_entitlement
      ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
    WHERE workspace_entitlement.workspace_id = 'workspace_public_netquity_staging'
      AND data_entitlement.channel IN ('api', 'mcp', 'export')
      AND data_entitlement.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'non-Web rights unexpectedly linked to the public anonymous workspace';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM aiphabee_governance.workspace_entitlement workspace_entitlement
    JOIN aiphabee_governance.data_entitlement data_entitlement
      ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
    WHERE workspace_entitlement.workspace_id = 'workspace_public_netquity_staging'
      AND data_entitlement.export_allowed = true
  ) THEN
    RAISE EXCEPTION 'export-allowed rights unexpectedly linked to the public anonymous workspace';
  END IF;
END
$provisioning_readback$;

COMMIT;
