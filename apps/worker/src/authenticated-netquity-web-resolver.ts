import {
  createPolicyFromEntitlementRows,
  evaluateDataAccessRequest,
  type DataEntitlementRow,
  type WorkspaceEntitlementRow,
  type WorkspaceSubscriptionRow,
} from "@aiphabee/data-access-gateway";
import {
  createErrorEnvelope,
  createSuccessEnvelope,
  type ErrorEnvelope,
  type ResponseEnvelope,
} from "@aiphabee/data-contracts";
import {
  ResolveLiveSecurityReadbackError,
  getLiveSecurityProfile,
  normalizeExactSecurityLookup,
  resolveLiveSecurityRows,
  type GetLiveSecurityProfileResult,
  type LiveSecurityProfileRow,
  type ResolveLiveSecurityResult,
  type ResolveLiveSecurityRow,
} from "@aiphabee/security-tools";
import {
  getLiveFinancialFacts,
  type GetLiveFinancialFactsResult,
  type LiveFinancialFactsRow,
} from "@aiphabee/financial-facts";
import {
  getLiveQuoteSnapshot,
  type GetLiveQuoteSnapshotResult,
  type LiveQuoteSnapshotRawRow,
} from "@aiphabee/market-data";
import {
  getLiveCorporateActions,
  type GetLiveCorporateActionsResult,
  type LiveCorporateActionsRow,
} from "@aiphabee/corporate-actions";
import {
  getLiveSdiDisclosures,
  type GetLiveSdiDisclosuresResult,
  type LiveSdiDisclosuresRow,
} from "@aiphabee/sdi-disclosure";
import {
  getLiveDirectorate,
  type GetLiveDirectorateResult,
  type LiveDirectorateRow,
} from "@aiphabee/directorate";
import {
  getLiveOwnership,
  type GetLiveOwnershipResult,
  type LiveOwnershipRow,
} from "@aiphabee/ownership";
import {
  getLiveRelatedWarrants,
  type GetLiveRelatedWarrantsResult,
  type LiveRelatedWarrantsRow,
} from "@aiphabee/related-warrants";
import {
  createLiveDerivedMetrics,
  type StockWorkbenchLiveDerivedMetrics,
} from "@aiphabee/workbench";
import { Client, type QueryResult } from "pg";

export const AUTHENTICATED_NETQUITY_WEB_RESOLVER_VERSION =
  "2026-07-11.authenticated-netquity-web-resolver.v1";
export const NETQUITY_SECURITY_RIGHTS_POLICY_VERSION =
  "netquity-collaboration-staging.v1";
// Distinct from NETQUITY_SECURITY_RIGHTS_POLICY_VERSION: market data was
// authorized under a separate rights determination (see
// deploy/ingest/netquity-quote-snapshot-staging.contract.json's
// "rights_basis"). The account's platform.workspace_product_access.policy_version
// stays 'netquity-collaboration-staging.v1' -- resolveQuoteSnapshot filters
// aiphabee_governance.data_entitlement / aiphabee_core.serving_dataset by this
// hardcoded constant instead of context.rights_policy_version, so no
// platform.* row needs to change and the 3 already-shipped RPCs
// (resolveSecurity/resolveProfile/resolveFinancialFacts) are unaffected.
export const NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION =
  "netquity-market-data-staging.v1";
export const AUTHENTICATED_NETQUITY_REQUIRED_FIELDS = [
  "security_master.currency",
  "security_master.exchange",
  "security_master.instrument_id",
  "security_master.listing_id",
  "security_master.market",
  "security_master.match_reason",
  "security_master.name.en",
  "security_master.name.zh_hans",
  "security_master.name.zh_hant",
  "security_master.status",
  "security_master.symbol",
  "security_master.valid_from",
  "security_master.valid_to",
] as const;
const AUTHENTICATED_NETQUITY_REQUIRED_FIELD_SET = new Set<string>(
  AUTHENTICATED_NETQUITY_REQUIRED_FIELDS,
);
export const AUTHENTICATED_NETQUITY_PROFILE_REQUIRED_FIELDS = [
  "security_profile.currency",
  "security_profile.exchange",
  "security_profile.instrument_id",
  "security_profile.lifecycle.delisted_at",
  "security_profile.lifecycle.listed_at",
  "security_profile.lifecycle.suspended_at",
  "security_profile.listing_id",
  "security_profile.listing_status",
  "security_profile.market",
  "security_profile.name.en",
  "security_profile.name.zh_hans",
  "security_profile.name.zh_hant",
  "security_profile.symbol",
] as const;
const AUTHENTICATED_NETQUITY_PROFILE_REQUIRED_FIELD_SET = new Set<string>(
  AUTHENTICATED_NETQUITY_PROFILE_REQUIRED_FIELDS,
);
export const AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS = [
  "financial_facts.coverage.reason",
  "financial_facts.coverage.status",
  "financial_facts.facts.assets",
  "financial_facts.facts.equity",
  "financial_facts.facts.liabilities",
  "financial_facts.facts.net_income",
  "financial_facts.facts.operating_cash_flow",
  "financial_facts.facts.revenue",
] as const;
const AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELD_SET = new Set<string>(
  AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS,
);
export const AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS = [
  "quote_snapshot.coverage.reason",
  "quote_snapshot.coverage.status",
  "quote_snapshot.quote.close",
  "quote_snapshot.quote.currency",
  "quote_snapshot.quote.high",
  "quote_snapshot.quote.low",
  "quote_snapshot.quote.open",
  "quote_snapshot.quote.sharesOutstanding",
  "quote_snapshot.quote.tradeDate",
  "quote_snapshot.quote.turnover",
  "quote_snapshot.quote.volume",
] as const;
const AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELD_SET = new Set<string>(
  AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS,
);
export const AUTHENTICATED_NETQUITY_CORPORATE_ACTIONS_REQUIRED_FIELDS = [
  "corporate_actions.actions.buyback",
  "corporate_actions.actions.consolidation",
  "corporate_actions.actions.dividend",
  "corporate_actions.actions.split",
  "corporate_actions.coverage.reason",
  "corporate_actions.coverage.status",
] as const;
const AUTHENTICATED_NETQUITY_CORPORATE_ACTIONS_REQUIRED_FIELD_SET = new Set<string>(
  AUTHENTICATED_NETQUITY_CORPORATE_ACTIONS_REQUIRED_FIELDS,
);
export const AUTHENTICATED_NETQUITY_SDI_DISCLOSURE_REQUIRED_FIELDS = [
  "sdi_disclosure.coverage.reason",
  "sdi_disclosure.coverage.status",
  "sdi_disclosure.disclosures.long",
  "sdi_disclosure.disclosures.pool",
  "sdi_disclosure.disclosures.short",
] as const;
const AUTHENTICATED_NETQUITY_SDI_DISCLOSURE_REQUIRED_FIELD_SET = new Set<string>(
  AUTHENTICATED_NETQUITY_SDI_DISCLOSURE_REQUIRED_FIELDS,
);
export const AUTHENTICATED_NETQUITY_DIRECTORATE_REQUIRED_FIELDS = [
  "directorate.coverage.reason",
  "directorate.coverage.status",
  "directorate.directors.profile",
  "directorate.directors.remuneration",
] as const;
const AUTHENTICATED_NETQUITY_DIRECTORATE_REQUIRED_FIELD_SET = new Set<string>(
  AUTHENTICATED_NETQUITY_DIRECTORATE_REQUIRED_FIELDS,
);
export const AUTHENTICATED_NETQUITY_OWNERSHIP_REQUIRED_FIELDS = [
  "ownership.coverage.reason",
  "ownership.coverage.status",
  "ownership.freeFloat",
  "ownership.holders.crossHolding",
  "ownership.holders.profile",
  "ownership.shareCapital",
] as const;
const AUTHENTICATED_NETQUITY_OWNERSHIP_REQUIRED_FIELD_SET = new Set<string>(
  AUTHENTICATED_NETQUITY_OWNERSHIP_REQUIRED_FIELDS,
);
export const AUTHENTICATED_NETQUITY_RELATED_WARRANTS_REQUIRED_FIELDS = [
  "related_warrants.coverage.reason",
  "related_warrants.coverage.status",
  "related_warrants.warrants",
] as const;
const AUTHENTICATED_NETQUITY_RELATED_WARRANTS_REQUIRED_FIELD_SET = new Set<string>(
  AUTHENTICATED_NETQUITY_RELATED_WARRANTS_REQUIRED_FIELDS,
);

const AUTH_SUBJECT_PATTERN =
  /^better-auth:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const MAX_INPUT_BYTES = 512;
