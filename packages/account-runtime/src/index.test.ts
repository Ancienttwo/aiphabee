import { describe, expect, it } from "vitest";
import {
  createAccountDataRequestPlan,
  createAccountSessionPlan,
  createAuthorizedSessionMemoryPlan,
  createEnterpriseControlsPlan,
  createSubscriptionLifecyclePlan,
  getAccountDataRequestCapabilities,
  getAccountRuntimeCapabilities,
  getEnterpriseControlsCapabilities,
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
    expect(getAccountRuntimeCapabilities().enterprise_controls).toMatchObject({
      frontend: false,
      live_directory_sync: false,
      live_identity_provider_calls: false,
      live_private_connector_calls: false,
      persistent_writes: false,
      route: "POST /account/enterprise-controls/plan",
      sql_emitted: false,
      status: "enterprise_controls_scaffold"
    });
    expect(getAccountRuntimeCapabilities().enterprise_controls.supported_controls).toEqual([
      "seats",
      "sso",
      "audit",
      "private_data_connector"
    ]);
    expect(getAccountRuntimeCapabilities().data_requests).toMatchObject({
      frontend: false,
      live_data_export: false,
      persistent_writes: false,
      route: "POST /account/data-requests/plan",
      status: "account_data_request_scaffold",
      version: "2026-06-21.phase3.account-data-request-scaffold.v0"
    });
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

  it("reports Team and Enterprise controls without live providers", () => {
    expect(getEnterpriseControlsCapabilities()).toMatchObject({
      frontend: false,
      live_directory_sync: false,
      live_identity_provider_calls: false,
      live_private_connector_calls: false,
      package: "@aiphabee/account-runtime",
      persistent_writes: false,
      route: "POST /account/enterprise-controls/plan",
      runtime_route: "GET /account/runtime",
      sql_emitted: false,
      status: "enterprise_controls_scaffold",
      version: "2026-06-22.phase4.enterprise-controls-scaffold.v0"
    });
    expect(getEnterpriseControlsCapabilities().plan_codes).toEqual(["team", "enterprise"]);
    expect(getEnterpriseControlsCapabilities().supported_controls).toEqual([
      "seats",
      "sso",
      "audit",
      "private_data_connector"
    ]);
    expect(getEnterpriseControlsCapabilities().sso).toMatchObject({
      credential_material_stored: false,
      identity_provider_calls: false,
      protocols: ["saml", "oidc"],
      table: "core.enterprise_sso_config"
    });
    expect(getEnterpriseControlsCapabilities().private_data_connector).toMatchObject({
      credential_material_stored: false,
      rights_gateway_required: true,
      table: "core.private_data_connector"
    });
  });

  it("reports account data request capabilities with retention policy controls", () => {
    expect(getAccountDataRequestCapabilities()).toMatchObject({
      frontend: false,
      live_data_export: false,
      package: "@aiphabee/account-runtime",
      persistent_writes: false,
      route: "POST /account/data-requests/plan",
      runtime_route: "GET /account/runtime",
      sql_emitted: false,
      status: "account_data_request_scaffold",
      user_visible_controls: ["download", "delete_request", "status"],
      version: "2026-06-21.phase3.account-data-request-scaffold.v0"
    });
    expect(getAccountDataRequestCapabilities().request_actions).toEqual(["download", "delete"]);
    expect(getAccountDataRequestCapabilities().retention_policy).toMatchObject({
      retention_hold_scopes: ["subscription_billing", "usage_ledger", "audit_log"],
      source: "docs/researches/AiphaBee_PRD_v1.0.md#ACC-05"
    });
    expect(getAccountDataRequestCapabilities().audit).toMatchObject({
      event_table: "audit.account_data_request_event",
      required: true,
      status: "planned_no_write"
    });
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

  it("plans account data download requests without live export or writes", () => {
    const plan = createAccountDataRequestPlan({
      accountId: "acct_internal_001",
      action: "download",
      requestedAt: "2026-06-21T12:00:00.000Z",
      requestId: "req_account_data_download",
      requestScopes: ["account_profile", "authorized_memory", "usage_ledger"],
      retentionPolicyVersion: "retention-v1",
      verifiedBy: "support_agent_001",
      workspaceId: "ws_internal_alpha"
    });

    expect(plan).toMatchObject({
      persistent_writes: false,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(plan.request).toMatchObject({
      request_id: "req_account_data_download",
      request_status: "planned_no_write",
      scopes: ["account_profile", "authorized_memory", "usage_ledger"],
      table: "core.account_data_request"
    });
    expect(plan.delivery).toMatchObject({
      download_format: "json",
      download_status: "planned_no_write",
      secure_delivery_required: true
    });
    expect(plan.execution_plan.map((step) => step.action)).toEqual(["export", "export", "export"]);
    expect(plan.audit).toMatchObject({
      audit_event: "account.data_request.plan",
      policy_version: "retention-v1",
      table: "audit.account_data_request_event",
      verified_by: "support_agent_001",
      write_status: "planned_no_write"
    });
    expect(plan.privacy).toMatchObject({
      credential_material_included: false,
      raw_email_included: false,
      raw_prompt_included: false,
      retained_for_audit_scopes: ["usage_ledger"]
    });
  });

  it("plans Team and Enterprise seats SSO audit and private data connectors without writes", () => {
    const plan = createEnterpriseControlsPlan({
      accountId: "acct_enterprise_admin_001",
      planCode: "enterprise",
      privateConnectorKind: "customer_warehouse",
      privateConnectorName: "warehouse_readonly_alpha",
      requestedControls: ["seats", "sso", "audit", "private_data_connector"],
      requestId: "req_enterprise_controls",
      seatLimit: 250,
      ssoDomainHash: "sha256:domain-hash",
      ssoProtocol: "saml",
      workspaceId: "ws_enterprise_alpha"
    });

    expect(plan).toMatchObject({
      frontend: false,
      live_directory_sync: false,
      live_identity_provider_calls: false,
      live_private_connector_calls: false,
      persistent_writes: false,
      plan_code: "enterprise",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(plan.requested_controls).toEqual([
      "seats",
      "sso",
      "audit",
      "private_data_connector"
    ]);
    expect(plan.controls.seats).toMatchObject({
      directory_sync_status: "planned_no_live",
      pending_invite_count: 3,
      requested: true,
      seat_limit: 250,
      table: "core.enterprise_seat_assignment",
      write_status: "planned_no_write"
    });
    expect(plan.controls.sso).toMatchObject({
      credential_material_stored: false,
      domain_hash_provided: true,
      identity_provider_calls: false,
      metadata_validation_status: "planned_no_live",
      protocol: "saml",
      write_status: "planned_no_write"
    });
    expect(plan.controls.audit).toMatchObject({
      event_table: "audit.enterprise_admin_event",
      export_status: "planned_no_write",
      raw_payload_stored: false,
      retention_required: true
    });
    expect(plan.controls.private_data_connector).toMatchObject({
      connection_test_status: "planned_no_live",
      connector_kind: "customer_warehouse",
      connector_name: "warehouse_readonly_alpha",
      credential_material_stored: false,
      rights_gateway_required: true,
      write_status: "planned_no_write"
    });
    expect(plan.security).toEqual({
      credential_material_stored: false,
      default_deny_until_approved: true,
      partner_rights_matrix_required: true,
      raw_connection_string_included: false,
      raw_email_included: false
    });
    expect(plan.validation).toMatchObject({
      enterprise_plan_required: true,
      required_context_present: true,
      unsupported_controls: []
    });
  });

  it("blocks enterprise controls for non-enterprise plans and unsupported controls", () => {
    const proPlan = createEnterpriseControlsPlan({
      accountId: "acct_internal_001",
      planCode: "pro",
      requestId: "req_enterprise_controls_pro",
      workspaceId: "ws_internal_alpha"
    });
    const unsupportedPlan = createEnterpriseControlsPlan({
      accountId: "acct_internal_001",
      planCode: "team",
      requestedControls: ["seats", "raw_admin_export"],
      requestId: "req_enterprise_controls_unsupported",
      workspaceId: "ws_internal_alpha"
    });

    expect(proPlan.status).toBe("blocked_enterprise_plan_required");
    expect(proPlan.validation.allowed_plan_codes).toEqual(["team", "enterprise"]);
    expect(proPlan.persistent_writes).toBe(false);
    expect(unsupportedPlan.status).toBe("blocked_unsupported_control");
    expect(unsupportedPlan.validation.unsupported_controls).toEqual(["raw_admin_export"]);
    expect(unsupportedPlan.controls.seats.write_status).toBe("not_requested");
  });

  it("plans account data deletion with retention holds and blocks unsupported scopes", () => {
    const deletePlan = createAccountDataRequestPlan({
      accountId: "acct_internal_001",
      action: "delete",
      requestedAt: "2026-06-21T12:00:00.000Z",
      requestId: "req_account_data_delete",
      requestScopes: ["account_profile", "subscription_billing", "audit_log"],
      retentionPolicyVersion: "retention-v1",
      workspaceId: "ws_internal_alpha"
    });
    const unsupportedPlan = createAccountDataRequestPlan({
      accountId: "acct_internal_001",
      action: "delete",
      requestedAt: "2026-06-21T12:00:00.000Z",
      requestId: "req_account_data_unsupported",
      requestScopes: ["account_profile", "raw_prompt_archive"],
      retentionPolicyVersion: "retention-v1",
      workspaceId: "ws_internal_alpha"
    });

    expect(deletePlan.status).toBe("planned_no_write");
    expect(deletePlan.execution_plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "schedule_erasure",
          scope: "account_profile"
        }),
        expect.objectContaining({
          action: "retain",
          scope: "subscription_billing"
        }),
        expect.objectContaining({
          action: "retain",
          scope: "audit_log"
        })
      ])
    );
    expect(deletePlan.retention_policy).toMatchObject({
      erasure_policy: "delete_or_anonymize_when_not_retained",
      retention_hold_scopes: ["subscription_billing", "usage_ledger", "audit_log"]
    });
    expect(unsupportedPlan.status).toBe("blocked_unsupported_scope");
    expect(unsupportedPlan.request.unsupported_scopes).toEqual(["raw_prompt_archive"]);
    expect(unsupportedPlan.validation.unsupported_scopes).toEqual(["raw_prompt_archive"]);
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
