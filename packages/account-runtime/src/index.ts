export const ACCOUNT_RUNTIME_VERSION =
  "2026-06-21.phase1.internal-account-session-manual-plan.v0";
export const SUBSCRIPTION_LIFECYCLE_VERSION =
  "2026-06-21.phase2.subscription-lifecycle-audit.v0";
export const AUTHORIZED_SESSION_MEMORY_VERSION =
  "2026-06-21.phase3.authorized-session-memory-scaffold.v0";
export const PACKAGE_PRICING_VERSION =
  "2026-06-21.phase3.package-pricing-scaffold.v0";

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
export const AUTHORIZED_SESSION_MEMORY_ACTIONS = ["view", "upsert", "delete"] as const;
export const AUTHORIZED_SESSION_MEMORY_KEYS = [
  "authorized_tool_scopes",
  "data_retention_acknowledgement",
  "default_currency",
  "default_workspace_id",
  "mcp_scope_consent",
  "preferred_locale",
  "response_depth",
  "watchlist_briefing_consent"
] as const;
export const PACKAGE_PRICING_PLAN_CODES = ["pro", "developer"] as const;
export const PACKAGE_PRICING_USAGE_CHANNELS = ["web_agent", "mcp"] as const;

export type AccountLoginMethod = (typeof ACCOUNT_LOGIN_METHODS)[number];
export type AccountPlanCode = (typeof ACCOUNT_PLAN_CODES)[number];
export type SubscriptionLifecycleAction = (typeof SUBSCRIPTION_LIFECYCLE_ACTIONS)[number];
export type AuthorizedSessionMemoryAction =
  (typeof AUTHORIZED_SESSION_MEMORY_ACTIONS)[number];
export type AuthorizedSessionMemoryKey = (typeof AUTHORIZED_SESSION_MEMORY_KEYS)[number];
export type PackagePricingPlanCode = (typeof PACKAGE_PRICING_PLAN_CODES)[number];
export type PackagePricingUsageChannel = (typeof PACKAGE_PRICING_USAGE_CHANNELS)[number];
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
export type AuthorizedSessionMemoryPlanStatus =
  | "blocked_missing_context"
  | "blocked_unsupported_memory_key"
  | "planned_no_write";

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

export interface AuthorizedSessionMemoryPlanInput {
  accountId?: string;
  action?: AuthorizedSessionMemoryAction;
  allowedFields?: string[];
  memoryKey?: string;
  memoryKeys?: string[];
  requestId: string;
  workspaceId?: string;
}