const ACCOUNT_LOOKUP_QUERY = `
  SELECT platform.resolve_active_account_id_by_auth_subject($1) AS account_id
`;
const CONTEXT_QUERY = `
  SELECT DISTINCT
    membership.membership_id,
    membership.workspace_id,
    product_access.policy_version AS rights_policy_version,
    subscription.plan_code,
    subscription.subscription_id,
    subscription.valid_from AS subscription_valid_from,
    subscription.valid_to AS subscription_valid_to
  FROM platform.workspace_membership membership
  JOIN platform.workspace workspace
    ON workspace.workspace_id = membership.workspace_id
   AND workspace.status = 'active'
  JOIN platform.workspace_subscription subscription
    ON subscription.workspace_id = membership.workspace_id
   AND subscription.billing_state = 'active'
   AND subscription.valid_from <= now()
   AND (subscription.valid_to IS NULL OR subscription.valid_to > now())
  JOIN platform.subscription_plan plan
    ON plan.plan_code = subscription.plan_code
   AND plan.status = 'active'
  JOIN platform.product product
    ON product.product_code = 'aiphabee'
   AND product.status = 'active'
  JOIN platform.workspace_product_access product_access
    ON product_access.workspace_id = membership.workspace_id
   AND product_access.product_id = product.product_id
   AND product_access.access_status = 'active'
   AND product_access.valid_from <= now()
   AND (product_access.valid_to IS NULL OR product_access.valid_to > now())
  JOIN platform.entitlement_policy policy
    ON policy.product_id = product.product_id
   AND policy.policy_version = product_access.policy_version
   AND policy.status = 'active'
   AND policy.effective_from <= now()
  WHERE membership.account_id = $1
    AND membership.status = 'active'
    AND membership.valid_from <= now()
    AND (membership.valid_to IS NULL OR membership.valid_to > now())
  ORDER BY membership.workspace_id, subscription.subscription_id
`;
const RIGHTS_QUERY = `
  SELECT
    data_entitlement.channel,
    data_entitlement.dataset,
    data_entitlement.entitlement_id,
    data_entitlement.export_allowed,
    data_entitlement.field_pattern,
    data_entitlement.rights_policy_version,
    data_entitlement.source_record_id AS entitlement_source_record_id,
    data_entitlement.status AS entitlement_status,
    data_entitlement.time_range_days,
    workspace_entitlement.source_record_id AS workspace_source_record_id,
    workspace_entitlement.status AS workspace_status,
    workspace_entitlement.valid_from,
    workspace_entitlement.valid_to,
    workspace_entitlement.workspace_entitlement_id
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = $1
    AND workspace_entitlement.subscription_id = $2
    AND workspace_entitlement.subscription_id IS NOT NULL
    AND workspace_entitlement.valid_from <= now()
    AND (workspace_entitlement.valid_to IS NULL OR workspace_entitlement.valid_to > now())
    AND data_entitlement.dataset = 'security_master'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = $3
  ORDER BY data_entitlement.field_pattern, workspace_entitlement.workspace_entitlement_id
`;
const SNAPSHOT_QUERY = `
  SELECT
    snapshot.serving_snapshot_id,
    snapshot.data_version,
    snapshot.as_of
  FROM aiphabee_core.serving_dataset dataset
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_dataset_id = dataset.serving_dataset_id
  JOIN aiphabee_core.data_version_batch version
    ON version.data_version = snapshot.data_version
  WHERE dataset.dataset = 'security_master'
    AND dataset.default_rights_status = 'approved'
    AND dataset.rights_policy_version = $1
    AND snapshot.release_state = 'released'
    AND snapshot.quality_state = 'PASS'
    AND snapshot.rights_policy_version = $1
    AND version.release_state = 'released'
    AND version.rights_policy_version = $1
  ORDER BY snapshot.as_of DESC, snapshot.created_at DESC
  LIMIT 1
`;
const CANDIDATE_QUERY = `
  SELECT
    record.entity_id,
    record.source_record_id,
    snapshot.data_version,
    record.payload,
    matched_alias.reason AS match_reason
  FROM aiphabee_core.serving_record record
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_snapshot_id = record.serving_snapshot_id
  CROSS JOIN LATERAL (
    SELECT alias.value ->> 'reason' AS reason
    FROM jsonb_array_elements(record.payload -> 'aliases') AS alias(value)
    WHERE alias.value ->> 'value' = $2
    ORDER BY alias.value ->> 'reason'
    LIMIT 1
  ) matched_alias
  WHERE record.serving_snapshot_id = $1
    AND record.entity_type = 'instrument'
    AND record.quality_state = 'PASS'
    AND (record.payload -> 'aliases') @>
      jsonb_build_array(jsonb_build_object('value', $2::text))
    AND ($3::text IS NULL OR record.payload ->> 'market' = $3)
  ORDER BY record.entity_id ASC
  LIMIT 26
`;
const PROFILE_RIGHTS_QUERY = `
  SELECT
    data_entitlement.channel,
    data_entitlement.dataset,
    data_entitlement.entitlement_id,
    data_entitlement.export_allowed,
    data_entitlement.field_pattern,
    data_entitlement.rights_policy_version,
    data_entitlement.source_record_id AS entitlement_source_record_id,
    data_entitlement.status AS entitlement_status,
    data_entitlement.time_range_days,
    workspace_entitlement.source_record_id AS workspace_source_record_id,
    workspace_entitlement.status AS workspace_status,
    workspace_entitlement.valid_from,
    workspace_entitlement.valid_to,
    workspace_entitlement.workspace_entitlement_id
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = $1
    AND workspace_entitlement.subscription_id = $2
    AND workspace_entitlement.subscription_id IS NOT NULL
    AND workspace_entitlement.valid_from <= now()
    AND (workspace_entitlement.valid_to IS NULL OR workspace_entitlement.valid_to > now())
    AND data_entitlement.dataset = 'security_profile'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = $3
  ORDER BY data_entitlement.field_pattern, workspace_entitlement.workspace_entitlement_id
`;
const PROFILE_SNAPSHOT_QUERY = `
  SELECT
    snapshot.serving_snapshot_id,
    snapshot.data_version,
    snapshot.as_of
  FROM aiphabee_core.serving_dataset dataset
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_dataset_id = dataset.serving_dataset_id
  JOIN aiphabee_core.data_version_batch version
    ON version.data_version = snapshot.data_version
  WHERE dataset.dataset = 'security_profile'
    AND dataset.default_rights_status = 'approved'
    AND dataset.rights_policy_version = $1
    AND snapshot.release_state = 'released'
    AND snapshot.quality_state = 'PASS'
    AND snapshot.rights_policy_version = $1
    AND version.release_state = 'released'
    AND version.rights_policy_version = $1
  ORDER BY snapshot.as_of DESC, snapshot.created_at DESC
  LIMIT 1
`;
// LIMIT 2 (not 1): a second row would mean the exact entity_id lookup
// matched more than one released record, a data integrity failure that
// getLiveSecurityProfile must reject rather than silently narrow to one row.
const PROFILE_RECORD_QUERY = `
  SELECT
    record.entity_id,
    record.source_record_id,
    snapshot.data_version,
    record.payload
  FROM aiphabee_core.serving_record record
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_snapshot_id = record.serving_snapshot_id
  WHERE record.serving_snapshot_id = $1
    AND record.entity_type = 'instrument'
    AND record.quality_state = 'PASS'
    AND record.entity_id = $2
  LIMIT 2
`;
const FINANCIAL_FACTS_RIGHTS_QUERY = `
  SELECT
    data_entitlement.channel,
    data_entitlement.dataset,
    data_entitlement.entitlement_id,
    data_entitlement.export_allowed,
    data_entitlement.field_pattern,
    data_entitlement.rights_policy_version,
    data_entitlement.source_record_id AS entitlement_source_record_id,
    data_entitlement.status AS entitlement_status,
    data_entitlement.time_range_days,
    workspace_entitlement.source_record_id AS workspace_source_record_id,
    workspace_entitlement.status AS workspace_status,
    workspace_entitlement.valid_from,
    workspace_entitlement.valid_to,
    workspace_entitlement.workspace_entitlement_id
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = $1
    AND workspace_entitlement.subscription_id = $2
    AND workspace_entitlement.subscription_id IS NOT NULL
    AND workspace_entitlement.valid_from <= now()
    AND (workspace_entitlement.valid_to IS NULL OR workspace_entitlement.valid_to > now())
    AND data_entitlement.dataset = 'financial_facts'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = $3
  ORDER BY data_entitlement.field_pattern, workspace_entitlement.workspace_entitlement_id
`;
const FINANCIAL_FACTS_SNAPSHOT_QUERY = `
  SELECT
    snapshot.serving_snapshot_id,
    snapshot.data_version,
    snapshot.as_of
  FROM aiphabee_core.serving_dataset dataset
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_dataset_id = dataset.serving_dataset_id
  JOIN aiphabee_core.data_version_batch version
    ON version.data_version = snapshot.data_version
  WHERE dataset.dataset = 'financial_facts'
    AND dataset.default_rights_status = 'approved'
    AND dataset.rights_policy_version = $1
    AND snapshot.release_state = 'released'
    AND snapshot.quality_state = 'PASS'
    AND snapshot.rights_policy_version = $1
    AND version.release_state = 'released'
    AND version.rights_policy_version = $1
  ORDER BY snapshot.as_of DESC, snapshot.created_at DESC
  LIMIT 1
`;
// LIMIT 2 (not 1): a second row would mean the exact entity_id lookup
// matched more than one released record, a data integrity failure that
// getLiveFinancialFacts must reject rather than silently narrow to one row.
const FINANCIAL_FACTS_RECORD_QUERY = `
  SELECT
    record.entity_id,
    record.source_record_id,
    snapshot.data_version,
    record.payload
  FROM aiphabee_core.serving_record record
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_snapshot_id = record.serving_snapshot_id
  WHERE record.serving_snapshot_id = $1
    AND record.entity_type = 'instrument'
    AND record.quality_state = 'PASS'
    AND record.entity_id = $2
  LIMIT 2
`;
// $3 here is always NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION (a hardcoded
// constant), never context.rights_policy_version -- see the constant's
// comment for why.
const QUOTE_SNAPSHOT_RIGHTS_QUERY = `
  SELECT
    data_entitlement.channel,
    data_entitlement.dataset,
    data_entitlement.entitlement_id,
    data_entitlement.export_allowed,
    data_entitlement.field_pattern,
    data_entitlement.rights_policy_version,
    data_entitlement.source_record_id AS entitlement_source_record_id,
    data_entitlement.status AS entitlement_status,
    data_entitlement.time_range_days,
    workspace_entitlement.source_record_id AS workspace_source_record_id,
    workspace_entitlement.status AS workspace_status,
    workspace_entitlement.valid_from,
    workspace_entitlement.valid_to,
    workspace_entitlement.workspace_entitlement_id
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = $1
    AND workspace_entitlement.subscription_id = $2
    AND workspace_entitlement.subscription_id IS NOT NULL
    AND workspace_entitlement.valid_from <= now()
    AND (workspace_entitlement.valid_to IS NULL OR workspace_entitlement.valid_to > now())
    AND data_entitlement.dataset = 'quote_snapshot'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = $3
  ORDER BY data_entitlement.field_pattern, workspace_entitlement.workspace_entitlement_id
`;
// $1 here is always NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION, never
// context.rights_policy_version -- same reasoning as QUOTE_SNAPSHOT_RIGHTS_QUERY.
const QUOTE_SNAPSHOT_SNAPSHOT_QUERY = `
  SELECT
    snapshot.serving_snapshot_id,
    snapshot.data_version,
    snapshot.as_of
  FROM aiphabee_core.serving_dataset dataset
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_dataset_id = dataset.serving_dataset_id
  JOIN aiphabee_core.data_version_batch version
    ON version.data_version = snapshot.data_version
  WHERE dataset.dataset = 'quote_snapshot'
    AND dataset.default_rights_status = 'approved'
    AND dataset.rights_policy_version = $1
    AND snapshot.release_state = 'released'
    AND snapshot.quality_state = 'PASS'
    AND snapshot.rights_policy_version = $1
    AND version.release_state = 'released'
    AND version.rights_policy_version = $1
  ORDER BY snapshot.as_of DESC, snapshot.created_at DESC
  LIMIT 1
`;
// LIMIT 2 (not 1): a second row would mean the exact entity_id lookup
// matched more than one released record, a data integrity failure that
// getLiveQuoteSnapshot must reject rather than silently narrow to one row.
const QUOTE_SNAPSHOT_RECORD_QUERY = `
  SELECT
    record.entity_id,
    record.source_record_id,
    snapshot.data_version,
    record.payload
  FROM aiphabee_core.serving_record record
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_snapshot_id = record.serving_snapshot_id
  WHERE record.serving_snapshot_id = $1
    AND record.entity_type = 'instrument'
    AND record.quality_state = 'PASS'
    AND record.entity_id = $2
  LIMIT 2
`;
const CORPORATE_ACTIONS_RIGHTS_QUERY = `
  SELECT
    data_entitlement.channel,
    data_entitlement.dataset,
    data_entitlement.entitlement_id,
    data_entitlement.export_allowed,
    data_entitlement.field_pattern,
    data_entitlement.rights_policy_version,
    data_entitlement.source_record_id AS entitlement_source_record_id,
    data_entitlement.status AS entitlement_status,
    data_entitlement.time_range_days,
    workspace_entitlement.source_record_id AS workspace_source_record_id,
    workspace_entitlement.status AS workspace_status,
    workspace_entitlement.valid_from,
    workspace_entitlement.valid_to,
    workspace_entitlement.workspace_entitlement_id
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = $1
    AND workspace_entitlement.subscription_id = $2
    AND workspace_entitlement.subscription_id IS NOT NULL
    AND workspace_entitlement.valid_from <= now()
    AND (workspace_entitlement.valid_to IS NULL OR workspace_entitlement.valid_to > now())
    AND data_entitlement.dataset = 'corporate_actions'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = $3
  ORDER BY data_entitlement.field_pattern, workspace_entitlement.workspace_entitlement_id
`;
const CORPORATE_ACTIONS_SNAPSHOT_QUERY = `
  SELECT
    snapshot.serving_snapshot_id,
    snapshot.data_version,
    snapshot.as_of
  FROM aiphabee_core.serving_dataset dataset
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_dataset_id = dataset.serving_dataset_id
  JOIN aiphabee_core.data_version_batch version
    ON version.data_version = snapshot.data_version
  WHERE dataset.dataset = 'corporate_actions'
    AND dataset.default_rights_status = 'approved'
    AND dataset.rights_policy_version = $1
    AND snapshot.release_state = 'released'
    AND snapshot.quality_state = 'PASS'
    AND snapshot.rights_policy_version = $1
    AND version.release_state = 'released'
    AND version.rights_policy_version = $1
  ORDER BY snapshot.as_of DESC, snapshot.created_at DESC
  LIMIT 1
`;
// LIMIT 2 (not 1): a second row would mean the exact entity_id lookup
// matched more than one released record, a data integrity failure that
// getLiveCorporateActions must reject rather than silently narrow to one row.
const CORPORATE_ACTIONS_RECORD_QUERY = `
  SELECT
    record.entity_id,
    record.source_record_id,
    snapshot.data_version,
    record.payload
  FROM aiphabee_core.serving_record record
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_snapshot_id = record.serving_snapshot_id
  WHERE record.serving_snapshot_id = $1
    AND record.entity_type = 'instrument'
    AND record.quality_state = 'PASS'
    AND record.entity_id = $2
  LIMIT 2
`;
const SDI_DISCLOSURE_RIGHTS_QUERY = `
  SELECT
    data_entitlement.channel,
    data_entitlement.dataset,
    data_entitlement.entitlement_id,
    data_entitlement.export_allowed,
    data_entitlement.field_pattern,
    data_entitlement.rights_policy_version,
    data_entitlement.source_record_id AS entitlement_source_record_id,
    data_entitlement.status AS entitlement_status,
    data_entitlement.time_range_days,
    workspace_entitlement.source_record_id AS workspace_source_record_id,
    workspace_entitlement.status AS workspace_status,
    workspace_entitlement.valid_from,
    workspace_entitlement.valid_to,
    workspace_entitlement.workspace_entitlement_id
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = $1
    AND workspace_entitlement.subscription_id = $2
    AND workspace_entitlement.subscription_id IS NOT NULL
    AND workspace_entitlement.valid_from <= now()
    AND (workspace_entitlement.valid_to IS NULL OR workspace_entitlement.valid_to > now())
    AND data_entitlement.dataset = 'sdi_disclosure'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = $3
  ORDER BY data_entitlement.field_pattern, workspace_entitlement.workspace_entitlement_id
`;
const SDI_DISCLOSURE_SNAPSHOT_QUERY = `
  SELECT
    snapshot.serving_snapshot_id,
    snapshot.data_version,
    snapshot.as_of
  FROM aiphabee_core.serving_dataset dataset
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_dataset_id = dataset.serving_dataset_id
  JOIN aiphabee_core.data_version_batch version
    ON version.data_version = snapshot.data_version
  WHERE dataset.dataset = 'sdi_disclosure'
    AND dataset.default_rights_status = 'approved'
    AND dataset.rights_policy_version = $1
    AND snapshot.release_state = 'released'
    AND snapshot.quality_state = 'PASS'
    AND snapshot.rights_policy_version = $1
    AND version.release_state = 'released'
    AND version.rights_policy_version = $1
  ORDER BY snapshot.as_of DESC, snapshot.created_at DESC
  LIMIT 1
`;
// LIMIT 2 (not 1): a second row would mean the exact entity_id lookup
// matched more than one released record, a data integrity failure that
// getLiveSdiDisclosures must reject rather than silently narrow to one row.
const SDI_DISCLOSURE_RECORD_QUERY = `
  SELECT
    record.entity_id,
    record.source_record_id,
    snapshot.data_version,
    record.payload
  FROM aiphabee_core.serving_record record
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_snapshot_id = record.serving_snapshot_id
  WHERE record.serving_snapshot_id = $1
    AND record.entity_type = 'instrument'
    AND record.quality_state = 'PASS'
    AND record.entity_id = $2
  LIMIT 2
`;
const DIRECTORATE_RIGHTS_QUERY = `
  SELECT
    data_entitlement.channel,
    data_entitlement.dataset,
    data_entitlement.entitlement_id,
    data_entitlement.export_allowed,
    data_entitlement.field_pattern,
    data_entitlement.rights_policy_version,
    data_entitlement.source_record_id AS entitlement_source_record_id,
    data_entitlement.status AS entitlement_status,
    data_entitlement.time_range_days,
    workspace_entitlement.source_record_id AS workspace_source_record_id,
    workspace_entitlement.status AS workspace_status,
    workspace_entitlement.valid_from,
    workspace_entitlement.valid_to,
    workspace_entitlement.workspace_entitlement_id
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = $1
    AND workspace_entitlement.subscription_id = $2
    AND workspace_entitlement.subscription_id IS NOT NULL
    AND workspace_entitlement.valid_from <= now()
    AND (workspace_entitlement.valid_to IS NULL OR workspace_entitlement.valid_to > now())
    AND data_entitlement.dataset = 'directorate'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = $3
  ORDER BY data_entitlement.field_pattern, workspace_entitlement.workspace_entitlement_id
`;
const DIRECTORATE_SNAPSHOT_QUERY = `
  SELECT
    snapshot.serving_snapshot_id,
    snapshot.data_version,
    snapshot.as_of
  FROM aiphabee_core.serving_dataset dataset
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_dataset_id = dataset.serving_dataset_id
  JOIN aiphabee_core.data_version_batch version
    ON version.data_version = snapshot.data_version
  WHERE dataset.dataset = 'directorate'
    AND dataset.default_rights_status = 'approved'
    AND dataset.rights_policy_version = $1
    AND snapshot.release_state = 'released'
    AND snapshot.quality_state = 'PASS'
    AND snapshot.rights_policy_version = $1
    AND version.release_state = 'released'
    AND version.rights_policy_version = $1
  ORDER BY snapshot.as_of DESC, snapshot.created_at DESC
  LIMIT 1
`;
// LIMIT 2 (not 1): a second row would mean the exact entity_id lookup
// matched more than one released record, a data integrity failure that
// getLiveDirectorate must reject rather than silently narrow to one row.
const DIRECTORATE_RECORD_QUERY = `
  SELECT
    record.entity_id,
    record.source_record_id,
    snapshot.data_version,
    record.payload
  FROM aiphabee_core.serving_record record
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_snapshot_id = record.serving_snapshot_id
  WHERE record.serving_snapshot_id = $1
    AND record.entity_type = 'instrument'
    AND record.quality_state = 'PASS'
    AND record.entity_id = $2
  LIMIT 2
`;
const OWNERSHIP_RIGHTS_QUERY = `
  SELECT
    data_entitlement.channel,
    data_entitlement.dataset,
    data_entitlement.entitlement_id,
    data_entitlement.export_allowed,
    data_entitlement.field_pattern,
    data_entitlement.rights_policy_version,
    data_entitlement.source_record_id AS entitlement_source_record_id,
    data_entitlement.status AS entitlement_status,
    data_entitlement.time_range_days,
    workspace_entitlement.source_record_id AS workspace_source_record_id,
    workspace_entitlement.status AS workspace_status,
    workspace_entitlement.valid_from,
    workspace_entitlement.valid_to,
    workspace_entitlement.workspace_entitlement_id
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = $1
    AND workspace_entitlement.subscription_id = $2
    AND workspace_entitlement.subscription_id IS NOT NULL
    AND workspace_entitlement.valid_from <= now()
    AND (workspace_entitlement.valid_to IS NULL OR workspace_entitlement.valid_to > now())
    AND data_entitlement.dataset = 'ownership'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = $3
  ORDER BY data_entitlement.field_pattern, workspace_entitlement.workspace_entitlement_id
`;
const OWNERSHIP_SNAPSHOT_QUERY = `
  SELECT
    snapshot.serving_snapshot_id,
    snapshot.data_version,
    snapshot.as_of
  FROM aiphabee_core.serving_dataset dataset
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_dataset_id = dataset.serving_dataset_id
  JOIN aiphabee_core.data_version_batch version
    ON version.data_version = snapshot.data_version
  WHERE dataset.dataset = 'ownership'
    AND dataset.default_rights_status = 'approved'
    AND dataset.rights_policy_version = $1
    AND snapshot.release_state = 'released'
    AND snapshot.quality_state = 'PASS'
    AND snapshot.rights_policy_version = $1
    AND version.release_state = 'released'
    AND version.rights_policy_version = $1
  ORDER BY snapshot.as_of DESC, snapshot.created_at DESC
  LIMIT 1
`;
// LIMIT 2 (not 1): a second row would mean the exact entity_id lookup
// matched more than one released record, a data integrity failure that
// getLiveOwnership must reject rather than silently narrow to one row.
const OWNERSHIP_RECORD_QUERY = `
  SELECT
    record.entity_id,
    record.source_record_id,
    snapshot.data_version,
    record.payload
  FROM aiphabee_core.serving_record record
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_snapshot_id = record.serving_snapshot_id
  WHERE record.serving_snapshot_id = $1
    AND record.entity_type = 'instrument'
    AND record.quality_state = 'PASS'
    AND record.entity_id = $2
  LIMIT 2
`;
const RELATED_WARRANTS_RIGHTS_QUERY = `
  SELECT
    data_entitlement.channel,
    data_entitlement.dataset,
    data_entitlement.entitlement_id,
    data_entitlement.export_allowed,
    data_entitlement.field_pattern,
    data_entitlement.rights_policy_version,
    data_entitlement.source_record_id AS entitlement_source_record_id,
    data_entitlement.status AS entitlement_status,
    data_entitlement.time_range_days,
    workspace_entitlement.source_record_id AS workspace_source_record_id,
    workspace_entitlement.status AS workspace_status,
    workspace_entitlement.valid_from,
    workspace_entitlement.valid_to,
    workspace_entitlement.workspace_entitlement_id
  FROM aiphabee_governance.workspace_entitlement workspace_entitlement
  JOIN aiphabee_governance.data_entitlement data_entitlement
    ON data_entitlement.entitlement_id = workspace_entitlement.entitlement_id
  WHERE workspace_entitlement.workspace_id = $1
    AND workspace_entitlement.subscription_id = $2
    AND workspace_entitlement.subscription_id IS NOT NULL
    AND workspace_entitlement.valid_from <= now()
    AND (workspace_entitlement.valid_to IS NULL OR workspace_entitlement.valid_to > now())
    AND data_entitlement.dataset = 'related_warrants'
    AND data_entitlement.channel = 'web'
    AND data_entitlement.rights_policy_version = $3
  ORDER BY data_entitlement.field_pattern, workspace_entitlement.workspace_entitlement_id
`;
const RELATED_WARRANTS_SNAPSHOT_QUERY = `
  SELECT
    snapshot.serving_snapshot_id,
    snapshot.data_version,
    snapshot.as_of
  FROM aiphabee_core.serving_dataset dataset
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_dataset_id = dataset.serving_dataset_id
  JOIN aiphabee_core.data_version_batch version
    ON version.data_version = snapshot.data_version
  WHERE dataset.dataset = 'related_warrants'
    AND dataset.default_rights_status = 'approved'
    AND dataset.rights_policy_version = $1
    AND snapshot.release_state = 'released'
    AND snapshot.quality_state = 'PASS'
    AND snapshot.rights_policy_version = $1
    AND version.release_state = 'released'
    AND version.rights_policy_version = $1
  ORDER BY snapshot.as_of DESC, snapshot.created_at DESC
  LIMIT 1
`;
// LIMIT 2 (not 1): a second row would mean the exact entity_id lookup
// matched more than one released record, a data integrity failure that
// getLiveRelatedWarrants must reject rather than silently narrow to one row.
const RELATED_WARRANTS_RECORD_QUERY = `
  SELECT
    record.entity_id,
    record.source_record_id,
    snapshot.data_version,
    record.payload
  FROM aiphabee_core.serving_record record
  JOIN aiphabee_core.serving_snapshot snapshot
    ON snapshot.serving_snapshot_id = record.serving_snapshot_id
  WHERE record.serving_snapshot_id = $1
    AND record.entity_type = 'instrument'
    AND record.quality_state = 'PASS'
    AND record.entity_id = $2
  LIMIT 2
`;

