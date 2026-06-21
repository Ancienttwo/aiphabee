import { describe, expect, it } from "vitest";
import {
  createAccountSessionPlan,
  createSubscriptionLifecyclePlan,
  getAccountRuntimeCapabilities,
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
