import { describe, expect, it } from "vitest";
import {
  createLicensedAdviceExplorationPlan,
  getLicensedAdviceExplorationCapabilities,
  getLicensedAdviceRuntimeCapabilities
} from "./index";

describe("licensed advice runtime scaffold", () => {
  it("reports runtime capabilities with advice generation disabled", () => {
    expect(getLicensedAdviceRuntimeCapabilities()).toMatchObject({
      advice_generation_enabled: false,
      auth_required: true,
      default_status: "blocked_until_licensed_path_confirmed",
      frontend: false,
      live_model_execution: false,
      order_execution: false,
      package: "@aiphabee/licensed-advice-runtime",
      persistent_writes: false,
      route: "GET /compliance/licensed-advice/runtime",
      runtime_route: "GET /compliance/licensed-advice/runtime",
      sql_emitted: false,
      status: "licensed_advice_exploration_scaffold"
    });
    expect(getLicensedAdviceRuntimeCapabilities().exploration_plan).toMatchObject({
      advice_generation_enabled: false,
      route: "POST /compliance/licensed-advice/exploration/plan",
      status: "licensed_advice_exploration_scaffold"
    });
  });

  it("reports licensed advice exploration capabilities and forbidden outputs", () => {
    const capability = getLicensedAdviceExplorationCapabilities();

    expect(capability).toMatchObject({
      advice_generation_enabled: false,
      frontend: false,
      live_model_execution: false,
      order_execution: false,
      persistent_writes: false,
      route: "POST /compliance/licensed-advice/exploration/plan",
      sql_emitted: false,
      status: "licensed_advice_exploration_scaffold"
    });
    expect(capability.allowed_surfaces).toEqual([
      "personalized_buy_sell_hold",
      "portfolio_rebalance",
      "position_sizing",
      "suitability_based_recommendation",
      "licensed_partner_referral"
    ]);
    expect(capability.forbidden_unlicensed_outputs).toEqual([
      "buy_sell_hold_recommendation",
      "target_position_size",
      "personalized_suitability_conclusion",
      "order_routing",
      "copy_trading_instruction"
    ]);
    expect(capability.required_controls).toContain("type4_written_opinion");
    expect(capability.tables).toEqual([
      "aiphabee_core.licensed_advice_exploration",
      "aiphabee_core.suitability_control_profile",
      "aiphabee_audit.licensed_advice_review_event",
      "aiphabee_governance.licensed_advice_exploration_contract"
    ]);
  });

  it("plans licensed advice exploration without generating advice output", () => {
    const plan = createLicensedAdviceExplorationPlan({
      adviceRecordRetentionPolicyId: "retention_policy_001",
      complaintHandlingPolicyId: "complaint_policy_001",
      humanReviewQueueId: "human_review_queue_001",
      killSwitchPolicyId: "kill_switch_policy_001",
      legalReviewStatus: "approved",
      licensedEntityId: "licensed_entity_001",
      proposedSurface: "suitability_based_recommendation",
      requestId: "req-licensed-advice",
      responsibleOfficerId: "ro_001",
      suitabilityProfileSchemaId: "suitability_schema_001",
      type4WrittenOpinionId: "type4_opinion_001",
      workspaceId: "ws_compliance_alpha"
    });

    expect(plan).toMatchObject({
      frontend: false,
      live_model_execution: false,
      order_execution: false,
      persistent_writes: false,
      request_id: "req-licensed-advice",
      sql_emitted: false,
      status: "planned_no_write",
      workspace_id: "ws_compliance_alpha"
    });
    expect(plan.advice_output_policy).toEqual({
      buy_sell_hold_recommendation: false,
      copy_trading_instruction: false,
      evidence_only_fallback: true,
      order_routing: false,
      personalized_suitability_conclusion: false,
      research_tool_boundary_preserved_until_licensed: true,
      target_position_size: false
    });
    expect(plan.legal_review).toMatchObject({
      external_legal_opinion_required: true,
      legal_review_status: "approved",
      type4_written_opinion_id: "type4_opinion_001"
    });
    expect(plan.legal_review.regulatory_source_urls).toHaveLength(2);
    expect(plan.licensed_path).toMatchObject({
      licensed_entity_id: "licensed_entity_001",
      proposed_surface: "suitability_based_recommendation",
      responsible_officer_id: "ro_001",
      route2_source: "docs/researches/AiphaBee_PRD_v1.0.md#14.2",
      supervision_required: true
    });
    expect(plan.suitability_controls).toMatchObject({
      advice_record_retention_policy_id: "retention_policy_001",
      complaint_handling_policy_id: "complaint_policy_001",
      human_review_queue_id: "human_review_queue_001",
      suitability_profile_schema_id: "suitability_schema_001",
      suitability_required: true
    });
    expect(plan.compliance_controls).toMatchObject({
      answer_evidence_route: "POST /agent/runs/validate-answer",
      compliance_release_gate_route: "POST /public/release-gates/compliance-ops/plan",
      kill_switch_policy_id: "kill_switch_policy_001",
      kill_switch_route: "POST /agent/kill-switch/plan"
    });
    expect(plan.usage.rows).toBe(8);
  });

  it("blocks exploration when the licensed path is not confirmed", () => {
    const plan = createLicensedAdviceExplorationPlan({
      proposedSurface: "personalized_buy_sell_hold",
      requestId: "req-unlicensed",
      workspaceId: "ws_compliance_alpha"
    });

    expect(plan.status).toBe("blocked_unlicensed_path");
    expect(plan.validation.licensed_path_present).toBe(false);
    expect(plan.validation.legal_review_approved).toBe(false);
    expect(plan.advice_output_policy.buy_sell_hold_recommendation).toBe(false);
    expect(plan.usage.rows).toBe(0);
  });

  it("blocks missing suitability or supervision controls after licensing evidence", () => {
    const missingSuitability = createLicensedAdviceExplorationPlan({
      complaintHandlingPolicyId: "complaint_policy_001",
      killSwitchPolicyId: "kill_switch_policy_001",
      legalReviewStatus: "approved",
      licensedEntityId: "licensed_entity_001",
      proposedSurface: "position_sizing",
      requestId: "req-missing-suitability",
      responsibleOfficerId: "ro_001",
      type4WrittenOpinionId: "type4_opinion_001",
      workspaceId: "ws_compliance_alpha"
    });
    expect(missingSuitability.status).toBe("blocked_suitability_controls_missing");
    expect(missingSuitability.validation.suitability_controls_present).toBe(false);

    const missingSupervision = createLicensedAdviceExplorationPlan({
      adviceRecordRetentionPolicyId: "retention_policy_001",
      humanReviewQueueId: "human_review_queue_001",
      legalReviewStatus: "approved",
      licensedEntityId: "licensed_entity_001",
      proposedSurface: "position_sizing",
      requestId: "req-missing-supervision",
      suitabilityProfileSchemaId: "suitability_schema_001",
      type4WrittenOpinionId: "type4_opinion_001",
      workspaceId: "ws_compliance_alpha"
    });
    expect(missingSupervision.status).toBe("blocked_supervision_controls_missing");
    expect(missingSupervision.validation.supervision_controls_present).toBe(false);
  });

  it("blocks missing context and unsupported advice surfaces", () => {
    expect(
      createLicensedAdviceExplorationPlan({
        requestId: "req-missing-context",
        type4WrittenOpinionId: "type4_opinion_001"
      }).status
    ).toBe("blocked_missing_context");

    const unsupported = createLicensedAdviceExplorationPlan({
      proposedSurface: "auto_trade_execution",
      requestId: "req-unsupported",
      workspaceId: "ws_compliance_alpha"
    });

    expect(unsupported.status).toBe("blocked_unsupported_surface");
    expect(unsupported.validation.unsupported_surfaces).toEqual(["auto_trade_execution"]);
    expect(unsupported.order_execution).toBe(false);
  });
});
