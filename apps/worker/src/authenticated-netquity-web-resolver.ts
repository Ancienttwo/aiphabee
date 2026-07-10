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
  type ResponseEnvelope,
} from "@aiphabee/data-contracts";
import {
  ResolveLiveSecurityReadbackError,
  normalizeExactSecurityLookup,
  resolveLiveSecurityRows,
  type ResolveLiveSecurityResult,
  type ResolveLiveSecurityRow,
} from "@aiphabee/security-tools";
import { Client, type QueryResult } from "pg";

export const AUTHENTICATED_NETQUITY_WEB_RESOLVER_VERSION =
  "2026-07-11.authenticated-netquity-web-resolver.v1";
export const NETQUITY_SECURITY_RIGHTS_POLICY_VERSION =
  "netquity-collaboration-staging.v1";
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

function hasExactFieldAuthority(rows: RightsRow[]): boolean {
  if (rows.some((row) => !AUTHENTICATED_NETQUITY_REQUIRED_FIELD_SET.has(row.field_pattern))) {
    return false;
  }
  const representedFields = new Set(rows.map((row) => row.field_pattern));
  return AUTHENTICATED_NETQUITY_REQUIRED_FIELDS.every((field) => representedFields.has(field));
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

function errorResult(
  status: 400 | 403 | 409 | 424 | 500,
  code: "AUTH_REQUIRED" | "DATA_NOT_LICENSED" | "DATA_QUALITY_HOLD" | "INTERNAL_ERROR" | "SCOPE_DENIED" | "TOO_MANY_ROWS",
  message: string,
  requestId: string,
  asOf: string,
  dataVersion?: string,
  rows = 0,
): AuthenticatedNetquityResolverRpcResult {
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