export interface AuthenticatedNetquityResolverBindings {
  AIPHABEE_HYPERDRIVE?: { connectionString?: string };
  APP_ENV?: string;
}

export interface AuthenticatedNetquityResolverInput {
  authSubject: string;
  market?: string;
  query: string;
  requestId: string;
}

export interface AuthenticatedNetquityResolverRpcResult {
  envelope: ResponseEnvelope<ResolveLiveSecurityResult>;
  status: 200 | 400 | 403 | 404 | 409 | 424 | 500;
}

export interface AuthenticatedNetquityProfileResolverInput {
  authSubject: string;
  instrumentId: string;
  requestId: string;
}

export interface AuthenticatedNetquityProfileResolverRpcResult {
  envelope: ResponseEnvelope<GetLiveSecurityProfileResult>;
  status: 200 | 400 | 403 | 404 | 409 | 424 | 500;
}

export interface AuthenticatedNetquityFinancialFactsResolverInput {
  authSubject: string;
  instrumentId: string;
  requestId: string;
}

export interface AuthenticatedNetquityFinancialFactsResolverRpcResult {
  envelope: ResponseEnvelope<GetLiveFinancialFactsResult>;
  status: 200 | 400 | 403 | 404 | 409 | 424 | 500;
}

export interface AuthenticatedNetquityQuoteSnapshotResolverInput {
  authSubject: string;
  instrumentId: string;
  requestId: string;
}

export interface AuthenticatedNetquityQuoteSnapshotResolverRpcResult {
  envelope: ResponseEnvelope<GetLiveQuoteSnapshotResult>;
  status: 200 | 400 | 403 | 404 | 409 | 424 | 500;
}

export interface AuthenticatedNetquityCorporateActionsResolverInput {
  authSubject: string;
  instrumentId: string;
  requestId: string;
}

export interface AuthenticatedNetquityCorporateActionsResolverRpcResult {
  envelope: ResponseEnvelope<GetLiveCorporateActionsResult>;
  status: 200 | 400 | 403 | 404 | 409 | 424 | 500;
}

export interface AuthenticatedNetquitySdiDisclosureResolverInput {
  authSubject: string;
  instrumentId: string;
  requestId: string;
}

export interface AuthenticatedNetquitySdiDisclosureResolverRpcResult {
  envelope: ResponseEnvelope<GetLiveSdiDisclosuresResult>;
  status: 200 | 400 | 403 | 404 | 409 | 424 | 500;
}

export interface AuthenticatedNetquityDirectorateResolverInput {
  authSubject: string;
  instrumentId: string;
  requestId: string;
}

export interface AuthenticatedNetquityDirectorateResolverRpcResult {
  envelope: ResponseEnvelope<GetLiveDirectorateResult>;
  status: 200 | 400 | 403 | 404 | 409 | 424 | 500;
}

export interface AuthenticatedNetquityOwnershipResolverInput {
  authSubject: string;
  instrumentId: string;
  requestId: string;
}

export interface AuthenticatedNetquityOwnershipResolverRpcResult {
  envelope: ResponseEnvelope<GetLiveOwnershipResult>;
  status: 200 | 400 | 403 | 404 | 409 | 424 | 500;
}

export interface AuthenticatedNetquityRelatedWarrantsResolverInput {
  authSubject: string;
  instrumentId: string;
  requestId: string;
}

export interface AuthenticatedNetquityRelatedWarrantsResolverRpcResult {
  envelope: ResponseEnvelope<GetLiveRelatedWarrantsResult>;
  status: 200 | 400 | 403 | 404 | 409 | 424 | 500;
}

export interface AuthenticatedNetquityDerivedMetricsResolverInput {
  authSubject: string;
  instrumentId: string;
  requestId: string;
}

export interface AuthenticatedNetquityDerivedMetricsResolverRpcResult {
  envelope: ResponseEnvelope<StockWorkbenchLiveDerivedMetrics>;
  status: 200 | 400 | 403 | 404 | 409 | 424 | 500;
}

interface AccountLookupRow {
  account_id: string | null;
}

interface EntitledContextRow {
  membership_id: string;
  plan_code: string;
  rights_policy_version: string;
  subscription_id: string;
  subscription_valid_from: Date | string;
  subscription_valid_to: Date | string | null;
  workspace_id: string;
}

interface RightsRow {
  channel: "web";
  dataset: string;
  entitlement_id: string;
  entitlement_source_record_id: string;
  entitlement_status: "approved" | "blocked" | "default_deny";
  export_allowed: boolean;
  field_pattern: string;
  rights_policy_version: string;
  time_range_days: number | null;
  valid_from: Date | string;
  valid_to: Date | string | null;
  workspace_entitlement_id: string;
  workspace_source_record_id: string;
  workspace_status: "approved" | "blocked" | "default_deny";
}

interface SnapshotRow {
  as_of: Date | string;
  data_version: string;
  serving_snapshot_id: string;
}

export async function resolveAuthenticatedNetquitySecurity(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityResolverInput,
): Promise<AuthenticatedNetquityResolverRpcResult> {
  const responseAsOf = new Date().toISOString();
  const validationError = validateInput(bindings, input, responseAsOf);
  if (validationError) return validationError;

  const connectionString = bindings.AIPHABEE_HYPERDRIVE?.connectionString?.trim();
  if (!connectionString) {
    return errorResult(
      424,
      "INTERNAL_ERROR",
      "staging security authority binding is unavailable",
      input.requestId,
      responseAsOf,
    );
  }

  const client = new Client({ connectionString });
  let transactionStarted = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accountResult = await client.query<AccountLookupRow>(ACCOUNT_LOOKUP_QUERY, [
      input.authSubject.toLowerCase(),
    ]);
    const accountId = accountResult.rows[0]?.account_id;
    if (!accountId) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "authenticated account is not provisioned",
        input.requestId,
        responseAsOf,
      );
    }

    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
    const contextResult = await client.query<EntitledContextRow>(CONTEXT_QUERY, [accountId]);
    if (contextResult.rows.length !== 1) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        contextResult.rows.length > 1 ? 409 : 403,
        "DATA_NOT_LICENSED",
        contextResult.rows.length > 1
          ? "multiple entitled workspaces require explicit product selection"
          : "active workspace subscription is required",
        input.requestId,
        responseAsOf,
      );
    }

    const context = contextResult.rows[0];
    const rightsResult = await client.query<RightsRow>(RIGHTS_QUERY, [
      context.workspace_id,
      context.subscription_id,
      context.rights_policy_version,
    ]);
    if (!hasExactFieldAuthority(rightsResult.rows)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web security field authority is required",
        input.requestId,
        responseAsOf,
      );
    }
    const policySource = compilePolicySource(context, rightsResult.rows, responseAsOf);
    const decision = evaluateDataAccessRequest(
      {
        accountId,
        channel: "web",
        dataset: "security_master",
        exportRequested: false,
        membershipId: context.membership_id,
        occurredAt: responseAsOf,
        plan: context.plan_code,
        qualityState: "PASS",
        requestId: input.requestId,
        requestedFields: [...AUTHENTICATED_NETQUITY_REQUIRED_FIELDS],
        requestedRows: 25,
        subscriptionId: context.subscription_id,
        workspaceId: context.workspace_id,
      },
      policySource.policy,
    );
    if (
      decision.status !== "allow" ||
      decision.deniedFields.length > 0 ||
      decision.allowedFields.length !== AUTHENTICATED_NETQUITY_REQUIRED_FIELDS.length
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web security fields are not licensed",
        input.requestId,
        responseAsOf,
      );
    }

    const resolved = await resolveReleasedNetquitySecurity(client, {
      market: input.market,
      query: input.query,
      requestId: input.requestId,
      responseAsOf,
      rightsPolicyVersion: context.rights_policy_version,
    });
    await client.query("COMMIT");
    transactionStarted = false;
    return resolved;
  } catch {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    return errorResult(
      500,
      "INTERNAL_ERROR",
      "authenticated security resolution failed",
      input.requestId,
      responseAsOf,
    );
  } finally {
    try {
      await client.end();
    } catch {
      return errorResult(
        500,
        "INTERNAL_ERROR",
        "authenticated security database close failed",
        input.requestId,
        responseAsOf,
      );
    }
  }
}

