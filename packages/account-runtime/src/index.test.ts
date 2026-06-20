import { describe, expect, it } from "vitest";
import {
  createAccountSessionPlan,
  getAccountRuntimeCapabilities
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
});
