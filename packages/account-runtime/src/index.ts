export const ACCOUNT_RUNTIME_VERSION =
  "2026-06-21.phase1.internal-account-session-manual-plan.v0";

export const ACCOUNT_LOGIN_METHODS = [
  "email_passwordless",
  "social_google",
  "social_github"
] as const;

export const ACCOUNT_PLAN_CODES = [
  "free",
  "plus",
  "pro",
  "developer",
  "team",
  "enterprise"
] as const;

export type AccountLoginMethod = (typeof ACCOUNT_LOGIN_METHODS)[number];
export type AccountPlanCode = (typeof ACCOUNT_PLAN_CODES)[number];
export type AccountSessionAction =
  | "login"
  | "logout"
  | "refresh"
  | "revoke_device"
  | "revoke_session";
export type AccountRole = "admin" | "billing" | "member" | "owner" | "viewer";
export type AccountSessionPlanStatus = "blocked_missing_context" | "planned_no_write";

export interface AccountSessionPlanInput {
  accountId?: string;
  action?: AccountSessionAction;
  deviceId?: string;
  emailHash?: string;
  loginMethod?: AccountLoginMethod;
  planCode?: AccountPlanCode;
  requestId: string;
  role?: AccountRole;
  sessionId?: string;
  workspaceId?: string;
}

export interface AccountRuntimeCapabilities {
  auth_provider_calls: false;
  device_management: {
    audit_event: "account.device.plan";
    revoke_supported: true;
    status: "planned_no_write";
  };
  forbidden_payloads: readonly [
    "raw_email",
    "password",
    "oauth_access_token",
    "oauth_refresh_token",
    "session_secret"
  ];
  frontend: false;
  login_methods: readonly AccountLoginMethod[];
  manual_plan_assignment: {
    allowed_plan_codes: readonly AccountPlanCode[];
    billing_provider_calls: false;
    status: "planned_no_write";
  };
  package: "@aiphabee/account-runtime";
  persistent_writes: false;
  route: "POST /account/session/plan";
  runtime_route: "GET /account/runtime";
  session_management: {
    cookie_issued: false;
    revoke_supported: true;
    status: "planned_no_write";
  };
  status: "internal_account_session_manual_plan_scaffold";
  tables: readonly [
    "core.account",
    "core.workspace",
    "core.workspace_membership",
    "core.subscription_plan",
    "core.workspace_subscription"
  ];
  version: typeof ACCOUNT_RUNTIME_VERSION;
}

export interface AccountSessionPlan {
  account: {
    account_id: string;
    email_hash_provided: boolean;
    status: "active" | "unresolved";
    table: "core.account";
  };
  auth_provider_calls: false;
  device: {
    audit_event: "account.device.plan";
    device_binding_status: "planned_no_write";
    device_id: string;
    revoke_supported: true;
  };
  manual_plan: {
    assignment_status: "not_requested" | "planned_no_write";
    billing_provider_calls: false;
    billing_state: "active";
    plan_code?: AccountPlanCode;
    subscription_id?: string;
    table: "core.workspace_subscription";
  };
  persistent_writes: false;
  session: {
    action: AccountSessionAction;
    audit_event: "account.session.plan";
    cookie_issued: false;
    login_method: AccountLoginMethod;
    session_id: string;
    session_write_status: "planned_no_write";
  };
  sql_emitted: false;
  status: AccountSessionPlanStatus;
  tables: AccountRuntimeCapabilities["tables"];
  validation: {
    required_context_present: boolean;
    requires_email_hash_not_raw_email: true;
    unsupported_payload_fields: AccountRuntimeCapabilities["forbidden_payloads"];
  };
  version: typeof ACCOUNT_RUNTIME_VERSION;
  workspace: {
    membership_id: string;
    role: AccountRole;
    table: "core.workspace_membership";
    workspace_id: string;
    workspace_status: "active" | "unresolved";
  };
}

const ACCOUNT_TABLES: AccountRuntimeCapabilities["tables"] = [
  "core.account",
  "core.workspace",
  "core.workspace_membership",
  "core.subscription_plan",
  "core.workspace_subscription"
];

