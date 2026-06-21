export const ACCOUNT_RUNTIME_VERSION =
  "2026-06-21.phase1.internal-account-session-manual-plan.v0";
export const SUBSCRIPTION_LIFECYCLE_VERSION =
  "2026-06-21.phase2.subscription-lifecycle-audit.v0";

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

export const SUBSCRIPTION_LIFECYCLE_ACTIONS = [
  "upgrade",
  "downgrade",
  "renew",
  "cancel",
  "enter_grace_period",
  "exit_grace_period"
] as const;

export type AccountLoginMethod = (typeof ACCOUNT_LOGIN_METHODS)[number];
export type AccountPlanCode = (typeof ACCOUNT_PLAN_CODES)[number];
export type SubscriptionLifecycleAction = (typeof SUBSCRIPTION_LIFECYCLE_ACTIONS)[number];
export type SubscriptionBillingState =
  | "active"
  | "canceled"
  | "grace_period"
  | "paused"
  | "trialing";
export type AccountSessionAction =
  | "login"
  | "logout"
  | "refresh"
  | "revoke_device"
  | "revoke_session";
export type AccountRole = "admin" | "billing" | "member" | "owner" | "viewer";
export type AccountSessionPlanStatus = "blocked_missing_context" | "planned_no_write";
export type SubscriptionLifecyclePlanStatus = "blocked_missing_context" | "planned_no_write";

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