export interface AccountRuntimeCapabilities {
  auth_provider_calls: false;
  authorized_memory: {
    actual_memory_reads: false;
    allowed_keys: typeof AUTHORIZED_SESSION_MEMORY_KEYS;
    audit_event: "account.authorized_memory.plan";
    editable: true;
    forbidden_payloads: readonly [
      "raw_prompt",
      "generated_answer",
      "financial_fact_value",
      "price_value",
      "valuation_value",
      "raw_email",
      "password",
      "oauth_access_token",
      "oauth_refresh_token",
      "session_secret"
    ];
    persistent_writes: false;
    route: "POST /account/authorized-memory/plan";
    status: "authorized_session_memory_scaffold";
    supported_actions: typeof AUTHORIZED_SESSION_MEMORY_ACTIONS;
    table: "core.authorized_session_memory";
    user_visible_controls: readonly ["view", "edit", "delete"];
    version: typeof AUTHORIZED_SESSION_MEMORY_VERSION;
  };
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
  package_pricing: PackagePricingCapabilities;
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

export interface PackagePricingCapabilities {
  billing_provider_calls: false;
  currency: "HKD";
  frontend: false;
  live_prices: false;
  package: "@aiphabee/account-runtime";
  persistent_writes: false;
  plan_codes: typeof PACKAGE_PRICING_PLAN_CODES;
  pricing_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.2";
  route: "GET /account/package-pricing";
  runtime_route: "GET /account/runtime";
  sql_emitted: false;
  status: "package_pricing_scaffold";
  tables: readonly [
    "core.subscription_plan",
    "core.plan_pricing_catalog",
    "core.plan_entitlement_bundle",
    "governance.package_pricing_contract"
  ];
  usage_channels: typeof PACKAGE_PRICING_USAGE_CHANNELS;
  validation_required_after: readonly [
    "data_authorization_cost_review",
    "target_market_interview",
    "unit_economics_margin_review"
  ];
  version: typeof PACKAGE_PRICING_VERSION;
}

export interface PackagePricingCatalogPlan {
  amount_minor: number;
  billing_period: "monthly";
  currency: "HKD";
  display_price: string;
  entitlements: {
    api_key: boolean;
    bulk_pagination: boolean;
    deep_report: boolean;
    event_study: boolean;
    full_30y_authorized_history: boolean;
    multiple_mcp_connections: boolean;
    p0_tools: "all";
    pro_web_entitlements: boolean;
  };
  mcp_entitlements: readonly string[];
  overage: {
    billing_provider_calls: false;
    enabled: boolean;
    high_cost_confirmation_required: boolean;
    reconciliation_contract: "deploy/usage/billing-reconciliation.contract.json";
    status: "not_available" | "planned_no_write";
  };
  plan_code: PackagePricingPlanCode;
  price_status: "validation_assumption_not_final_quote";
  redistribution: {
    commercial_external_redistribution: false;
    export_requires_field_authorization: true;
    partner_rights_matrix_required: true;
  };
  target_user: string;
  usage_quota: {
    credit_limit: number;
    quota_contract: "deploy/usage/quota-display.contract.json";
    quota_source: "@aiphabee/usage-ledger";
    usage_channels: typeof PACKAGE_PRICING_USAGE_CHANNELS;
  };
  web_entitlements: readonly string[];
}

export interface PackagePricingCatalog {
  assumptions: readonly [
    "product_validation_price",
    "not_final_quote",
    "requires_data_authorization_cost_review",
    "requires_target_market_interview"
  ];
  billing_provider_calls: false;
  catalog_version: typeof PACKAGE_PRICING_VERSION;
  currency: "HKD";
  persistent_writes: false;
  plan_codes: typeof PACKAGE_PRICING_PLAN_CODES;
  plans: readonly [PackagePricingCatalogPlan, PackagePricingCatalogPlan];
  pricing_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.2";
  runtime_capability: PackagePricingCapabilities;
  sql_emitted: false;
  status: "planned_no_write";
  tables: PackagePricingCapabilities["tables"];
  version: typeof PACKAGE_PRICING_VERSION;
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

export interface AuthorizedSessionMemoryPlan {
  account: {
    account_id: string;
    table: "core.account";
  };
  action: AuthorizedSessionMemoryAction;
  audit: {
    audit_event: "account.authorized_memory.plan";
    audit_event_id: string;
    request_id: string;
    write_status: "planned_no_write";
  };
  memory: {
    allowed_fields: string[];
    allowed_keys: AuthorizedSessionMemoryKey[];
    delete_status: "not_requested" | "planned_no_write";
    memory_refs: string[];
    read_status: "not_requested" | "planned_no_live_read";
    table: "core.authorized_session_memory";
    unsupported_keys: string[];
    upsert_status: "not_requested" | "planned_no_write";
  };
  persistent_writes: false;
  policy: {
    actual_memory_reads: false;
    authorized_information_only: true;
    credential_material_stored: false;
    financial_values_stored: false;
    forbidden_payload_fields: AccountRuntimeCapabilities["authorized_memory"]["forbidden_payloads"];
    generated_answers_stored: false;
    raw_prompt_stored: false;
    user_visible_controls: readonly ["view", "edit", "delete"];
  };
  sql_emitted: false;
  status: AuthorizedSessionMemoryPlanStatus;
  tables: readonly [
    "core.account",
    "core.workspace",
    "core.workspace_membership",
    "core.authorized_session_memory"
  ];
  validation: {
    allowed_memory_keys: typeof AUTHORIZED_SESSION_MEMORY_KEYS;
    required_context_present: boolean;
    unsupported_memory_keys: string[];
  };
  version: typeof AUTHORIZED_SESSION_MEMORY_VERSION;
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
const AUTHORIZED_SESSION_MEMORY_TABLES: AuthorizedSessionMemoryPlan["tables"] = [
  "core.account",
  "core.workspace",
  "core.workspace_membership",
  "core.authorized_session_memory"
];
const PACKAGE_PRICING_TABLES: PackagePricingCapabilities["tables"] = [
  "core.subscription_plan",
  "core.plan_pricing_catalog",
  "core.plan_entitlement_bundle",
  "governance.package_pricing_contract"
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
const AUTHORIZED_MEMORY_FORBIDDEN_PAYLOADS: AccountRuntimeCapabilities["authorized_memory"]["forbidden_payloads"] = [
  "raw_prompt",
  "generated_answer",
  "financial_fact_value",
  "price_value",
  "valuation_value",
  "raw_email",
  "password",
  "oauth_access_token",
  "oauth_refresh_token",
  "session_secret"
];

const PACKAGE_PRICING_VALIDATION_REQUIRED: PackagePricingCapabilities["validation_required_after"] = [
  "data_authorization_cost_review",
  "target_market_interview",
  "unit_economics_margin_review"
];

export function getAccountRuntimeCapabilities(): AccountRuntimeCapabilities {
  return {
    auth_provider_calls: false,
    authorized_memory: {
      actual_memory_reads: false,
      allowed_keys: AUTHORIZED_SESSION_MEMORY_KEYS,
      audit_event: "account.authorized_memory.plan",
      editable: true,
      forbidden_payloads: AUTHORIZED_MEMORY_FORBIDDEN_PAYLOADS,
      persistent_writes: false,
      route: "POST /account/authorized-memory/plan",
      status: "authorized_session_memory_scaffold",
      supported_actions: AUTHORIZED_SESSION_MEMORY_ACTIONS,
      table: "core.authorized_session_memory",
      user_visible_controls: ["view", "edit", "delete"],
      version: AUTHORIZED_SESSION_MEMORY_VERSION
    },
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
    package_pricing: getPackagePricingCapabilities(),
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

export function getPackagePricingCapabilities(): PackagePricingCapabilities {
  return {
    billing_provider_calls: false,
    currency: "HKD",
    frontend: false,
    live_prices: false,
    package: "@aiphabee/account-runtime",
    persistent_writes: false,
    plan_codes: PACKAGE_PRICING_PLAN_CODES,
    pricing_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.2",
    route: "GET /account/package-pricing",
    runtime_route: "GET /account/runtime",
    sql_emitted: false,
    status: "package_pricing_scaffold",
    tables: PACKAGE_PRICING_TABLES,
    usage_channels: PACKAGE_PRICING_USAGE_CHANNELS,
    validation_required_after: PACKAGE_PRICING_VALIDATION_REQUIRED,
    version: PACKAGE_PRICING_VERSION
  };
}

export function getPackagePricingCatalog(): PackagePricingCatalog {
  return {
    assumptions: [
      "product_validation_price",
      "not_final_quote",
      "requires_data_authorization_cost_review",
      "requires_target_market_interview"
    ],
    billing_provider_calls: false,
    catalog_version: PACKAGE_PRICING_VERSION,
    currency: "HKD",
    persistent_writes: false,
    plan_codes: PACKAGE_PRICING_PLAN_CODES,
    plans: [
      {
        amount_minor: 22800,
        billing_period: "monthly",
        currency: "HKD",
        display_price: "HK$228",
        entitlements: {
          api_key: false,
          bulk_pagination: false,
          deep_report: true,
          event_study: true,
          full_30y_authorized_history: true,
          multiple_mcp_connections: false,
          p0_tools: "all",
          pro_web_entitlements: true
        },
        mcp_entitlements: ["higher_quota", "all_p0_tools"],
        overage: {
          billing_provider_calls: false,
          enabled: false,
          high_cost_confirmation_required: true,
          reconciliation_contract: "deploy/usage/billing-reconciliation.contract.json",
          status: "not_available"
        },
        plan_code: "pro",
        price_status: "validation_assumption_not_final_quote",
        redistribution: {
          commercial_external_redistribution: false,
          export_requires_field_authorization: true,
          partner_rights_matrix_required: true
        },
        target_user: "senior_individual_investor",
        usage_quota: {
          credit_limit: 5000,
          quota_contract: "deploy/usage/quota-display.contract.json",
          quota_source: "@aiphabee/usage-ledger",
          usage_channels: PACKAGE_PRICING_USAGE_CHANNELS
        },
        web_entitlements: [
          "full_30y_authorized_history",
          "comparison",
          "screening",
          "event_study",
          "deep_report"
        ]
      },
      {
        amount_minor: 68800,
        billing_period: "monthly",
        currency: "HKD",
        display_price: "HK$688+",
        entitlements: {
          api_key: true,
          bulk_pagination: true,
          deep_report: true,
          event_study: true,
          full_30y_authorized_history: true,
          multiple_mcp_connections: true,
          p0_tools: "all",
          pro_web_entitlements: true
        },
        mcp_entitlements: [
          "pro_web_entitlements",
          "multiple_connections",
          "api_key",
          "bulk_pagination",
          "overage_billing"
        ],
        overage: {
          billing_provider_calls: false,
          enabled: true,
          high_cost_confirmation_required: true,
          reconciliation_contract: "deploy/usage/billing-reconciliation.contract.json",
          status: "planned_no_write"
        },
        plan_code: "developer",
        price_status: "validation_assumption_not_final_quote",
        redistribution: {
          commercial_external_redistribution: false,
          export_requires_field_authorization: true,
          partner_rights_matrix_required: true
        },
        target_user: "ai_power_user_individual_developer",
        usage_quota: {
          credit_limit: 10000,
          quota_contract: "deploy/usage/quota-display.contract.json",
          quota_source: "@aiphabee/usage-ledger",
          usage_channels: PACKAGE_PRICING_USAGE_CHANNELS
        },
        web_entitlements: ["pro_web_entitlements"]
      }
    ],
    pricing_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.2",
    runtime_capability: getPackagePricingCapabilities(),
    sql_emitted: false,
    status: "planned_no_write",
    tables: PACKAGE_PRICING_TABLES,
    version: PACKAGE_PRICING_VERSION
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

export function createAuthorizedSessionMemoryPlan(
  input: AuthorizedSessionMemoryPlanInput
): AuthorizedSessionMemoryPlan {
  const accountId = normalizeIdentifier(input.accountId, "account_unresolved");
  const workspaceId = normalizeIdentifier(input.workspaceId, "workspace_unresolved");
  const action = input.action ?? "view";
  const requestedKeys = normalizeRequestedMemoryKeys(input);
  const allowedKeys = requestedKeys.filter(isAuthorizedSessionMemoryKey);
  const unsupportedKeys = requestedKeys.filter((key) => !isAuthorizedSessionMemoryKey(key));
  const requiredContextPresent =
    input.accountId !== undefined &&
    input.accountId.length > 0 &&
    input.workspaceId !== undefined &&
    input.workspaceId.length > 0;
  const status: AuthorizedSessionMemoryPlanStatus =
    !requiredContextPresent
      ? "blocked_missing_context"
      : unsupportedKeys.length > 0
        ? "blocked_unsupported_memory_key"
        : "planned_no_write";
  const memoryRefs = (allowedKeys.length > 0 ? allowedKeys : AUTHORIZED_SESSION_MEMORY_KEYS).map(
    (key) =>
      `authorized_memory_${sanitizeForId(accountId)}_${sanitizeForId(workspaceId)}_${sanitizeForId(
        key
      )}`
  );

  return {
    account: {
      account_id: accountId,
      table: "core.account"
    },
    action,
    audit: {
      audit_event: "account.authorized_memory.plan",
      audit_event_id: `audit_authorized_memory_${sanitizeForId(input.requestId)}_${sanitizeForId(
        action
      )}`,
      request_id: input.requestId,
      write_status: "planned_no_write"
    },
    memory: {
      allowed_fields: normalizeAllowedMemoryFields(input.allowedFields),
      allowed_keys: allowedKeys.length > 0 ? allowedKeys : [...AUTHORIZED_SESSION_MEMORY_KEYS],
      delete_status: action === "delete" && status === "planned_no_write" ? "planned_no_write" : "not_requested",
      memory_refs: memoryRefs,
      read_status: action === "view" && status === "planned_no_write" ? "planned_no_live_read" : "not_requested",
      table: "core.authorized_session_memory",
      unsupported_keys: unsupportedKeys,
      upsert_status: action === "upsert" && status === "planned_no_write" ? "planned_no_write" : "not_requested"
    },
    persistent_writes: false,
    policy: {
      actual_memory_reads: false,
      authorized_information_only: true,
      credential_material_stored: false,
      financial_values_stored: false,
      forbidden_payload_fields: AUTHORIZED_MEMORY_FORBIDDEN_PAYLOADS,
      generated_answers_stored: false,
      raw_prompt_stored: false,
      user_visible_controls: ["view", "edit", "delete"]
    },
    sql_emitted: false,
    status,
    tables: AUTHORIZED_SESSION_MEMORY_TABLES,
    validation: {
      allowed_memory_keys: AUTHORIZED_SESSION_MEMORY_KEYS,
      required_context_present: requiredContextPresent,
      unsupported_memory_keys: unsupportedKeys
    },
    version: AUTHORIZED_SESSION_MEMORY_VERSION,
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

function normalizeRequestedMemoryKeys(
  input: AuthorizedSessionMemoryPlanInput
): string[] {
  const keys = [
    ...(input.memoryKeys ?? []),
    ...(input.memoryKey === undefined ? [] : [input.memoryKey])
  ]
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
  const unique = [...new Set(keys)];

  return unique.length > 0 ? unique : [...AUTHORIZED_SESSION_MEMORY_KEYS];
}

function normalizeAllowedMemoryFields(value: string[] | undefined): string[] {
  const fields = (value ?? [
    "account_id",
    "workspace_id",
    "memory_key",
    "authorized_scope",
    "consent_state",
    "updated_at"
  ])
    .map((field) => field.trim())
    .filter((field) => field.length > 0);

  return [...new Set(fields)];
}

function isAuthorizedSessionMemoryKey(value: string): value is AuthorizedSessionMemoryKey {
  return AUTHORIZED_SESSION_MEMORY_KEYS.includes(value as AuthorizedSessionMemoryKey);
}

function normalizeIdentifier(value: string | undefined, fallback: string): string {
  return value !== undefined && value.length > 0 ? value : fallback;
}

function sanitizeForId(value: string): string {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
  return sanitized.length > 0 ? sanitized : "unresolved";
}