export async function resolveReleasedNetquitySecurity(
  client: Pick<Client, "query">,
  input: {
    market?: string;
    query: string;
    requestId: string;
    responseAsOf: string;
    rightsPolicyVersion: string;
  },
): Promise<AuthenticatedNetquityResolverRpcResult> {
  const snapshotResult = (await client.query(SNAPSHOT_QUERY, [
    input.rightsPolicyVersion,
  ])) as QueryResult<SnapshotRow>;
  const snapshot = snapshotResult.rows[0];
  if (!snapshot) {
    return errorResult(
      409,
      "DATA_QUALITY_HOLD",
      "no released security_master snapshot is available",
      input.requestId,
      input.responseAsOf,
    );
  }

  const snapshotAsOf = normalizeSnapshotAsOf(snapshot.as_of);
  const normalizedQuery = normalizeExactSecurityLookup(input.query);
  const candidatesResult = (await client.query(CANDIDATE_QUERY, [
    snapshot.serving_snapshot_id,
    normalizedQuery,
    input.market ?? null,
  ])) as QueryResult<ResolveLiveSecurityRow>;
  if (candidatesResult.rows.length > 25) {
    return errorResult(
      409,
      "TOO_MANY_ROWS",
      "exact security lookup exceeded 25 candidates",
      input.requestId,
      snapshotAsOf,
      snapshot.data_version,
      candidatesResult.rows.length,
    );
  }

  const result = resolveLiveSecurityRows(
    {
      asOf: snapshotAsOf,
      dataVersion: snapshot.data_version,
      market: input.market,
      query: input.query,
    },
    candidatesResult.rows,
  );
  if (result.status === "not_found") {
    return {
      envelope: createErrorEnvelope("NOT_FOUND", "exact security alias was not found", {
        asOf: result.asOf,
        dataVersion: result.dataVersion,
        methodologyVersion: result.methodologyVersion,
        requestId: input.requestId,
        usage: result.usage,
      }),
      status: 404,
    };
  }

  return {
    envelope: createSuccessEnvelope(result, {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId: input.requestId,
      usage: result.usage,
    }),
    status: 200,
  };
}

// Company-header profile RPC. Mirrors resolveAuthenticatedNetquitySecurity's
// authorization chain exactly (same account/context lookup, same
// entitlement-before-Serving ordering) but gates on the security_profile
// dataset and looks a single instrument up by exact entity id instead of
// alias search. Never exposed over a public HTTP route.
export async function resolveAuthenticatedNetquityProfile(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityProfileResolverInput,
): Promise<AuthenticatedNetquityProfileResolverRpcResult> {
  const responseAsOf = new Date().toISOString();
  const validationError = validateProfileInput(bindings, input, responseAsOf);
  if (validationError) return validationError;

  const connectionString = bindings.AIPHABEE_HYPERDRIVE?.connectionString?.trim();
  if (!connectionString) {
    return errorResult(
      424,
      "INTERNAL_ERROR",
      "staging security authority binding is unavailable",
      input.requestId,
      responseAsOf,
    );
  }

  const client = new Client({ connectionString });
  let transactionStarted = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accountResult = await client.query<AccountLookupRow>(ACCOUNT_LOOKUP_QUERY, [
      input.authSubject.toLowerCase(),
    ]);
    const accountId = accountResult.rows[0]?.account_id;
    if (!accountId) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "authenticated account is not provisioned",
        input.requestId,
        responseAsOf,
      );
    }

    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
    const contextResult = await client.query<EntitledContextRow>(CONTEXT_QUERY, [accountId]);
    if (contextResult.rows.length !== 1) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        contextResult.rows.length > 1 ? 409 : 403,
        "DATA_NOT_LICENSED",
        contextResult.rows.length > 1
          ? "multiple entitled workspaces require explicit product selection"
          : "active workspace subscription is required",
        input.requestId,
        responseAsOf,
      );
    }

    const context = contextResult.rows[0];
    const rightsResult = await client.query<RightsRow>(PROFILE_RIGHTS_QUERY, [
      context.workspace_id,
      context.subscription_id,
      context.rights_policy_version,
    ]);
    if (!hasExactProfileFieldAuthority(rightsResult.rows)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web security profile field authority is required",
        input.requestId,
        responseAsOf,
      );
    }
    const policySource = compilePolicySource(context, rightsResult.rows, responseAsOf);
    const decision = evaluateDataAccessRequest(
      {
        accountId,
        channel: "web",
        dataset: "security_profile",
        exportRequested: false,
        membershipId: context.membership_id,
        occurredAt: responseAsOf,
        plan: context.plan_code,
        qualityState: "PASS",
        requestId: input.requestId,
        requestedFields: [...AUTHENTICATED_NETQUITY_PROFILE_REQUIRED_FIELDS],
        requestedRows: 1,
        subscriptionId: context.subscription_id,
        workspaceId: context.workspace_id,
      },
      policySource.policy,
    );
    if (
      decision.status !== "allow" ||
      decision.deniedFields.length > 0 ||
      decision.allowedFields.length !== AUTHENTICATED_NETQUITY_PROFILE_REQUIRED_FIELDS.length
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web security profile fields are not licensed",
        input.requestId,
        responseAsOf,
      );
    }

    const resolved = await resolveReleasedNetquityProfile(client, {
      instrumentId: input.instrumentId,
      requestId: input.requestId,
      responseAsOf,
      rightsPolicyVersion: context.rights_policy_version,
    });
    await client.query("COMMIT");
    transactionStarted = false;
    return resolved;
  } catch {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    return errorResult(
      500,
      "INTERNAL_ERROR",
      "authenticated security profile resolution failed",
      input.requestId,
      responseAsOf,
    );
  } finally {
    try {
      await client.end();
    } catch {
      return errorResult(
        500,
        "INTERNAL_ERROR",
        "authenticated security profile database close failed",
        input.requestId,
        responseAsOf,
      );
    }
  }
}

export async function resolveReleasedNetquityProfile(
  client: Pick<Client, "query">,
  input: {
    instrumentId: string;
    requestId: string;
    responseAsOf: string;
    rightsPolicyVersion: string;
  },
): Promise<AuthenticatedNetquityProfileResolverRpcResult> {
  const snapshotResult = (await client.query(PROFILE_SNAPSHOT_QUERY, [
    input.rightsPolicyVersion,
  ])) as QueryResult<SnapshotRow>;
  const snapshot = snapshotResult.rows[0];
  if (!snapshot) {
    return errorResult(
      409,
      "DATA_QUALITY_HOLD",
      "no released security_profile snapshot is available",
      input.requestId,
      input.responseAsOf,
    );
  }

  const snapshotAsOf = normalizeSnapshotAsOf(snapshot.as_of);
  const recordResult = (await client.query(PROFILE_RECORD_QUERY, [
    snapshot.serving_snapshot_id,
    input.instrumentId,
  ])) as QueryResult<LiveSecurityProfileRow>;

  const result = getLiveSecurityProfile(
    {
      asOf: snapshotAsOf,
      dataVersion: snapshot.data_version,
      instrumentId: input.instrumentId,
    },
    recordResult.rows,
  );
  if (result.status === "not_found") {
    return {
      envelope: createErrorEnvelope("NOT_FOUND", "security profile was not found", {
        asOf: result.asOf,
        dataVersion: result.dataVersion,
        methodologyVersion: result.methodologyVersion,
        requestId: input.requestId,
        usage: result.usage,
      }),
      status: 404,
    };
  }

  return {
    envelope: createSuccessEnvelope(result, {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId: input.requestId,
      usage: result.usage,
    }),
    status: 200,
  };
}

// Financial-facts RPC. Mirrors resolveAuthenticatedNetquityProfile's
// authorization chain exactly (same account/context lookup, same
// entitlement-before-Serving ordering, same exact entity-id lookup) but
// gates on the financial_facts dataset. A released row may carry either
// populated facts (coverage.status="available") or an explicit
// coverage.status="unavailable" marker for bank/insurance-schema
// instruments -- both are still HTTP 200 "found", never a synthesized
// substitute. Never exposed over a public HTTP route.
export async function resolveAuthenticatedNetquityFinancialFacts(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityFinancialFactsResolverInput,
): Promise<AuthenticatedNetquityFinancialFactsResolverRpcResult> {
  const responseAsOf = new Date().toISOString();
  const validationError = validateFinancialFactsInput(bindings, input, responseAsOf);
  if (validationError) return validationError;

  const connectionString = bindings.AIPHABEE_HYPERDRIVE?.connectionString?.trim();
  if (!connectionString) {
    return errorResult(
      424,
      "INTERNAL_ERROR",
      "staging security authority binding is unavailable",
      input.requestId,
      responseAsOf,
    );
  }

  const client = new Client({ connectionString });
  let transactionStarted = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accountResult = await client.query<AccountLookupRow>(ACCOUNT_LOOKUP_QUERY, [
      input.authSubject.toLowerCase(),
    ]);
    const accountId = accountResult.rows[0]?.account_id;
    if (!accountId) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "authenticated account is not provisioned",
        input.requestId,
        responseAsOf,
      );
    }

    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
    const contextResult = await client.query<EntitledContextRow>(CONTEXT_QUERY, [accountId]);
    if (contextResult.rows.length !== 1) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        contextResult.rows.length > 1 ? 409 : 403,
        "DATA_NOT_LICENSED",
        contextResult.rows.length > 1
          ? "multiple entitled workspaces require explicit product selection"
          : "active workspace subscription is required",
        input.requestId,
        responseAsOf,
      );
    }

    const context = contextResult.rows[0];
    const rightsResult = await client.query<RightsRow>(FINANCIAL_FACTS_RIGHTS_QUERY, [
      context.workspace_id,
      context.subscription_id,
      context.rights_policy_version,
    ]);
    if (!hasExactFinancialFactsFieldAuthority(rightsResult.rows)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web financial facts field authority is required",
        input.requestId,
        responseAsOf,
      );
    }
    const policySource = compilePolicySource(context, rightsResult.rows, responseAsOf);
    const decision = evaluateDataAccessRequest(
      {
        accountId,
        channel: "web",
        dataset: "financial_facts",
        exportRequested: false,
        membershipId: context.membership_id,
        occurredAt: responseAsOf,
        plan: context.plan_code,
        qualityState: "PASS",
        requestId: input.requestId,
        requestedFields: [...AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS],
        requestedRows: 1,
        subscriptionId: context.subscription_id,
        workspaceId: context.workspace_id,
      },
      policySource.policy,
    );
    if (
      decision.status !== "allow" ||
      decision.deniedFields.length > 0 ||
      decision.allowedFields.length !== AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS.length
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web financial facts fields are not licensed",
        input.requestId,
        responseAsOf,
      );
    }

    const resolved = await resolveReleasedNetquityFinancialFacts(client, {
      instrumentId: input.instrumentId,
      requestId: input.requestId,
      responseAsOf,
      rightsPolicyVersion: context.rights_policy_version,
    });
    await client.query("COMMIT");
    transactionStarted = false;
    return resolved;
  } catch {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    return errorResult(
      500,
      "INTERNAL_ERROR",
      "authenticated financial facts resolution failed",
      input.requestId,
      responseAsOf,
    );
  } finally {
    try {
      await client.end();
    } catch {
      return errorResult(
        500,
        "INTERNAL_ERROR",
        "authenticated financial facts database close failed",
        input.requestId,
        responseAsOf,
      );
    }
  }
}

export async function resolveReleasedNetquityFinancialFacts(
  client: Pick<Client, "query">,
  input: {
    instrumentId: string;
    requestId: string;
    responseAsOf: string;
    rightsPolicyVersion: string;
  },
): Promise<AuthenticatedNetquityFinancialFactsResolverRpcResult> {
  const snapshotResult = (await client.query(FINANCIAL_FACTS_SNAPSHOT_QUERY, [
    input.rightsPolicyVersion,
  ])) as QueryResult<SnapshotRow>;
  const snapshot = snapshotResult.rows[0];
  if (!snapshot) {
    return errorResult(
      409,
      "DATA_QUALITY_HOLD",
      "no released financial_facts snapshot is available",
      input.requestId,
      input.responseAsOf,
    );
  }

  const snapshotAsOf = normalizeSnapshotAsOf(snapshot.as_of);
  const recordResult = (await client.query(FINANCIAL_FACTS_RECORD_QUERY, [
    snapshot.serving_snapshot_id,
    input.instrumentId,
  ])) as QueryResult<LiveFinancialFactsRow>;

  const result = getLiveFinancialFacts(
    {
      asOf: snapshotAsOf,
      dataVersion: snapshot.data_version,
      instrumentId: input.instrumentId,
    },
    recordResult.rows,
  );
  if (result.status === "not_found") {
    return {
      envelope: createErrorEnvelope("NOT_FOUND", "financial facts were not found", {
        asOf: result.asOf,
        dataVersion: result.dataVersion,
        methodologyVersion: result.methodologyVersion,
        requestId: input.requestId,
        usage: result.usage,
      }),
      status: 404,
    };
  }

  return {
    envelope: createSuccessEnvelope(result, {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId: input.requestId,
      usage: result.usage,
    }),
    status: 200,
  };
}

