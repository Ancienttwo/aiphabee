import { describe, expect, it } from "vitest";
import {
  PRIVATE_SHARE_MAX_EXPIRY_HOURS,
  PRIVACY_SHARE_RELEASE_GATE_CHECKS,
  PRIVATE_SHARING_REQUIRED_SCOPE,
  createPrivacyShareReleaseGatePlan,
  createPrivateShareLinkPlan,
  getPrivacyShareReleaseGateCapabilities,
  getPrivateSharingCapabilities
} from "./index";

describe("sharing-runtime private share links", () => {
  it("plans a private share link by rechecking recipient entitlements", () => {
    const plan = createPrivateShareLinkPlan({
      asOf: "2026-06-21T00:00:00.000Z",
      creatorAccountId: "acct_creator",
      creatorScopes: [PRIVATE_SHARING_REQUIRED_SCOPE],
      creatorWorkspaceId: "ws_creator",
      expiresInHours: 24,
      fields: ["synthetic_profile.company_name", "synthetic_profile.revenue"],
      recipientAccountId: "acct_recipient",
      recipientScopes: [PRIVATE_SHARING_REQUIRED_SCOPE],
      recipientWorkspaceId: "ws_recipient",
      requestId: "req-private-share",
      requestedRows: 5
    });

    expect(plan).toMatchObject({
      access_policy: {
        effective_fields: ["synthetic_profile.company_name"],
        recipient_data_rights_expansion: false,
        recipient_entitlement_rechecked: true,
        redacted_fields: ["synthetic_profile.revenue"],
        share_expands_recipient_rights: false
      },
      expires_at: "2026-06-22T00:00:00.000Z",
      frontend: false,
      link: {
        link_handle_materialized: false,
        public_indexing: false,
        share_ref: "planned_no_write",
        url: "not_generated",
        visibility: "private_link"
      },
      live_data_access: false,
      persistent_writes: false,
      request_id: "req-private-share",
      status: "planned_no_write"
    });
    expect(plan.gateway_decisions.creator.status).toBe("planned_no_write");
    expect(plan.gateway_decisions.recipient.status).toBe("planned_no_write");
    expect(plan.scope.creator.granted).toBe(true);
    expect(plan.scope.recipient.granted).toBe(true);
    expect(plan.watermark.text).toContain("req-private-share");
    expect(plan.usage.credits).toBe(0);
    expect(plan.usage.rows).toBe(1);
  });

  it("blocks missing recipient scope before a share can be materialized", () => {
    const plan = createPrivateShareLinkPlan({
      creatorAccountId: "acct_creator",
      creatorScopes: [PRIVATE_SHARING_REQUIRED_SCOPE],
      creatorWorkspaceId: "ws_creator",
      recipientAccountId: "acct_recipient",
      recipientScopes: [],
      recipientWorkspaceId: "ws_recipient",
      requestId: "req-recipient-scope"
    });

    expect(plan.status).toBe("blocked_recipient_missing_scope");
    expect(plan.access_policy.release_state).toBe("blocked");
    expect(plan.scope.recipient).toMatchObject({
      granted: false,
      required: PRIVATE_SHARING_REQUIRED_SCOPE
    });
  });

  it("blocks invalid expiry and missing participant context", () => {
    const invalidExpiry = createPrivateShareLinkPlan({
      creatorAccountId: "acct_creator",
      creatorScopes: [PRIVATE_SHARING_REQUIRED_SCOPE],
      creatorWorkspaceId: "ws_creator",
      expiresInHours: PRIVATE_SHARE_MAX_EXPIRY_HOURS + 1,
      recipientAccountId: "acct_recipient",
      recipientScopes: [PRIVATE_SHARING_REQUIRED_SCOPE],
      recipientWorkspaceId: "ws_recipient",
      requestId: "req-invalid-expiry"
    });
    const missingContext = createPrivateShareLinkPlan({
      creatorAccountId: "acct_creator",
      creatorScopes: [PRIVATE_SHARING_REQUIRED_SCOPE],
      creatorWorkspaceId: "ws_creator",
      recipientScopes: [PRIVATE_SHARING_REQUIRED_SCOPE],
      requestId: "req-missing-recipient"
    });

    expect(invalidExpiry.status).toBe("blocked_invalid_expiry");
    expect(invalidExpiry.validation.expiry_within_limit).toBe(false);
    expect(missingContext.status).toBe("blocked_missing_context");
    expect(missingContext.validation.required_context_present).toBe(false);
  });

  it("reports private sharing capabilities", () => {
    const capability = getPrivateSharingCapabilities();

    expect(capability).toMatchObject({
      artifact_writes: false,
      capability_name: "private_sharing_links",
      frontend: false,
      live_data_access: false,
      persistent_writes: false,
      recipient_data_rights_expansion: false,
      recipient_entitlement_recheck: true,
      required_scope: PRIVATE_SHARING_REQUIRED_SCOPE,
      route: "POST /sharing/private-links/plan",
      runtime_route: "GET /sharing/runtime",
      status: "private_share_link_scaffold",
      uses_data_access_gateway: true,
      watermark_required: true
    });
    expect(capability.supported_statuses).toContain("blocked_recipient_gateway_denied");
  });

  it("plans a privacy/share release gate without data export or rights expansion", () => {
    const plan = createPrivacyShareReleaseGatePlan({
      accountId: "acct_privacy",
      asOf: "2026-06-22T00:00:00.000Z",
      creatorAccountId: "acct_creator",
      creatorScopes: [PRIVATE_SHARING_REQUIRED_SCOPE],
      creatorWorkspaceId: "ws_creator",
      fields: ["synthetic_profile.company_name", "synthetic_profile.revenue"],
      recipientAccountId: "acct_recipient",
      recipientScopes: [PRIVATE_SHARING_REQUIRED_SCOPE],
      recipientWorkspaceId: "ws_recipient",
      requestId: "req-privacy-share",
      requestScopes: ["account_profile", "subscription_billing", "usage_ledger", "audit_log"],
      retentionPolicyVersion: "retention-v1",
      workspaceId: "ws_privacy"
    });

    expect(plan).toMatchObject({
      frontend: false,
      live_data_access: false,
      live_data_export: false,
      live_db_writes: false,
      persistent_writes: false,
      request_id: "req-privacy-share",
      route: "POST /sharing/release-gates/privacy-share/plan",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(plan.account_data_request_gate.download_plan).toMatchObject({
      delivery: {
        download_status: "planned_no_write",
        secure_delivery_required: true
      },
      persistent_writes: false,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(plan.account_data_request_gate.delete_plan.execution_plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "retain", scope: "subscription_billing" }),
        expect.objectContaining({ action: "retain", scope: "usage_ledger" }),
        expect.objectContaining({ action: "retain", scope: "audit_log" })
      ])
    );
    expect(plan.private_share_gate.no_expansion_policy).toMatchObject({
      effective_fields: ["synthetic_profile.company_name"],
      recipient_data_rights_expansion: false,
      recipient_entitlement_rechecked: true,
      redacted_fields: ["synthetic_profile.revenue"],
      share_expands_recipient_rights: false
    });
    expect(plan.private_share_gate.plan.link).toMatchObject({
      link_handle_materialized: false,
      public_indexing: false,
      url: "not_generated"
    });
    expect(plan.validation).toMatchObject({
      all_checks_passed: true,
      live_release_claimed: false,
      personal_data_delete_respects_retention_holds: true,
      personal_data_download_delivery_is_scoped_and_no_write: true,
      private_link_has_expiry_watermark_and_no_public_index: true,
      share_link_does_not_expand_rights: true,
      share_link_effective_fields_are_intersection: true,
      share_link_rechecks_recipient_entitlement: true
    });
    expect(plan.release_checks.map((check) => check.check)).toEqual([
      ...PRIVACY_SHARE_RELEASE_GATE_CHECKS
    ]);
    expect(plan.release_gate).toMatchObject({
      gate_status: "blocked_live_privacy_share_validation",
      no_live_release_claim: true,
      required_signoffs: ["security", "privacy", "data_governance", "legal"]
    });
  });

  it("reports privacy/share release gate capabilities", () => {
    expect(getPrivacyShareReleaseGateCapabilities()).toMatchObject({
      account_data_request_route: "POST /account/data-requests/plan",
      account_data_secure_delivery_required: true,
      frontend: false,
      live_data_access: false,
      live_data_export: false,
      live_db_writes: false,
      package: "@aiphabee/sharing-runtime",
      persistent_writes: false,
      private_share_route: "POST /sharing/private-links/plan",
      recipient_data_rights_expansion: false,
      recipient_entitlement_recheck: true,
      route: "POST /sharing/release-gates/privacy-share/plan",
      runtime_route: "GET /sharing/runtime",
      share_expands_recipient_rights: false,
      sql_emitted: false,
      status: "privacy_share_release_gate_scaffold",
      watermark_required: true
    });
    expect(getPrivacyShareReleaseGateCapabilities().required_checks).toEqual([
      ...PRIVACY_SHARE_RELEASE_GATE_CHECKS
    ]);
  });
});