const FORBIDDEN_PAYLOADS: AccountRuntimeCapabilities["forbidden_payloads"] = [
  "raw_email",
  "password",
  "oauth_access_token",
  "oauth_refresh_token",
  "session_secret"
];

export function getAccountRuntimeCapabilities(): AccountRuntimeCapabilities {
  return {
    auth_provider_calls: false,
    device_management: {
      audit_event: "account.device.plan",
      revoke_supported: true,
      status: "planned_no_write"
    },
    forbidden_payloads: FORBIDDEN_PAYLOADS,
    frontend: false,
    login_methods: ACCOUNT_LOGIN_METHODS,
    manual_plan_assignment: {
      allowed_plan_codes: ACCOUNT_PLAN_CODES,
      billing_provider_calls: false,
      status: "planned_no_write"
    },
    package: "@aiphabee/account-runtime",
    persistent_writes: false,
    route: "POST /account/session/plan",
    runtime_route: "GET /account/runtime",
    session_management: {
      cookie_issued: false,
      revoke_supported: true,
      status: "planned_no_write"
    },
    status: "internal_account_session_manual_plan_scaffold",
    tables: ACCOUNT_TABLES,
    version: ACCOUNT_RUNTIME_VERSION
  };
}

export function createAccountSessionPlan(
  input: AccountSessionPlanInput
): AccountSessionPlan {
  const accountId = normalizeIdentifier(input.accountId, "account_unresolved");
  const workspaceId = normalizeIdentifier(input.workspaceId, "workspace_unresolved");
  const sessionId = normalizeIdentifier(
    input.sessionId,
    `session_plan_${sanitizeForId(input.requestId)}`
  );
  const deviceId = normalizeIdentifier(
    input.deviceId,
    `device_plan_${sanitizeForId(input.requestId)}`
  );
  const role = input.role ?? "owner";
  const action = input.action ?? "login";
  const loginMethod = input.loginMethod ?? "email_passwordless";
  const requiredContextPresent =
    input.accountId !== undefined &&
    input.accountId.length > 0 &&
    input.workspaceId !== undefined &&
    input.workspaceId.length > 0;

  return {
    account: {
      account_id: accountId,
      email_hash_provided: input.emailHash !== undefined && input.emailHash.length > 0,
      status: requiredContextPresent ? "active" : "unresolved",
      table: "core.account"
    },
    auth_provider_calls: false,
    device: {
      audit_event: "account.device.plan",
      device_binding_status: "planned_no_write",
      device_id: deviceId,
      revoke_supported: true
    },
    manual_plan: {
      assignment_status: input.planCode === undefined ? "not_requested" : "planned_no_write",
      billing_provider_calls: false,
      billing_state: "active",
      plan_code: input.planCode,
      subscription_id:
        input.planCode === undefined
          ? undefined
          : `sub_${sanitizeForId(workspaceId)}_${input.planCode}`,
      table: "core.workspace_subscription"
    },
    persistent_writes: false,
    session: {
      action,
      audit_event: "account.session.plan",
      cookie_issued: false,
      login_method: loginMethod,
      session_id: sessionId,
      session_write_status: "planned_no_write"
    },
    sql_emitted: false,
    status: requiredContextPresent ? "planned_no_write" : "blocked_missing_context",
    tables: ACCOUNT_TABLES,
    validation: {
      required_context_present: requiredContextPresent,
      requires_email_hash_not_raw_email: true,
      unsupported_payload_fields: FORBIDDEN_PAYLOADS
    },
    version: ACCOUNT_RUNTIME_VERSION,
    workspace: {
      membership_id: `membership_${sanitizeForId(accountId)}_${sanitizeForId(workspaceId)}`,
      role,
      table: "core.workspace_membership",
      workspace_id: workspaceId,
      workspace_status: requiredContextPresent ? "active" : "unresolved"
    }
  };
}

function normalizeIdentifier(value: string | undefined, fallback: string): string {
  return value !== undefined && value.length > 0 ? value : fallback;
}

function sanitizeForId(value: string): string {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
  return sanitized.length > 0 ? sanitized : "unresolved";
}