// Quote-snapshot RPC. Mirrors resolveAuthenticatedNetquityFinancialFacts's
// authorization chain exactly (same account/context lookup, same
// entitlement-before-Serving ordering, same exact entity-id lookup) but
// gates on the quote_snapshot dataset -- and unlike the other three
// datasets, its rights/snapshot queries are parametrized by the hardcoded
// NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION constant, not
// context.rights_policy_version (see that constant's comment). The
// CONTEXT_QUERY / account-entitled-workspace gate is still required and
// unchanged: this only swaps which rights_policy_version value scopes the
// dataset-specific rights and snapshot lookups. A released row may carry
// either a populated quote (coverage.status="available") or an explicit
// coverage.status="unavailable" marker for instruments with no
// nq_unadjprice2.daily row -- both are still HTTP 200 "found", never a
// synthesized substitute. This is end-of-day data, never real-time or
// intraday. Never exposed over a public HTTP route.
export async function resolveAuthenticatedNetquityQuoteSnapshot(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityQuoteSnapshotResolverInput,
): Promise<AuthenticatedNetquityQuoteSnapshotResolverRpcResult> {
  const responseAsOf = new Date().toISOString();
  const validationError = validateQuoteSnapshotInput(bindings, input, responseAsOf);
  if (validationError) return validationError;

  const connectionString = bindings.AIPHABEE_HYPERDRIVE?.connectionString?.trim();
  if (!connectionString) {
    return errorResult(
      424,
      "INTERNAL_ERROR",
      "staging security authority binding is unavailable",
      input.requestId,
      responseAsOf,
    );
  }

  const client = new Client({ connectionString });
  let transactionStarted = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accountResult = await client.query<AccountLookupRow>(ACCOUNT_LOOKUP_QUERY, [
      input.authSubject.toLowerCase(),
    ]);
    const accountId = accountResult.rows[0]?.account_id;
    if (!accountId) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "authenticated account is not provisioned",
        input.requestId,
        responseAsOf,
      );
    }

    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
    const contextResult = await client.query<EntitledContextRow>(CONTEXT_QUERY, [accountId]);
    if (contextResult.rows.length !== 1) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        contextResult.rows.length > 1 ? 409 : 403,
        "DATA_NOT_LICENSED",
        contextResult.rows.length > 1
          ? "multiple entitled workspaces require explicit product selection"
          : "active workspace subscription is required",
        input.requestId,
        responseAsOf,
      );
    }

    const context = contextResult.rows[0];
    const rightsResult = await client.query<RightsRow>(QUOTE_SNAPSHOT_RIGHTS_QUERY, [
      context.workspace_id,
      context.subscription_id,
      NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION,
    ]);
    if (!hasExactQuoteSnapshotFieldAuthority(rightsResult.rows)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web quote snapshot field authority is required",
        input.requestId,
        responseAsOf,
      );
    }
    const policySource = compilePolicySource(context, rightsResult.rows, responseAsOf);
    const decision = evaluateDataAccessRequest(
      {
        accountId,
        channel: "web",
        dataset: "quote_snapshot",
        exportRequested: false,
        membershipId: context.membership_id,
        occurredAt: responseAsOf,
        plan: context.plan_code,
        qualityState: "PASS",
        requestId: input.requestId,
        requestedFields: [...AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS],
        requestedRows: 1,
        subscriptionId: context.subscription_id,
        workspaceId: context.workspace_id,
      },
      policySource.policy,
    );
    if (
      decision.status !== "allow" ||
      decision.deniedFields.length > 0 ||
      decision.allowedFields.length !== AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS.length
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web quote snapshot fields are not licensed",
        input.requestId,
        responseAsOf,
      );
    }

    const resolved = await resolveReleasedNetquityQuoteSnapshot(client, {
      instrumentId: input.instrumentId,
      requestId: input.requestId,
      responseAsOf,
      rightsPolicyVersion: NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION,
    });
    await client.query("COMMIT");
    transactionStarted = false;
    return resolved;
  } catch {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    return errorResult(
      500,
      "INTERNAL_ERROR",
      "authenticated quote snapshot resolution failed",
      input.requestId,
      responseAsOf,
    );
  } finally {
    try {
      await client.end();
    } catch {
      return errorResult(
        500,
        "INTERNAL_ERROR",
        "authenticated quote snapshot database close failed",
        input.requestId,
        responseAsOf,
      );
    }
  }
}

export async function resolveReleasedNetquityQuoteSnapshot(
  client: Pick<Client, "query">,
  input: {
    instrumentId: string;
    requestId: string;
    responseAsOf: string;
    rightsPolicyVersion: string;
  },
): Promise<AuthenticatedNetquityQuoteSnapshotResolverRpcResult> {
  const snapshotResult = (await client.query(QUOTE_SNAPSHOT_SNAPSHOT_QUERY, [
    input.rightsPolicyVersion,
  ])) as QueryResult<SnapshotRow>;
  const snapshot = snapshotResult.rows[0];
  if (!snapshot) {
    return errorResult(
      409,
      "DATA_QUALITY_HOLD",
      "no released quote_snapshot snapshot is available",
      input.requestId,
      input.responseAsOf,
    );
  }

  const snapshotAsOf = normalizeSnapshotAsOf(snapshot.as_of);
  const recordResult = (await client.query(QUOTE_SNAPSHOT_RECORD_QUERY, [
    snapshot.serving_snapshot_id,
    input.instrumentId,
  ])) as QueryResult<LiveQuoteSnapshotRawRow>;

  const result = getLiveQuoteSnapshot(
    {
      asOf: snapshotAsOf,
      dataVersion: snapshot.data_version,
      instrumentId: input.instrumentId,
    },
    recordResult.rows,
  );
  if (result.status === "not_found") {
    return {
      envelope: createErrorEnvelope("NOT_FOUND", "quote snapshot was not found", {
        asOf: result.asOf,
        dataVersion: result.dataVersion,
        methodologyVersion: result.methodologyVersion,
        requestId: input.requestId,
        usage: result.usage,
      }),
      status: 404,
    };
  }

  return {
    envelope: createSuccessEnvelope(result, {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId: input.requestId,
      usage: result.usage,
    }),
    status: 200,
  };
}

// Corporate-actions RPC. Mirrors resolveAuthenticatedNetquityFinancialFacts's
// authorization chain exactly (same account/context lookup, same
// entitlement-before-Serving ordering, same exact entity-id lookup, same use
// of context.rights_policy_version -- not a hardcoded constant, unlike
// quote_snapshot) but gates on the corporate_actions dataset. A released row
// may carry either a populated actions array (coverage.status="available")
// or an explicit coverage.status="unavailable" marker for instruments with
// no qualifying dividend/buyback/split/consolidation event -- both are still
// HTTP 200 "found", never a synthesized substitute. Never exposed over a
// public HTTP route.
export async function resolveAuthenticatedNetquityCorporateActions(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityCorporateActionsResolverInput,
): Promise<AuthenticatedNetquityCorporateActionsResolverRpcResult> {
  const responseAsOf = new Date().toISOString();
  const validationError = validateCorporateActionsInput(bindings, input, responseAsOf);
  if (validationError) return validationError;

  const connectionString = bindings.AIPHABEE_HYPERDRIVE?.connectionString?.trim();
  if (!connectionString) {
    return errorResult(
      424,
      "INTERNAL_ERROR",
      "staging security authority binding is unavailable",
      input.requestId,
      responseAsOf,
    );
  }

  const client = new Client({ connectionString });
  let transactionStarted = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accountResult = await client.query<AccountLookupRow>(ACCOUNT_LOOKUP_QUERY, [
      input.authSubject.toLowerCase(),
    ]);
    const accountId = accountResult.rows[0]?.account_id;
    if (!accountId) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "authenticated account is not provisioned",
        input.requestId,
        responseAsOf,
      );
    }

    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
    const contextResult = await client.query<EntitledContextRow>(CONTEXT_QUERY, [accountId]);
    if (contextResult.rows.length !== 1) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        contextResult.rows.length > 1 ? 409 : 403,
        "DATA_NOT_LICENSED",
        contextResult.rows.length > 1
          ? "multiple entitled workspaces require explicit product selection"
          : "active workspace subscription is required",
        input.requestId,
        responseAsOf,
      );
    }

    const context = contextResult.rows[0];
    const rightsResult = await client.query<RightsRow>(CORPORATE_ACTIONS_RIGHTS_QUERY, [
      context.workspace_id,
      context.subscription_id,
      context.rights_policy_version,
    ]);
    if (!hasExactCorporateActionsFieldAuthority(rightsResult.rows)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web corporate actions field authority is required",
        input.requestId,
        responseAsOf,
      );
    }
    const policySource = compilePolicySource(context, rightsResult.rows, responseAsOf);
    const decision = evaluateDataAccessRequest(
      {
        accountId,
        channel: "web",
        dataset: "corporate_actions",
        exportRequested: false,
        membershipId: context.membership_id,
        occurredAt: responseAsOf,
        plan: context.plan_code,
        qualityState: "PASS",
        requestId: input.requestId,
        requestedFields: [...AUTHENTICATED_NETQUITY_CORPORATE_ACTIONS_REQUIRED_FIELDS],
        requestedRows: 1,
        subscriptionId: context.subscription_id,
        workspaceId: context.workspace_id,
      },
      policySource.policy,
    );
    if (
      decision.status !== "allow" ||
      decision.deniedFields.length > 0 ||
      decision.allowedFields.length !== AUTHENTICATED_NETQUITY_CORPORATE_ACTIONS_REQUIRED_FIELDS.length
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web corporate actions fields are not licensed",
        input.requestId,
        responseAsOf,
      );
    }

    const resolved = await resolveReleasedNetquityCorporateActions(client, {
      instrumentId: input.instrumentId,
      requestId: input.requestId,
      responseAsOf,
      rightsPolicyVersion: context.rights_policy_version,
    });
    await client.query("COMMIT");
    transactionStarted = false;
    return resolved;
  } catch {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    return errorResult(
      500,
      "INTERNAL_ERROR",
      "authenticated corporate actions resolution failed",
      input.requestId,
      responseAsOf,
    );
  } finally {
    try {
      await client.end();
    } catch {
      return errorResult(
        500,
        "INTERNAL_ERROR",
        "authenticated corporate actions database close failed",
        input.requestId,
        responseAsOf,
      );
    }
  }
}

export async function resolveReleasedNetquityCorporateActions(
  client: Pick<Client, "query">,
  input: {
    instrumentId: string;
    requestId: string;
    responseAsOf: string;
    rightsPolicyVersion: string;
  },
): Promise<AuthenticatedNetquityCorporateActionsResolverRpcResult> {
  const snapshotResult = (await client.query(CORPORATE_ACTIONS_SNAPSHOT_QUERY, [
    input.rightsPolicyVersion,
  ])) as QueryResult<SnapshotRow>;
  const snapshot = snapshotResult.rows[0];
  if (!snapshot) {
    return errorResult(
      409,
      "DATA_QUALITY_HOLD",
      "no released corporate_actions snapshot is available",
      input.requestId,
      input.responseAsOf,
    );
  }

  const snapshotAsOf = normalizeSnapshotAsOf(snapshot.as_of);
  const recordResult = (await client.query(CORPORATE_ACTIONS_RECORD_QUERY, [
    snapshot.serving_snapshot_id,
    input.instrumentId,
  ])) as QueryResult<LiveCorporateActionsRow>;

  const result = getLiveCorporateActions(
    {
      asOf: snapshotAsOf,
      dataVersion: snapshot.data_version,
      instrumentId: input.instrumentId,
    },
    recordResult.rows,
  );
  if (result.status === "not_found") {
    return {
      envelope: createErrorEnvelope("NOT_FOUND", "corporate actions were not found", {
        asOf: result.asOf,
        dataVersion: result.dataVersion,
        methodologyVersion: result.methodologyVersion,
        requestId: input.requestId,
        usage: result.usage,
      }),
      status: 404,
    };
  }

  return {
    envelope: createSuccessEnvelope(result, {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId: input.requestId,
      usage: result.usage,
    }),
    status: 200,
  };
}

// SDI-disclosure RPC. Mirrors resolveAuthenticatedNetquityCorporateActions's
// authorization chain exactly (same account/context lookup, same
// entitlement-before-Serving ordering, same exact entity-id lookup, same use
// of context.rights_policy_version) but gates on the sdi_disclosure dataset.
// A released row may carry either a populated disclosures array
// (coverage.status="available") or an explicit coverage.status="unavailable"
// marker for instruments with no substantial-shareholder or director/chief-
// executive filing -- both are still HTTP 200 "found", never a synthesized
// substitute. Never exposed over a public HTTP route.
export async function resolveAuthenticatedNetquitySdiDisclosure(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquitySdiDisclosureResolverInput,
): Promise<AuthenticatedNetquitySdiDisclosureResolverRpcResult> {
  const responseAsOf = new Date().toISOString();
  const validationError = validateSdiDisclosureInput(bindings, input, responseAsOf);
  if (validationError) return validationError;

  const connectionString = bindings.AIPHABEE_HYPERDRIVE?.connectionString?.trim();
  if (!connectionString) {
    return errorResult(
      424,
      "INTERNAL_ERROR",
      "staging security authority binding is unavailable",
      input.requestId,
      responseAsOf,
    );
  }

  const client = new Client({ connectionString });
  let transactionStarted = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accountResult = await client.query<AccountLookupRow>(ACCOUNT_LOOKUP_QUERY, [
      input.authSubject.toLowerCase(),
    ]);
    const accountId = accountResult.rows[0]?.account_id;
    if (!accountId) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "authenticated account is not provisioned",
        input.requestId,
        responseAsOf,
      );
    }

    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
    const contextResult = await client.query<EntitledContextRow>(CONTEXT_QUERY, [accountId]);
    if (contextResult.rows.length !== 1) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        contextResult.rows.length > 1 ? 409 : 403,
        "DATA_NOT_LICENSED",
        contextResult.rows.length > 1
          ? "multiple entitled workspaces require explicit product selection"
          : "active workspace subscription is required",
        input.requestId,
        responseAsOf,
      );
    }

    const context = contextResult.rows[0];
    const rightsResult = await client.query<RightsRow>(SDI_DISCLOSURE_RIGHTS_QUERY, [
      context.workspace_id,
      context.subscription_id,
      context.rights_policy_version,
    ]);
    if (!hasExactSdiDisclosureFieldAuthority(rightsResult.rows)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web sdi disclosure field authority is required",
        input.requestId,
        responseAsOf,
      );
    }
    const policySource = compilePolicySource(context, rightsResult.rows, responseAsOf);
    const decision = evaluateDataAccessRequest(
      {
        accountId,
        channel: "web",
        dataset: "sdi_disclosure",
        exportRequested: false,
        membershipId: context.membership_id,
        occurredAt: responseAsOf,
        plan: context.plan_code,
        qualityState: "PASS",
        requestId: input.requestId,
        requestedFields: [...AUTHENTICATED_NETQUITY_SDI_DISCLOSURE_REQUIRED_FIELDS],
        requestedRows: 1,
        subscriptionId: context.subscription_id,
        workspaceId: context.workspace_id,
      },
      policySource.policy,
    );
    if (
      decision.status !== "allow" ||
      decision.deniedFields.length > 0 ||
      decision.allowedFields.length !== AUTHENTICATED_NETQUITY_SDI_DISCLOSURE_REQUIRED_FIELDS.length
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web sdi disclosure fields are not licensed",
        input.requestId,
        responseAsOf,
      );
    }

    const resolved = await resolveReleasedNetquitySdiDisclosure(client, {
      instrumentId: input.instrumentId,
      requestId: input.requestId,
      responseAsOf,
      rightsPolicyVersion: context.rights_policy_version,
    });
    await client.query("COMMIT");
    transactionStarted = false;
    return resolved;
  } catch {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    return errorResult(
      500,
      "INTERNAL_ERROR",
      "authenticated sdi disclosure resolution failed",
      input.requestId,
      responseAsOf,
    );
  } finally {
    try {
      await client.end();
    } catch {
      return errorResult(
        500,
        "INTERNAL_ERROR",
        "authenticated sdi disclosure database close failed",
        input.requestId,
        responseAsOf,
      );
    }
  }
}

