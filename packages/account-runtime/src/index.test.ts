import { describe, expect, it } from "vitest";
import {
  createAccountSessionPlan,
  createAuthorizedSessionMemoryPlan,
  createSubscriptionLifecyclePlan,
  getAccountRuntimeCapabilities,
  getPackagePricingCatalog,
  getPackagePricingCapabilities,
  getSubscriptionLifecycleCapabilities
} from "./index";

describe("account runtime scaffold", () => {
  it("reports no-live account/session/manual-plan capabilities", () => {
    expect(getAccountRuntimeCapabilities()).toMatchObject({
      auth_provider_calls: false,
      frontend: false,
      package: "@aiphabee/account-runtime",
      persistent_writes: false,
      route: "POST /account/session/plan",
      runtime_route: "GET /account/runtime",
      status: "internal_account_session_manual_plan_scaffold"
    });
    expect(getAccountRuntimeCapabilities().login_methods).toEqual([
      "email_passwordless",
      "social_google",
      "social_github"
    ]);
    expect(getAccountRuntimeCapabilities().manual_plan_assignment.allowed_plan_codes).toContain(
      "developer"
    );
    expect(getAccountRuntimeCapabilities().package_pricing).toMatchObject({
      billing_provider_calls: false,
      currency: "HKD",
      frontend: false,
      live_prices: false,
      persistent_writes: false,
      route: "GET /account/package-pricing",
      status: "package_pricing_scaffold"
    });
    expect(getAccountRuntimeCapabilities().authorized_memory).toMatchObject({
      actual_memory_reads: false,
      audit_event: "account.authorized_memory.plan",
      editable: true,
      persistent_writes: false,
      route: "POST /account/authorized-memory/plan",
      status: "authorized_session_memory_scaffold",
      table: "core.authorized_session_memory",
      user_visible_controls: ["view", "edit", "delete"],
      version: "2026-06-21.phase3.authorized-session-memory-scaffold.v0"
    });
    expect(getAccountRuntimeCapabilities().authorized_memory.allowed_keys).toContain(
      "preferred_locale"
    );
    expect(getAccountRuntimeCapabilities().authorized_memory.forbidden_payloads).toEqual(
      expect.arrayContaining([
        "raw_prompt",
        "generated_answer",
        "financial_fact_value",
        "oauth_access_token",
        "session_secret"
      ])
    );
  });

  it("reports Pro and Developer package pricing assumptions without live billing", () => {
    expect(getPackagePricingCapabilities()).toMatchObject({
      billing_provider_calls: false,
      currency: "HKD",
      frontend: false,
      live_prices: false,
      package: "@aiphabee/account-runtime",
      persistent_writes: false,
      route: "GET /account/package-pricing",
      runtime_route: "GET /account/runtime",
      sql_emitted: false,
      status: "package_pricing_scaffold",
      version: "2026-06-21.phase3.package-pricing-scaffold.v0"
    });
    expect(getPackagePricingCapabilities().plan_codes).toEqual(["pro", "developer"]);

    const catalog = getPackagePricingCatalog();
    const pro = catalog.plans.find((plan) => plan.plan_code === "pro");
    const developer = catalog.plans.find((plan) => plan.plan_code === "developer");

    expect(catalog).toMatchObject({
      billing_provider_calls: false,
      currency: "HKD",
      persistent_writes: false,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(catalog.assumptions).toContain("not_final_quote");
    expect(pro).toMatchObject({
      amount_minor: 22800,
      display_price: "HK$228",
      price_status: "validation_assumption_not_final_quote"
    });
    expect(pro?.entitlements).toMatchObject({
      api_key: false,
      bulk_pagination: false,
      full_30y_authorized_history: true,
      p0_tools: "all"
    });
    expect(pro?.usage_quota).toMatchObject({
      credit_limit: 5000,
      quota_contract: "deploy/usage/quota-display.contract.json"
    });
    expect(developer).toMatchObject({
      amount_minor: 68800,
      display_price: "HK$688+",
      price_status: "validation_assumption_not_final_quote"
    });
    expect(developer?.entitlements).toMatchObject({
      api_key: true,
      bulk_pagination: true,
      multiple_mcp_connections: true,
      pro_web_entitlements: true
    });
    expect(developer?.overage).toMatchObject({
      billing_provider_calls: false,
      enabled: true,
      status: "planned_no_write"
    });
    expect(developer?.redistribution).toMatchObject({
      commercial_external_redistribution: false,
      export_requires_field_authorization: true,
      partner_rights_matrix_required: true
    });
  });

  it("plans an internal login session and manual workspace plan without writes", () => {
    const plan = createAccountSessionPlan({
      accountId: "acct_internal_001",
      deviceId: "device_macbook_001",
      emailHash: "sha256:internal-user-hash",
      loginMethod: "email_passwordless",
      planCode: "developer",
      requestId: "req_account_001",
      role: "owner",
      sessionId: "sess_internal_001",
      workspaceId: "ws_internal_alpha"
    });

    expect(plan).toMatchObject({
      auth_provider_calls: false,
      persistent_writes: false,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(plan.account).toMatchObject({
      account_id: "acct_internal_001",
      email_hash_provided: true,
      table: "core.account"
    });
    expect(plan.session).toMatchObject({
      action: "login",
      cookie_issued: false,
      login_method: "email_passwordless",
      session_id: "sess_internal_001"
    });
    expect(plan.manual_plan).toMatchObject({
      assignment_status: "planned_no_write",
      billing_provider_calls: false,
      plan_code: "developer",
      subscription_id: "sub_ws_internal_alpha_developer"
    });
  });

  it("blocks planning when account/workspace context is missing", () => {
    const plan = createAccountSessionPlan({
      requestId: "req_missing_context"
    });

    expect(plan).toMatchObject({
      status: "blocked_missing_context"
    });
    expect(plan.account.account_id).toBe("account_unresolved");
    expect(plan.workspace.workspace_id).toBe("workspace_unresolved");
    expect(plan.validation.required_context_present).toBe(false);
  });

  it("plans authorized session memory view and upsert without storing prompt or financial data", () => {
    const viewPlan = createAuthorizedSessionMemoryPlan({
      accountId: "acct_internal_001",
      action: "view",
      memoryKeys: ["preferred_locale", "response_depth"],
      requestId: "req_authorized_memory_view",
      workspaceId: "ws_internal_alpha"
    });
    const upsertPlan = createAuthorizedSessionMemoryPlan({
      accountId: "acct_internal_001",
      action: "upsert",
      allowedFields: ["memory_key", "authorized_scope", "consent_state"],
      memoryKey: "authorized_tool_scopes",
      requestId: "req_authorized_memory_upsert",
      workspaceId: "ws_internal_alpha"
    });

    expect(viewPlan).toMatchObject({
      persistent_writes: false,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(viewPlan.memory).toMatchObject({
      allowed_keys: ["preferred_locale", "response_depth"],
      delete_status: "not_requested",
      read_status: "planned_no_live_read",
      table: "core.authorized_session_memory",
      upsert_status: "not_requested"
    });
    expect(viewPlan.policy).toMatchObject({
      actual_memory_reads: false,
      authorized_information_only: true,
      credential_material_stored: false,
      financial_values_stored: false,
      generated_answers_stored: false,
      raw_prompt_stored: false,
      user_visible_controls: ["view", "edit", "delete"]
    });
    expect(viewPlan.policy.forbidden_payload_fields).toContain("raw_prompt");
    expect(upsertPlan.memory).toMatchObject({
      allowed_fields: ["memory_key", "authorized_scope", "consent_state"],
      allowed_keys: ["authorized_tool_scopes"],
      read_status: "not_requested",
      upsert_status: "planned_no_write"
    });
    expect(upsertPlan.audit).toMatchObject({
      audit_event: "account.authorized_memory.plan",
      request_id: "req_authorized_memory_upsert",
      write_status: "planned_no_write"
    });
  });

  it("plans authorized session memory delete and blocks unsupported memory keys", () => {
    const deletePlan = createAuthorizedSessionMemoryPlan({
      accountId: "acct_internal_001",
      action: "delete",
      memoryKey: "mcp_scope_consent",
      requestId: "req_authorized_memory_delete",
      workspaceId: "ws_internal_alpha"
    });
    const unsupportedPlan = createAuthorizedSessionMemoryPlan({
      accountId: "acct_internal_001",
      action: "upsert",
      memoryKey: "last_research_answer",
      requestId: "req_authorized_memory_unsupported",
      workspaceId: "ws_internal_alpha"
    });

    expect(deletePlan.status).toBe("planned_no_write");
    expect(deletePlan.memory).toMatchObject({
      allowed_keys: ["mcp_scope_consent"],
      delete_status: "planned_no_write",
      upsert_status: "not_requested"
    });
    expect(unsupportedPlan.status).toBe("blocked_unsupported_memory_key");
    expect(unsupportedPlan.memory.unsupported_keys).toEqual(["last_research_answer"]);
    expect(unsupportedPlan.validation.unsupported_memory_keys).toEqual([
      "last_research_answer"
    ]);
  });

  it("reports subscription lifecycle audit capabilities without billing provider calls", () => {
    expect(getSubscriptionLifecycleCapabilities()).toMatchObject({
      billing_provider_calls: false,
      frontend: false,
      package: "@aiphabee/account-runtime",
      persistent_writes: false,
      route: "POST /account/subscription/lifecycle/plan",
      runtime_route: "GET /account/runtime",
      sql_emitted: false,
      status: "subscription_lifecycle_audit_scaffold"
    });
    expect(getSubscriptionLifecycleCapabilities().supported_actions).toEqual([
      "upgrade",
      "downgrade",
      "renew",
      "cancel",
      "enter_grace_period",
      "exit_grace_period"
    ]);
    expect(getSubscriptionLifecycleCapabilities().audit).toMatchObject({
      event_table: "audit.subscription_lifecycle_event",
      required: true,
      status: "planned_no_write"
    });
  });

  it("plans auditable subscription lifecycle changes without writes", () => {
    const plan = createSubscriptionLifecyclePlan({
      accountId: "acct_internal_001",
      action: "upgrade",
      currentBillingState: "active",
      currentPlanCode: "plus",
      effectiveAt: "2026-07-01T00:00:00.000Z",
      reason: "user_requested_upgrade",
      requestId: "req_subscription_upgrade",
      subscriptionId: "sub_ws_internal_alpha_plus",
      targetPlanCode: "developer",
      workspaceId: "ws_internal_alpha"
    });

    expect(plan).toMatchObject({
      persistent_writes: false,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(plan.subscription).toMatchObject({
      current_billing_state: "active",
      current_plan_code: "plus",
      lifecycle_status: "planned_no_write",
      subscription_id: "sub_ws_internal_alpha_plus",
      target_billing_state: "active",
      target_plan_code: "developer"
    });
    expect(plan.audit).toMatchObject({
      action: "upgrade",
      audit_event: "account.subscription.lifecycle.plan",
      actor_account_id: "acct_internal_001",
      request_id: "req_subscription_upgrade",
      table: "audit.subscription_lifecycle_event",
      write_status: "planned_no_write"
    });
    expect(plan.billing_provider).toMatchObject({
      calls: false,
      invoice_preview: false,
      provider: "not_configured"
    });
  });

  it("marks cancel and grace-period actions as auditable billing state transitions", () => {
    const cancelPlan = createSubscriptionLifecyclePlan({
      accountId: "acct_internal_001",
      action: "cancel",
      currentBillingState: "active",
      currentPlanCode: "team",
      requestId: "req_subscription_cancel",
      subscriptionId: "sub_ws_internal_alpha_team",
      targetPlanCode: "team",
      workspaceId: "ws_internal_alpha"
    });
    const gracePlan = createSubscriptionLifecyclePlan({
      accountId: "acct_internal_001",
      action: "enter_grace_period",
      currentBillingState: "active",
      currentPlanCode: "developer",
      gracePeriodEndsAt: "2026-07-08T00:00:00.000Z",
      requestId: "req_subscription_grace",
      subscriptionId: "sub_ws_internal_alpha_developer",
      targetPlanCode: "developer",
      workspaceId: "ws_internal_alpha"
    });

    expect(cancelPlan.subscription.target_billing_state).toBe("canceled");
    expect(gracePlan.subscription.target_billing_state).toBe("grace_period");
    expect(gracePlan.subscription.grace_period_ends_at).toBe("2026-07-08T00:00:00.000Z");
  });

  it("blocks subscription lifecycle planning when required audit context is missing", () => {
    const plan = createSubscriptionLifecyclePlan({
      accountId: "acct_internal_001",
      requestId: "req_subscription_missing",
      workspaceId: "ws_internal_alpha"
    });

    expect(plan.status).toBe("blocked_missing_context");
    expect(plan.validation.required_context_present).toBe(false);
    expect(plan.subscription.subscription_id).toBe("sub_ws_internal_alpha_free");
    expect(plan.audit.write_status).toBe("planned_no_write");
  });
});