export interface SubscriptionLifecycleCapabilities {
  audit: {
    audit_event: "account.subscription.lifecycle.plan";
    event_table: "audit.subscription_lifecycle_event";
    required: true;
    status: "planned_no_write";
  };
  billing_provider_calls: false;
  billing_states: readonly SubscriptionBillingState[];
  frontend: false;
  grace_period: {
    auditable: true;
    supported: true;
  };
  package: "@aiphabee/account-runtime";
  persistent_writes: false;
  plan_codes: readonly AccountPlanCode[];
  route: "POST /account/subscription/lifecycle/plan";
  runtime_route: "GET /account/runtime";
  sql_emitted: false;
  status: "subscription_lifecycle_audit_scaffold";
  supported_actions: readonly SubscriptionLifecycleAction[];
  tables: readonly [
    "core.account",
    "core.workspace",
    "core.subscription_plan",
    "core.workspace_subscription",
    "audit.subscription_lifecycle_event"
  ];
  version: typeof SUBSCRIPTION_LIFECYCLE_VERSION;
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

export interface SubscriptionLifecyclePlanInput {
  accountId?: string;
  action?: SubscriptionLifecycleAction;
  currentBillingState?: SubscriptionBillingState;
  currentPlanCode?: AccountPlanCode;
  effectiveAt?: string;
  gracePeriodEndsAt?: string;
  reason?: string;
  renewalPeriodEnd?: string;
  requestId: string;
  subscriptionId?: string;
  targetPlanCode?: AccountPlanCode;
  workspaceId?: string;
}

export interface SubscriptionLifecyclePlan {
  account: {
    account_id: string;
    table: "core.account";
  };
  audit: {
    action: SubscriptionLifecycleAction;
    audit_event: "account.subscription.lifecycle.plan";
    audit_event_id: string;
    actor_account_id: string;
    reason?: string;
    request_id: string;
    source_record_id: "subscription-lifecycle-plan";
    table: "audit.subscription_lifecycle_event";
    write_status: "planned_no_write";
  };
  billing_provider: {
    calls: false;
    invoice_preview: false;
    proration_preview: false;
    provider: "not_configured";
    refund_preview: false;
  };
  persistent_writes: false;
  sql_emitted: false;
  status: SubscriptionLifecyclePlanStatus;
  subscription: {
    current_billing_state: SubscriptionBillingState;
    current_plan_code: AccountPlanCode;
    effective_at: string;
    grace_period_ends_at?: string;
    lifecycle_status: "planned_no_write";
    renewal_period_end?: string;
    subscription_id: string;
    table: "core.workspace_subscription";
    target_billing_state: SubscriptionBillingState;
    target_plan_code: AccountPlanCode;
  };
  tables: SubscriptionLifecycleCapabilities["tables"];
  validation: {
    allowed_plan_codes: readonly AccountPlanCode[];
    audit_required: true;
    required_context_present: boolean;
    supported_actions: readonly SubscriptionLifecycleAction[];
  };
  version: typeof SUBSCRIPTION_LIFECYCLE_VERSION;
  workspace: {
    table: "core.workspace";
    workspace_id: string;
  };
}

const ACCOUNT_TABLES: AccountRuntimeCapabilities["tables"] = [
  "core.account",
  "core.workspace",
  "core.workspace_membership",
  "core.subscription_plan",
  "core.workspace_subscription"
];

const SUBSCRIPTION_LIFECYCLE_TABLES: SubscriptionLifecycleCapabilities["tables"] = [
  "core.account",
  "core.workspace",
  "core.subscription_plan",
  "core.workspace_subscription",
  "audit.subscription_lifecycle_event"
];

const SUBSCRIPTION_BILLING_STATES: SubscriptionLifecycleCapabilities["billing_states"] = [
  "trialing",
  "active",
  "grace_period",
  "paused",
  "canceled"
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

export function getSubscriptionLifecycleCapabilities(): SubscriptionLifecycleCapabilities {
  return {
    audit: {
      audit_event: "account.subscription.lifecycle.plan",
      event_table: "audit.subscription_lifecycle_event",
      required: true,
      status: "planned_no_write"
    },
    billing_provider_calls: false,
    billing_states: SUBSCRIPTION_BILLING_STATES,
    frontend: false,
    grace_period: {
      auditable: true,
      supported: true
    },
    package: "@aiphabee/account-runtime",
    persistent_writes: false,
    plan_codes: ACCOUNT_PLAN_CODES,
    route: "POST /account/subscription/lifecycle/plan",
    runtime_route: "GET /account/runtime",
    sql_emitted: false,
    status: "subscription_lifecycle_audit_scaffold",
    supported_actions: SUBSCRIPTION_LIFECYCLE_ACTIONS,
    tables: SUBSCRIPTION_LIFECYCLE_TABLES,
    version: SUBSCRIPTION_LIFECYCLE_VERSION
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

export function createSubscriptionLifecyclePlan(
  input: SubscriptionLifecyclePlanInput
): SubscriptionLifecyclePlan {
  const accountId = normalizeIdentifier(input.accountId, "account_unresolved");
  const workspaceId = normalizeIdentifier(input.workspaceId, "workspace_unresolved");
  const subscriptionId = normalizeIdentifier(
    input.subscriptionId,
    `sub_${sanitizeForId(workspaceId)}_${input.targetPlanCode ?? input.currentPlanCode ?? "free"}`
  );
  const action = input.action ?? "upgrade";
  const currentPlanCode = input.currentPlanCode ?? "free";
  const targetPlanCode = input.targetPlanCode ?? currentPlanCode;
  const currentBillingState = input.currentBillingState ?? "active";
  const targetBillingState = resolveTargetBillingState(action, currentBillingState);
  const effectiveAt = normalizeIdentifier(input.effectiveAt, "planned_effective_at_unresolved");
  const requiredContextPresent =
    input.accountId !== undefined &&
    input.accountId.length > 0 &&
    input.workspaceId !== undefined &&
    input.workspaceId.length > 0 &&
    input.subscriptionId !== undefined &&
    input.subscriptionId.length > 0 &&
    input.action !== undefined &&
    input.currentPlanCode !== undefined &&
    input.targetPlanCode !== undefined &&
    input.effectiveAt !== undefined &&
    input.effectiveAt.length > 0;
  const auditEventId = `audit_subscription_${sanitizeForId(input.requestId)}_${sanitizeForId(action)}`;

  return {
    account: {
      account_id: accountId,
      table: "core.account"
    },
    audit: {
      action,
      audit_event: "account.subscription.lifecycle.plan",
      audit_event_id: auditEventId,
      actor_account_id: accountId,
      reason: input.reason,
      request_id: input.requestId,
      source_record_id: "subscription-lifecycle-plan",
      table: "audit.subscription_lifecycle_event",
      write_status: "planned_no_write"
    },
    billing_provider: {
      calls: false,
      invoice_preview: false,
      proration_preview: false,
      provider: "not_configured",
      refund_preview: false
    },
    persistent_writes: false,
    sql_emitted: false,
    status: requiredContextPresent ? "planned_no_write" : "blocked_missing_context",
    subscription: {
      current_billing_state: currentBillingState,
      current_plan_code: currentPlanCode,
      effective_at: effectiveAt,
      grace_period_ends_at: input.gracePeriodEndsAt,
      lifecycle_status: "planned_no_write",
      renewal_period_end: input.renewalPeriodEnd,
      subscription_id: subscriptionId,
      table: "core.workspace_subscription",
      target_billing_state: targetBillingState,
      target_plan_code: targetPlanCode
    },
    tables: SUBSCRIPTION_LIFECYCLE_TABLES,
    validation: {
      allowed_plan_codes: ACCOUNT_PLAN_CODES,
      audit_required: true,
      required_context_present: requiredContextPresent,
      supported_actions: SUBSCRIPTION_LIFECYCLE_ACTIONS
    },
    version: SUBSCRIPTION_LIFECYCLE_VERSION,
    workspace: {
      table: "core.workspace",
      workspace_id: workspaceId
    }
  };
}

function resolveTargetBillingState(
  action: SubscriptionLifecycleAction,
  currentBillingState: SubscriptionBillingState
): SubscriptionBillingState {
  if (action === "cancel") {
    return "canceled";
  }

  if (action === "enter_grace_period") {
    return "grace_period";
  }

  if (action === "exit_grace_period" || action === "renew") {
    return "active";
  }

  return currentBillingState === "canceled" ? "active" : currentBillingState;
}

function normalizeIdentifier(value: string | undefined, fallback: string): string {
  return value !== undefined && value.length > 0 ? value : fallback;
}

function sanitizeForId(value: string): string {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
  return sanitized.length > 0 ? sanitized : "unresolved";
}