export async function resolveReleasedNetquitySdiDisclosure(
  client: Pick<Client, "query">,
  input: {
    instrumentId: string;
    requestId: string;
    responseAsOf: string;
    rightsPolicyVersion: string;
  },
): Promise<AuthenticatedNetquitySdiDisclosureResolverRpcResult> {
  const snapshotResult = (await client.query(SDI_DISCLOSURE_SNAPSHOT_QUERY, [
    input.rightsPolicyVersion,
  ])) as QueryResult<SnapshotRow>;
  const snapshot = snapshotResult.rows[0];
  if (!snapshot) {
    return errorResult(
      409,
      "DATA_QUALITY_HOLD",
      "no released sdi_disclosure snapshot is available",
      input.requestId,
      input.responseAsOf,
    );
  }

  const snapshotAsOf = normalizeSnapshotAsOf(snapshot.as_of);
  const recordResult = (await client.query(SDI_DISCLOSURE_RECORD_QUERY, [
    snapshot.serving_snapshot_id,
    input.instrumentId,
  ])) as QueryResult<LiveSdiDisclosuresRow>;

  const result = getLiveSdiDisclosures(
    {
      asOf: snapshotAsOf,
      dataVersion: snapshot.data_version,
      instrumentId: input.instrumentId,
    },
    recordResult.rows,
  );
  if (result.status === "not_found") {
    return {
      envelope: createErrorEnvelope("NOT_FOUND", "sdi disclosures were not found", {
        asOf: result.asOf,
        dataVersion: result.dataVersion,
        methodologyVersion: result.methodologyVersion,
        requestId: input.requestId,
        usage: result.usage,
      }),
      status: 404,
    };
  }

  return {
    envelope: createSuccessEnvelope(result, {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId: input.requestId,
      usage: result.usage,
    }),
    status: 200,
  };
}

// Directorate RPC. Mirrors resolveAuthenticatedNetquitySdiDisclosure's
// authorization chain exactly (same account/context lookup, same
// entitlement-before-Serving ordering, same exact entity-id lookup, same
// use of context.rights_policy_version) but gates on the directorate
// dataset. A released row may carry either a populated directors array
// (coverage.status="available") or an explicit coverage.status="unavailable"
// marker for instruments with no director/senior-management biography
// record -- both are still HTTP 200 "found", never a synthesized
// substitute. Never exposed over a public HTTP route.
export async function resolveAuthenticatedNetquityDirectorate(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityDirectorateResolverInput,
): Promise<AuthenticatedNetquityDirectorateResolverRpcResult> {
  const responseAsOf = new Date().toISOString();
  const validationError = validateDirectorateInput(bindings, input, responseAsOf);
  if (validationError) return validationError;

  const connectionString = bindings.AIPHABEE_HYPERDRIVE?.connectionString?.trim();
  if (!connectionString) {
    return errorResult(
      424,
      "INTERNAL_ERROR",
      "staging security authority binding is unavailable",
      input.requestId,
      responseAsOf,
    );
  }

  const client = new Client({ connectionString });
  let transactionStarted = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accountResult = await client.query<AccountLookupRow>(ACCOUNT_LOOKUP_QUERY, [
      input.authSubject.toLowerCase(),
    ]);
    const accountId = accountResult.rows[0]?.account_id;
    if (!accountId) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "authenticated account is not provisioned",
        input.requestId,
        responseAsOf,
      );
    }

    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
    const contextResult = await client.query<EntitledContextRow>(CONTEXT_QUERY, [accountId]);
    if (contextResult.rows.length !== 1) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        contextResult.rows.length > 1 ? 409 : 403,
        "DATA_NOT_LICENSED",
        contextResult.rows.length > 1
          ? "multiple entitled workspaces require explicit product selection"
          : "active workspace subscription is required",
        input.requestId,
        responseAsOf,
      );
    }

    const context = contextResult.rows[0];
    const rightsResult = await client.query<RightsRow>(DIRECTORATE_RIGHTS_QUERY, [
      context.workspace_id,
      context.subscription_id,
      context.rights_policy_version,
    ]);
    if (!hasExactDirectorateFieldAuthority(rightsResult.rows)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web directorate field authority is required",
        input.requestId,
        responseAsOf,
      );
    }
    const policySource = compilePolicySource(context, rightsResult.rows, responseAsOf);
    const decision = evaluateDataAccessRequest(
      {
        accountId,
        channel: "web",
        dataset: "directorate",
        exportRequested: false,
        membershipId: context.membership_id,
        occurredAt: responseAsOf,
        plan: context.plan_code,
        qualityState: "PASS",
        requestId: input.requestId,
        requestedFields: [...AUTHENTICATED_NETQUITY_DIRECTORATE_REQUIRED_FIELDS],
        requestedRows: 1,
        subscriptionId: context.subscription_id,
        workspaceId: context.workspace_id,
      },
      policySource.policy,
    );
    if (
      decision.status !== "allow" ||
      decision.deniedFields.length > 0 ||
      decision.allowedFields.length !== AUTHENTICATED_NETQUITY_DIRECTORATE_REQUIRED_FIELDS.length
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web directorate fields are not licensed",
        input.requestId,
        responseAsOf,
      );
    }

    const resolved = await resolveReleasedNetquityDirectorate(client, {
      instrumentId: input.instrumentId,
      requestId: input.requestId,
      responseAsOf,
      rightsPolicyVersion: context.rights_policy_version,
    });
    await client.query("COMMIT");
    transactionStarted = false;
    return resolved;
  } catch {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    return errorResult(
      500,
      "INTERNAL_ERROR",
      "authenticated directorate resolution failed",
      input.requestId,
      responseAsOf,
    );
  } finally {
    try {
      await client.end();
    } catch {
      return errorResult(
        500,
        "INTERNAL_ERROR",
        "authenticated directorate database close failed",
        input.requestId,
        responseAsOf,
      );
    }
  }
}

export async function resolveReleasedNetquityDirectorate(
  client: Pick<Client, "query">,
  input: {
    instrumentId: string;
    requestId: string;
    responseAsOf: string;
    rightsPolicyVersion: string;
  },
): Promise<AuthenticatedNetquityDirectorateResolverRpcResult> {
  const snapshotResult = (await client.query(DIRECTORATE_SNAPSHOT_QUERY, [
    input.rightsPolicyVersion,
  ])) as QueryResult<SnapshotRow>;
  const snapshot = snapshotResult.rows[0];
  if (!snapshot) {
    return errorResult(
      409,
      "DATA_QUALITY_HOLD",
      "no released directorate snapshot is available",
      input.requestId,
      input.responseAsOf,
    );
  }

  const snapshotAsOf = normalizeSnapshotAsOf(snapshot.as_of);
  const recordResult = (await client.query(DIRECTORATE_RECORD_QUERY, [
    snapshot.serving_snapshot_id,
    input.instrumentId,
  ])) as QueryResult<LiveDirectorateRow>;

  const result = getLiveDirectorate(
    {
      asOf: snapshotAsOf,
      dataVersion: snapshot.data_version,
      instrumentId: input.instrumentId,
    },
    recordResult.rows,
  );
  if (result.status === "not_found") {
    return {
      envelope: createErrorEnvelope("NOT_FOUND", "directorate records were not found", {
        asOf: result.asOf,
        dataVersion: result.dataVersion,
        methodologyVersion: result.methodologyVersion,
        requestId: input.requestId,
        usage: result.usage,
      }),
      status: 404,
    };
  }

  return {
    envelope: createSuccessEnvelope(result, {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId: input.requestId,
      usage: result.usage,
    }),
    status: 200,
  };
}

export async function resolveAuthenticatedNetquityOwnership(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityOwnershipResolverInput,
): Promise<AuthenticatedNetquityOwnershipResolverRpcResult> {
  const responseAsOf = new Date().toISOString();
  const validationError = validateOwnershipInput(bindings, input, responseAsOf);
  if (validationError) return validationError;

  const connectionString = bindings.AIPHABEE_HYPERDRIVE?.connectionString?.trim();
  if (!connectionString) {
    return errorResult(
      424,
      "INTERNAL_ERROR",
      "staging security authority binding is unavailable",
      input.requestId,
      responseAsOf,
    );
  }

  const client = new Client({ connectionString });
  let transactionStarted = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accountResult = await client.query<AccountLookupRow>(ACCOUNT_LOOKUP_QUERY, [
      input.authSubject.toLowerCase(),
    ]);
    const accountId = accountResult.rows[0]?.account_id;
    if (!accountId) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "authenticated account is not provisioned",
        input.requestId,
        responseAsOf,
      );
    }

    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
    const contextResult = await client.query<EntitledContextRow>(CONTEXT_QUERY, [accountId]);
    if (contextResult.rows.length !== 1) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        contextResult.rows.length > 1 ? 409 : 403,
        "DATA_NOT_LICENSED",
        contextResult.rows.length > 1
          ? "multiple entitled workspaces require explicit product selection"
          : "active workspace subscription is required",
        input.requestId,
        responseAsOf,
      );
    }

    const context = contextResult.rows[0];
    const rightsResult = await client.query<RightsRow>(OWNERSHIP_RIGHTS_QUERY, [
      context.workspace_id,
      context.subscription_id,
      context.rights_policy_version,
    ]);
    if (!hasExactOwnershipFieldAuthority(rightsResult.rows)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web ownership field authority is required",
        input.requestId,
        responseAsOf,
      );
    }
    const policySource = compilePolicySource(context, rightsResult.rows, responseAsOf);
    const decision = evaluateDataAccessRequest(
      {
        accountId,
        channel: "web",
        dataset: "ownership",
        exportRequested: false,
        membershipId: context.membership_id,
        occurredAt: responseAsOf,
        plan: context.plan_code,
        qualityState: "PASS",
        requestId: input.requestId,
        requestedFields: [...AUTHENTICATED_NETQUITY_OWNERSHIP_REQUIRED_FIELDS],
        requestedRows: 1,
        subscriptionId: context.subscription_id,
        workspaceId: context.workspace_id,
      },
      policySource.policy,
    );
    if (
      decision.status !== "allow" ||
      decision.deniedFields.length > 0 ||
      decision.allowedFields.length !== AUTHENTICATED_NETQUITY_OWNERSHIP_REQUIRED_FIELDS.length
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web ownership fields are not licensed",
        input.requestId,
        responseAsOf,
      );
    }

    const resolved = await resolveReleasedNetquityOwnership(client, {
      instrumentId: input.instrumentId,
      requestId: input.requestId,
      responseAsOf,
      rightsPolicyVersion: context.rights_policy_version,
    });
    await client.query("COMMIT");
    transactionStarted = false;
    return resolved;
  } catch {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    return errorResult(
      500,
      "INTERNAL_ERROR",
      "authenticated ownership resolution failed",
      input.requestId,
      responseAsOf,
    );
  } finally {
    try {
      await client.end();
    } catch {
      return errorResult(
        500,
        "INTERNAL_ERROR",
        "authenticated ownership database close failed",
        input.requestId,
        responseAsOf,
      );
    }
  }
}

export async function resolveReleasedNetquityOwnership(
  client: Pick<Client, "query">,
  input: {
    instrumentId: string;
    requestId: string;
    responseAsOf: string;
    rightsPolicyVersion: string;
  },
): Promise<AuthenticatedNetquityOwnershipResolverRpcResult> {
  const snapshotResult = (await client.query(OWNERSHIP_SNAPSHOT_QUERY, [
    input.rightsPolicyVersion,
  ])) as QueryResult<SnapshotRow>;
  const snapshot = snapshotResult.rows[0];
  if (!snapshot) {
    return errorResult(
      409,
      "DATA_QUALITY_HOLD",
      "no released ownership snapshot is available",
      input.requestId,
      input.responseAsOf,
    );
  }

  const snapshotAsOf = normalizeSnapshotAsOf(snapshot.as_of);
  const recordResult = (await client.query(OWNERSHIP_RECORD_QUERY, [
    snapshot.serving_snapshot_id,
    input.instrumentId,
  ])) as QueryResult<LiveOwnershipRow>;

  const result = getLiveOwnership(
    {
      asOf: snapshotAsOf,
      dataVersion: snapshot.data_version,
      instrumentId: input.instrumentId,
    },
    recordResult.rows,
  );
  if (result.status === "not_found") {
    return {
      envelope: createErrorEnvelope("NOT_FOUND", "ownership records were not found", {
        asOf: result.asOf,
        dataVersion: result.dataVersion,
        methodologyVersion: result.methodologyVersion,
        requestId: input.requestId,
        usage: result.usage,
      }),
      status: 404,
    };
  }

  return {
    envelope: createSuccessEnvelope(result, {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId: input.requestId,
      usage: result.usage,
    }),
    status: 200,
  };
}

// Related-warrants RPC. Mirrors resolveAuthenticatedNetquityOwnership's
// authorization chain exactly (same account/context lookup, same
// entitlement-before-Serving ordering, same exact entity-id lookup) but
// gates on the related_warrants dataset. A released row may carry either a
// populated warrants[] array (coverage.status="available") or an explicit
// coverage.status="unavailable" marker for the overwhelming majority of
// instruments with no associated derivative warrant or CBBC -- both are
// still HTTP 200 "found", never a synthesized substitute. Never exposed
// over a public HTTP route.
export async function resolveAuthenticatedNetquityRelatedWarrants(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityRelatedWarrantsResolverInput,
): Promise<AuthenticatedNetquityRelatedWarrantsResolverRpcResult> {
  const responseAsOf = new Date().toISOString();
  const validationError = validateRelatedWarrantsInput(bindings, input, responseAsOf);
  if (validationError) return validationError;

  const connectionString = bindings.AIPHABEE_HYPERDRIVE?.connectionString?.trim();
  if (!connectionString) {
    return errorResult(
      424,
      "INTERNAL_ERROR",
      "staging security authority binding is unavailable",
      input.requestId,
      responseAsOf,
    );
  }

  const client = new Client({ connectionString });
  let transactionStarted = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accountResult = await client.query<AccountLookupRow>(ACCOUNT_LOOKUP_QUERY, [
      input.authSubject.toLowerCase(),
    ]);
    const accountId = accountResult.rows[0]?.account_id;
    if (!accountId) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "authenticated account is not provisioned",
        input.requestId,
        responseAsOf,
      );
    }

    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
    const contextResult = await client.query<EntitledContextRow>(CONTEXT_QUERY, [accountId]);
    if (contextResult.rows.length !== 1) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        contextResult.rows.length > 1 ? 409 : 403,
        "DATA_NOT_LICENSED",
        contextResult.rows.length > 1
          ? "multiple entitled workspaces require explicit product selection"
          : "active workspace subscription is required",
        input.requestId,
        responseAsOf,
      );
    }

    const context = contextResult.rows[0];
    const rightsResult = await client.query<RightsRow>(RELATED_WARRANTS_RIGHTS_QUERY, [
      context.workspace_id,
      context.subscription_id,
      context.rights_policy_version,
    ]);
    if (!hasExactRelatedWarrantsFieldAuthority(rightsResult.rows)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web related-warrants field authority is required",
        input.requestId,
        responseAsOf,
      );
    }
    const policySource = compilePolicySource(context, rightsResult.rows, responseAsOf);
    const decision = evaluateDataAccessRequest(
      {
        accountId,
        channel: "web",
        dataset: "related_warrants",
        exportRequested: false,
        membershipId: context.membership_id,
        occurredAt: responseAsOf,
        plan: context.plan_code,
        qualityState: "PASS",
        requestId: input.requestId,
        requestedFields: [...AUTHENTICATED_NETQUITY_RELATED_WARRANTS_REQUIRED_FIELDS],
        requestedRows: 1,
        subscriptionId: context.subscription_id,
        workspaceId: context.workspace_id,
      },
      policySource.policy,
    );
    if (
      decision.status !== "allow" ||
      decision.deniedFields.length > 0 ||
      decision.allowedFields.length !== AUTHENTICATED_NETQUITY_RELATED_WARRANTS_REQUIRED_FIELDS.length
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web related-warrants fields are not licensed",
        input.requestId,
        responseAsOf,
      );
    }

    const resolved = await resolveReleasedNetquityRelatedWarrants(client, {
      instrumentId: input.instrumentId,
      requestId: input.requestId,
      responseAsOf,
      rightsPolicyVersion: context.rights_policy_version,
    });
    await client.query("COMMIT");
    transactionStarted = false;
    return resolved;
  } catch {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    return errorResult(
      500,
      "INTERNAL_ERROR",
      "authenticated related-warrants resolution failed",
      input.requestId,
      responseAsOf,
    );
  } finally {
    try {
      await client.end();
    } catch {
      return errorResult(
        500,
        "INTERNAL_ERROR",
        "authenticated related-warrants database close failed",
        input.requestId,
        responseAsOf,
      );
    }
  }
}

export async function resolveReleasedNetquityRelatedWarrants(
  client: Pick<Client, "query">,
  input: {
    instrumentId: string;
    requestId: string;
    responseAsOf: string;
    rightsPolicyVersion: string;
  },
): Promise<AuthenticatedNetquityRelatedWarrantsResolverRpcResult> {
  const snapshotResult = (await client.query(RELATED_WARRANTS_SNAPSHOT_QUERY, [
    input.rightsPolicyVersion,
  ])) as QueryResult<SnapshotRow>;
  const snapshot = snapshotResult.rows[0];
  if (!snapshot) {
    return errorResult(
      409,
      "DATA_QUALITY_HOLD",
      "no released related_warrants snapshot is available",
      input.requestId,
      input.responseAsOf,
    );
  }

  const snapshotAsOf = normalizeSnapshotAsOf(snapshot.as_of);
  const recordResult = (await client.query(RELATED_WARRANTS_RECORD_QUERY, [
    snapshot.serving_snapshot_id,
    input.instrumentId,
  ])) as QueryResult<LiveRelatedWarrantsRow>;

  const result = getLiveRelatedWarrants(
    {
      asOf: snapshotAsOf,
      dataVersion: snapshot.data_version,
      instrumentId: input.instrumentId,
    },
    recordResult.rows,
  );
  if (result.status === "not_found") {
    return {
      envelope: createErrorEnvelope("NOT_FOUND", "related-warrants records were not found", {
        asOf: result.asOf,
        dataVersion: result.dataVersion,
        methodologyVersion: result.methodologyVersion,
        requestId: input.requestId,
        usage: result.usage,
      }),
      status: 404,
    };
  }

  return {
    envelope: createSuccessEnvelope(result, {
      asOf: result.asOf,
      dataVersion: result.dataVersion,
      methodologyVersion: result.methodologyVersion,
      provenance: result.provenance,
      requestId: input.requestId,
      usage: result.usage,
    }),
    status: 200,
  };
}

// Derived-metrics RPC. Does not gate on a new "derived metrics" Serving
// dataset or entitlement row -- there is none, and this promotion registers
// none. Instead it runs the conjunction of the two gates already used by
// resolveAuthenticatedNetquityFinancialFacts and
// resolveAuthenticatedNetquityQuoteSnapshot inside the same
// account/context/transaction: Gate A (financial_facts, scoped by the
// account's own context.rights_policy_version) and Gate B (quote_snapshot,
// scoped by the hardcoded NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION,
// independent of Gate A's policy version -- see that constant's comment).
// Each gate is enforced exactly as its single-dataset resolver enforces it,
// neither relaxed for this call; either gate failing denies the whole
// request with 403 before any Serving row is read. Once both pass, this
// reuses resolveReleasedNetquityFinancialFacts and
// resolveReleasedNetquityQuoteSnapshot verbatim, in the same transaction: a
// 200 from either contributes its released result to packages/workbench's
// createLiveDerivedMetrics, a 404 (entity absent from that Serving snapshot
// entirely) contributes undefined for that one dataset without failing the
// whole request (the engine renders a specific blocked_reason per metric
// instead of a fabricated value), and any other status (409
// DATA_QUALITY_HOLD -- no released snapshot for that dataset at all) is
// propagated verbatim; ErrorEnvelope carries no TData and is a member of
// ResponseEnvelope<T> for any T, same reasoning as errorResult() below.
// Never exposed over a public HTTP route.
export async function resolveAuthenticatedNetquityDerivedMetrics(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityDerivedMetricsResolverInput,
): Promise<AuthenticatedNetquityDerivedMetricsResolverRpcResult> {
  const responseAsOf = new Date().toISOString();
  const validationError = validateDerivedMetricsInput(bindings, input, responseAsOf);
  if (validationError) return validationError;

  const connectionString = bindings.AIPHABEE_HYPERDRIVE?.connectionString?.trim();
  if (!connectionString) {
    return errorResult(
      424,
      "INTERNAL_ERROR",
      "staging security authority binding is unavailable",
      input.requestId,
      responseAsOf,
    );
  }

  const client = new Client({ connectionString });
  let transactionStarted = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const accountResult = await client.query<AccountLookupRow>(ACCOUNT_LOOKUP_QUERY, [
      input.authSubject.toLowerCase(),
    ]);
    const accountId = accountResult.rows[0]?.account_id;
    if (!accountId) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "authenticated account is not provisioned",
        input.requestId,
        responseAsOf,
      );
    }

    await client.query("SELECT set_config('aiphabee.account_id', $1, true)", [accountId]);
    const contextResult = await client.query<EntitledContextRow>(CONTEXT_QUERY, [accountId]);
    if (contextResult.rows.length !== 1) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        contextResult.rows.length > 1 ? 409 : 403,
        "DATA_NOT_LICENSED",
        contextResult.rows.length > 1
          ? "multiple entitled workspaces require explicit product selection"
          : "active workspace subscription is required",
        input.requestId,
        responseAsOf,
      );
    }

    const context = contextResult.rows[0];

    // Gate A: financial_facts field authority (identical to
    // resolveAuthenticatedNetquityFinancialFacts's own gate).
    const financialRightsResult = await client.query<RightsRow>(FINANCIAL_FACTS_RIGHTS_QUERY, [
      context.workspace_id,
      context.subscription_id,
      context.rights_policy_version,
    ]);
    if (!hasExactFinancialFactsFieldAuthority(financialRightsResult.rows)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web financial facts field authority is required",
        input.requestId,
        responseAsOf,
      );
    }
    const financialPolicySource = compilePolicySource(context, financialRightsResult.rows, responseAsOf);
    const financialDecision = evaluateDataAccessRequest(
      {
        accountId,
        channel: "web",
        dataset: "financial_facts",
        exportRequested: false,
        membershipId: context.membership_id,
        occurredAt: responseAsOf,
        plan: context.plan_code,
        qualityState: "PASS",
        requestId: input.requestId,
        requestedFields: [...AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS],
        requestedRows: 1,
        subscriptionId: context.subscription_id,
        workspaceId: context.workspace_id,
      },
      financialPolicySource.policy,
    );
    if (
      financialDecision.status !== "allow" ||
      financialDecision.deniedFields.length > 0 ||
      financialDecision.allowedFields.length !== AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS.length
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web financial facts fields are not licensed",
        input.requestId,
        responseAsOf,
      );
    }

    // Gate B: quote_snapshot field authority (identical to
    // resolveAuthenticatedNetquityQuoteSnapshot's own gate; independent
    // hardcoded policy version, Gate A above is unaffected by it).
    const quoteRightsResult = await client.query<RightsRow>(QUOTE_SNAPSHOT_RIGHTS_QUERY, [
      context.workspace_id,
      context.subscription_id,
      NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION,
    ]);
    if (!hasExactQuoteSnapshotFieldAuthority(quoteRightsResult.rows)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web quote snapshot field authority is required",
        input.requestId,
        responseAsOf,
      );
    }
    const quotePolicySource = compilePolicySource(context, quoteRightsResult.rows, responseAsOf);
    const quoteDecision = evaluateDataAccessRequest(
      {
        accountId,
        channel: "web",
        dataset: "quote_snapshot",
        exportRequested: false,
        membershipId: context.membership_id,
        occurredAt: responseAsOf,
        plan: context.plan_code,
        qualityState: "PASS",
        requestId: input.requestId,
        requestedFields: [...AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS],
        requestedRows: 1,
        subscriptionId: context.subscription_id,
        workspaceId: context.workspace_id,
      },
      quotePolicySource.policy,
    );
    if (
      quoteDecision.status !== "allow" ||
      quoteDecision.deniedFields.length > 0 ||
      quoteDecision.allowedFields.length !== AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS.length
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return errorResult(
        403,
        "DATA_NOT_LICENSED",
        "exact Web quote snapshot fields are not licensed",
        input.requestId,
        responseAsOf,
      );
    }

    // Both gates passed. Reuse each dataset's own released-Serving resolver
    // verbatim, in the same transaction.
    const financialResolved = await resolveReleasedNetquityFinancialFacts(client, {
      instrumentId: input.instrumentId,
      requestId: input.requestId,
      responseAsOf,
      rightsPolicyVersion: context.rights_policy_version,
    });
    if (!financialResolved.envelope.ok && financialResolved.status !== 404) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return { envelope: financialResolved.envelope, status: financialResolved.status };
    }
    const financialFacts = financialResolved.envelope.ok ? financialResolved.envelope.data : undefined;

    const quoteResolved = await resolveReleasedNetquityQuoteSnapshot(client, {
      instrumentId: input.instrumentId,
      requestId: input.requestId,
      responseAsOf,
      rightsPolicyVersion: NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION,
    });
    if (!quoteResolved.envelope.ok && quoteResolved.status !== 404) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return { envelope: quoteResolved.envelope, status: quoteResolved.status };
    }
    const quoteSnapshot = quoteResolved.envelope.ok ? quoteResolved.envelope.data : undefined;

    const result = createLiveDerivedMetrics({ financialFacts, quoteSnapshot });
    await client.query("COMMIT");
    transactionStarted = false;
    return {
      envelope: createSuccessEnvelope(result, {
        asOf: responseAsOf,
        dataVersion: result.data_version,
        methodologyVersion: result.methodology_version,
        provenance: result.provenance,
        requestId: input.requestId,
        usage: result.usage,
      }),
      status: 200,
    };
  } catch {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    return errorResult(
      500,
      "INTERNAL_ERROR",
      "authenticated derived metrics resolution failed",
      input.requestId,
      responseAsOf,
    );
  } finally {
    try {
      await client.end();
    } catch {
      return errorResult(
        500,
        "INTERNAL_ERROR",
        "authenticated derived metrics database close failed",
        input.requestId,
        responseAsOf,
      );
    }
  }
}

function hasExactFieldAuthority(rows: RightsRow[]): boolean {
  if (rows.some((row) => !AUTHENTICATED_NETQUITY_REQUIRED_FIELD_SET.has(row.field_pattern))) {
    return false;
  }
  const representedFields = new Set(rows.map((row) => row.field_pattern));
  return AUTHENTICATED_NETQUITY_REQUIRED_FIELDS.every((field) => representedFields.has(field));
}

function hasExactProfileFieldAuthority(rows: RightsRow[]): boolean {
  if (rows.some((row) => !AUTHENTICATED_NETQUITY_PROFILE_REQUIRED_FIELD_SET.has(row.field_pattern))) {
    return false;
  }
  const representedFields = new Set(rows.map((row) => row.field_pattern));
  return AUTHENTICATED_NETQUITY_PROFILE_REQUIRED_FIELDS.every((field) => representedFields.has(field));
}

function hasExactFinancialFactsFieldAuthority(rows: RightsRow[]): boolean {
  if (rows.some((row) => !AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELD_SET.has(row.field_pattern))) {
    return false;
  }
  const representedFields = new Set(rows.map((row) => row.field_pattern));
  return AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS.every((field) => representedFields.has(field));
}

function hasExactQuoteSnapshotFieldAuthority(rows: RightsRow[]): boolean {
  if (rows.some((row) => !AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELD_SET.has(row.field_pattern))) {
    return false;
  }
  const representedFields = new Set(rows.map((row) => row.field_pattern));
  return AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS.every((field) => representedFields.has(field));
}

function hasExactCorporateActionsFieldAuthority(rows: RightsRow[]): boolean {
  if (rows.some((row) => !AUTHENTICATED_NETQUITY_CORPORATE_ACTIONS_REQUIRED_FIELD_SET.has(row.field_pattern))) {
    return false;
  }
  const representedFields = new Set(rows.map((row) => row.field_pattern));
  return AUTHENTICATED_NETQUITY_CORPORATE_ACTIONS_REQUIRED_FIELDS.every((field) => representedFields.has(field));
}

function hasExactSdiDisclosureFieldAuthority(rows: RightsRow[]): boolean {
  if (rows.some((row) => !AUTHENTICATED_NETQUITY_SDI_DISCLOSURE_REQUIRED_FIELD_SET.has(row.field_pattern))) {
    return false;
  }
  const representedFields = new Set(rows.map((row) => row.field_pattern));
  return AUTHENTICATED_NETQUITY_SDI_DISCLOSURE_REQUIRED_FIELDS.every((field) => representedFields.has(field));
}

function hasExactDirectorateFieldAuthority(rows: RightsRow[]): boolean {
  if (rows.some((row) => !AUTHENTICATED_NETQUITY_DIRECTORATE_REQUIRED_FIELD_SET.has(row.field_pattern))) {
    return false;
  }
  const representedFields = new Set(rows.map((row) => row.field_pattern));
  return AUTHENTICATED_NETQUITY_DIRECTORATE_REQUIRED_FIELDS.every((field) => representedFields.has(field));
}

function hasExactOwnershipFieldAuthority(rows: RightsRow[]): boolean {
  if (rows.some((row) => !AUTHENTICATED_NETQUITY_OWNERSHIP_REQUIRED_FIELD_SET.has(row.field_pattern))) {
    return false;
  }
  const representedFields = new Set(rows.map((row) => row.field_pattern));
  return AUTHENTICATED_NETQUITY_OWNERSHIP_REQUIRED_FIELDS.every((field) => representedFields.has(field));
}

function hasExactRelatedWarrantsFieldAuthority(rows: RightsRow[]): boolean {
  if (rows.some((row) => !AUTHENTICATED_NETQUITY_RELATED_WARRANTS_REQUIRED_FIELD_SET.has(row.field_pattern))) {
    return false;
  }
  const representedFields = new Set(rows.map((row) => row.field_pattern));
  return AUTHENTICATED_NETQUITY_RELATED_WARRANTS_REQUIRED_FIELDS.every((field) => representedFields.has(field));
}

function compilePolicySource(
  context: EntitledContextRow,
  rows: RightsRow[],
  asOf: string,
) {
  const dataEntitlements: DataEntitlementRow[] = rows.map((row) => ({
    channel: row.channel,
    dataset: row.dataset,
    entitlementId: row.entitlement_id,
    exportAllowed: row.export_allowed,
    fieldPattern: row.field_pattern,
    rightsPolicyVersion: row.rights_policy_version,
    sourceRecordId: row.entitlement_source_record_id,
    status: row.entitlement_status,
    timeRangeDays: row.time_range_days ?? undefined,
  }));
  const workspaceEntitlements: WorkspaceEntitlementRow[] = rows.map((row) => ({
    entitlementId: row.entitlement_id,
    sourceRecordId: row.workspace_source_record_id,
    status: row.workspace_status,
    subscriptionId: context.subscription_id,
    validFrom: normalizeTimestamp(row.valid_from),
    validTo: row.valid_to ? normalizeTimestamp(row.valid_to) : undefined,
    workspaceEntitlementId: row.workspace_entitlement_id,
    workspaceId: context.workspace_id,
  }));
  const subscriptionRows: WorkspaceSubscriptionRow[] = [
    {
      billingState: "active",
      planCode: context.plan_code,
      subscriptionId: context.subscription_id,
      validFrom: normalizeTimestamp(context.subscription_valid_from),
      validTo: context.subscription_valid_to
        ? normalizeTimestamp(context.subscription_valid_to)
        : undefined,
      workspaceId: context.workspace_id,
    },
  ];
  return createPolicyFromEntitlementRows({
    asOf,
    dataEntitlements,
    subscriptionRows,
    workspaceEntitlements,
  });
}

function validateInput(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityResolverInput,
  asOf: string,
): AuthenticatedNetquityResolverRpcResult | undefined {
  if (bindings.APP_ENV !== "staging") {
    return errorResult(403, "DATA_NOT_LICENSED", "staging resolver is unavailable", input.requestId, asOf);
  }
  if (!AUTH_SUBJECT_PATTERN.test(input.authSubject)) {
    return errorResult(403, "AUTH_REQUIRED", "authenticated subject is invalid", input.requestId, asOf);
  }
  const query = input.query.trim();
  if (!query || new TextEncoder().encode(query).byteLength > MAX_INPUT_BYTES) {
    return errorResult(400, "SCOPE_DENIED", "query is required and must not exceed 512 bytes", input.requestId, asOf);
  }
  if (
    input.market !== undefined &&
    (!/^[A-Z0-9._-]{1,24}$/u.test(input.market) || input.market !== input.market.toUpperCase())
  ) {
    return errorResult(400, "SCOPE_DENIED", "market is invalid", input.requestId, asOf);
  }
  return undefined;
}

function validateProfileInput(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityProfileResolverInput,
  asOf: string,
): AuthenticatedNetquityProfileResolverRpcResult | undefined {
  if (bindings.APP_ENV !== "staging") {
    return errorResult(403, "DATA_NOT_LICENSED", "staging resolver is unavailable", input.requestId, asOf);
  }
  if (!AUTH_SUBJECT_PATTERN.test(input.authSubject)) {
    return errorResult(403, "AUTH_REQUIRED", "authenticated subject is invalid", input.requestId, asOf);
  }
  if (!/^hkex_security_\d{5}$/u.test(input.instrumentId)) {
    return errorResult(400, "SCOPE_DENIED", "instrument id is invalid", input.requestId, asOf);
  }
  return undefined;
}

function validateFinancialFactsInput(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityFinancialFactsResolverInput,
  asOf: string,
): AuthenticatedNetquityFinancialFactsResolverRpcResult | undefined {
  if (bindings.APP_ENV !== "staging") {
    return errorResult(403, "DATA_NOT_LICENSED", "staging resolver is unavailable", input.requestId, asOf);
  }
  if (!AUTH_SUBJECT_PATTERN.test(input.authSubject)) {
    return errorResult(403, "AUTH_REQUIRED", "authenticated subject is invalid", input.requestId, asOf);
  }
  if (!/^hkex_security_\d{5}$/u.test(input.instrumentId)) {
    return errorResult(400, "SCOPE_DENIED", "instrument id is invalid", input.requestId, asOf);
  }
  return undefined;
}

function validateQuoteSnapshotInput(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityQuoteSnapshotResolverInput,
  asOf: string,
): AuthenticatedNetquityQuoteSnapshotResolverRpcResult | undefined {
  if (bindings.APP_ENV !== "staging") {
    return errorResult(403, "DATA_NOT_LICENSED", "staging resolver is unavailable", input.requestId, asOf);
  }
  if (!AUTH_SUBJECT_PATTERN.test(input.authSubject)) {
    return errorResult(403, "AUTH_REQUIRED", "authenticated subject is invalid", input.requestId, asOf);
  }
  if (!/^hkex_security_\d{5}$/u.test(input.instrumentId)) {
    return errorResult(400, "SCOPE_DENIED", "instrument id is invalid", input.requestId, asOf);
  }
  return undefined;
}

function validateCorporateActionsInput(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityCorporateActionsResolverInput,
  asOf: string,
): AuthenticatedNetquityCorporateActionsResolverRpcResult | undefined {
  if (bindings.APP_ENV !== "staging") {
    return errorResult(403, "DATA_NOT_LICENSED", "staging resolver is unavailable", input.requestId, asOf);
  }
  if (!AUTH_SUBJECT_PATTERN.test(input.authSubject)) {
    return errorResult(403, "AUTH_REQUIRED", "authenticated subject is invalid", input.requestId, asOf);
  }
  if (!/^hkex_security_\d{5}$/u.test(input.instrumentId)) {
    return errorResult(400, "SCOPE_DENIED", "instrument id is invalid", input.requestId, asOf);
  }
  return undefined;
}

function validateSdiDisclosureInput(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquitySdiDisclosureResolverInput,
  asOf: string,
): AuthenticatedNetquitySdiDisclosureResolverRpcResult | undefined {
  if (bindings.APP_ENV !== "staging") {
    return errorResult(403, "DATA_NOT_LICENSED", "staging resolver is unavailable", input.requestId, asOf);
  }
  if (!AUTH_SUBJECT_PATTERN.test(input.authSubject)) {
    return errorResult(403, "AUTH_REQUIRED", "authenticated subject is invalid", input.requestId, asOf);
  }
  if (!/^hkex_security_\d{5}$/u.test(input.instrumentId)) {
    return errorResult(400, "SCOPE_DENIED", "instrument id is invalid", input.requestId, asOf);
  }
  return undefined;
}

function validateDirectorateInput(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityDirectorateResolverInput,
  asOf: string,
): AuthenticatedNetquityDirectorateResolverRpcResult | undefined {
  if (bindings.APP_ENV !== "staging") {
    return errorResult(403, "DATA_NOT_LICENSED", "staging resolver is unavailable", input.requestId, asOf);
  }
  if (!AUTH_SUBJECT_PATTERN.test(input.authSubject)) {
    return errorResult(403, "AUTH_REQUIRED", "authenticated subject is invalid", input.requestId, asOf);
  }
  if (!/^hkex_security_\d{5}$/u.test(input.instrumentId)) {
    return errorResult(400, "SCOPE_DENIED", "instrument id is invalid", input.requestId, asOf);
  }
  return undefined;
}

function validateOwnershipInput(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityOwnershipResolverInput,
  asOf: string,
): AuthenticatedNetquityOwnershipResolverRpcResult | undefined {
  if (bindings.APP_ENV !== "staging") {
    return errorResult(403, "DATA_NOT_LICENSED", "staging resolver is unavailable", input.requestId, asOf);
  }
  if (!AUTH_SUBJECT_PATTERN.test(input.authSubject)) {
    return errorResult(403, "AUTH_REQUIRED", "authenticated subject is invalid", input.requestId, asOf);
  }
  if (!/^hkex_security_\d{5}$/u.test(input.instrumentId)) {
    return errorResult(400, "SCOPE_DENIED", "instrument id is invalid", input.requestId, asOf);
  }
  return undefined;
}

function validateRelatedWarrantsInput(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityRelatedWarrantsResolverInput,
  asOf: string,
): AuthenticatedNetquityRelatedWarrantsResolverRpcResult | undefined {
  if (bindings.APP_ENV !== "staging") {
    return errorResult(403, "DATA_NOT_LICENSED", "staging resolver is unavailable", input.requestId, asOf);
  }
  if (!AUTH_SUBJECT_PATTERN.test(input.authSubject)) {
    return errorResult(403, "AUTH_REQUIRED", "authenticated subject is invalid", input.requestId, asOf);
  }
  if (!/^hkex_security_\d{5}$/u.test(input.instrumentId)) {
    return errorResult(400, "SCOPE_DENIED", "instrument id is invalid", input.requestId, asOf);
  }
  return undefined;
}

function validateDerivedMetricsInput(
  bindings: AuthenticatedNetquityResolverBindings,
  input: AuthenticatedNetquityDerivedMetricsResolverInput,
  asOf: string,
): AuthenticatedNetquityDerivedMetricsResolverRpcResult | undefined {
  if (bindings.APP_ENV !== "staging") {
    return errorResult(403, "DATA_NOT_LICENSED", "staging resolver is unavailable", input.requestId, asOf);
  }
  if (!AUTH_SUBJECT_PATTERN.test(input.authSubject)) {
    return errorResult(403, "AUTH_REQUIRED", "authenticated subject is invalid", input.requestId, asOf);
  }
  if (!/^hkex_security_\d{5}$/u.test(input.instrumentId)) {
    return errorResult(400, "SCOPE_DENIED", "instrument id is invalid", input.requestId, asOf);
  }
  return undefined;
}

// Return type is intentionally the bare { envelope: ErrorEnvelope; status }
// shape (not AuthenticatedNetquityResolverRpcResult) so this one helper is
// structurally assignable at both the resolve_security and resolve_profile
// call sites: ErrorEnvelope carries no TData and is a member of
// ResponseEnvelope<T> for any T.
function errorResult(
  status: 400 | 403 | 409 | 424 | 500,
  code: "AUTH_REQUIRED" | "DATA_NOT_LICENSED" | "DATA_QUALITY_HOLD" | "INTERNAL_ERROR" | "SCOPE_DENIED" | "TOO_MANY_ROWS",
  message: string,
  requestId: string,
  asOf: string,
  dataVersion?: string,
  rows = 0,
): { envelope: ErrorEnvelope; status: 400 | 403 | 409 | 424 | 500 } {
  return {
    envelope: createErrorEnvelope(code, message, {
      asOf,
      dataVersion,
      methodologyVersion: AUTHENTICATED_NETQUITY_WEB_RESOLVER_VERSION,
      requestId,
      usage: { cached: false, credits: 0, rows },
    }),
    status,
  };
}

function normalizeSnapshotAsOf(value: Date | string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ResolveLiveSecurityReadbackError(
      "MALFORMED_LIVE_ROW",
      "released snapshot as-of is malformed",
    );
  }
  return parsed.toISOString();
}

function normalizeTimestamp(value: Date | string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("entitlement timestamp is malformed");
  return parsed.toISOString();
}
