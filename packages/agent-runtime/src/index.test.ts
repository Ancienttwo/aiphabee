import { describe, expect, it } from "vitest";
import {
  AgentRuntimeInputError,
  createAgentRunSkeleton,
  createAiSdkStopCondition,
  createPreToolCallResolution,
  createToolLoopAgentPlan,
  getAgentRuntimeCapabilities
} from "./index";

describe("agent runtime scaffold", () => {
  it("exposes AI SDK v7 dry-run capabilities without model calls", () => {
    const capabilities = getAgentRuntimeCapabilities();

    expect(capabilities.ai_sdk).toMatchObject({
      package_name: "ai",
      stop_condition: "isStepCount",
      target_version: "7.0.0-beta.182"
    });
    expect(capabilities.surfaces.model_calls).toBe(false);
    expect(capabilities.surfaces.market_data).toBe(false);
    expect(capabilities.run_context).toMatchObject({
      context_ready: true,
      entitlement_policy_source: "synthetic_default_deny",
      live_entitlement_reads: false,
      status: "agent_run_context_scaffold",
      tool_versions: true
    });
    expect(capabilities.pre_tool_call_resolution).toMatchObject({
      actual_tool_execution: false,
      clarification_supported: true,
      model_calls: false,
      required_dimensions: ["security", "time", "currency", "methodology"],
      status: "pre_tool_call_resolution_scaffold"
    });
    expect(capabilities.tool_loop_agent).toMatchObject({
      actual_tool_execution: false,
      budget_stop_policy: {
        graceful_stop: true,
        returns_continue_cost: true,
        status: "budget_stop_policy_scaffold"
      },
      chain_of_thought_exposed: false,
      max_parallel_tools: 3,
      model_calls: false,
      answer_evidence_contract: {
        evidence_card_payload: "planned",
        frontend_rendering: false,
        ordered_sections: [
          "direct_answer",
          "data_status",
          "key_evidence",
          "explanation",
          "counter_evidence_risks",
          "sources_methods",
          "next_steps",
          "disclaimer"
        ],
        required_claim_labels: ["fact", "calculation", "inference", "unknown"],
        status: "answer_evidence_contract_scaffold"
      },
      numeric_source_guard: {
        allowed_sources: ["tool_result", "deterministic_calculation"],
        concrete_numbers_allowed_without_sources: false,
        memory_numbers_allowed: false,
        post_generation_validation: "planned",
        status: "numeric_source_guard_scaffold"
      },
      planner_ready: true,
      status: "tool_loop_agent_planner_scaffold",
      tool_enforcement: {
        allow_arbitrary_sql: false,
        allow_arbitrary_url: false,
        denied_tool_behavior: "reject_request",
        permission_aware: true,
        registered_tools_only: true,
        schema_bound: true,
        status: "tool_enforcement_scaffold",
        versioned_tools: true
      },
      streaming_transport: "planned"
    });
    expect(capabilities.registered_tools).toHaveLength(9);
    expect(capabilities.registered_tools[0]).toMatchObject({
      name: "resolve_security",
      schema: {
        standardResponseEnvelope: true
      }
    });
  });

  it("creates a dry-run skeleton with registered tool policy", () => {
    const skeleton = createAgentRunSkeleton({
      channel: "web",
      entitlementPolicyVersion: "entitlement-policy-test-v0",
      maxCredits: 8,
      maxRows: 120,
      prompt: "Explain 00700.HK revenue trend",
      requestId: "req-agent-1",
      requestedTools: ["resolve_security", "get_financial_facts"],
      userId: "user_internal_alpha",
      workspaceId: "workspace_research"
    });

    expect(skeleton.status).toBe("dry_run");
    expect(skeleton.run_id).toBe("dry_req-agent-1");
    expect(skeleton.budget.max_steps).toBe(6);
    expect(skeleton.budget.max_credits).toBe(8);
    expect(skeleton.budget.max_rows).toBe(120);
    expect(skeleton.tool_policy.allow_arbitrary_sql).toBe(false);
    expect(skeleton.tool_policy.allow_arbitrary_url).toBe(false);
    expect(skeleton.tool_policy.requested_tools).toContain("resolve_security");
    expect(skeleton.tool_policy.registered_tools).toContain("get_quote_snapshot");
    expect(skeleton.run_context).toMatchObject({
      channel: "web",
      entitlements: {
        data_rights_state: "default_deny",
        live_policy_source: false,
        partner_rights_matrix_loaded: false,
        policy_version: "entitlement-policy-test-v0",
        required_scopes: ["security:read", "financials:read"]
      },
      model: {
        model_calls: false,
        tier: "dry_run"
      },
      subscription: {
        plan: "free"
      },
      user: {
        source: "request",
        user_id: "user_internal_alpha"
      },
      workspace: {
        source: "request",
        workspace_id: "workspace_research"
      }
    });
    expect(skeleton.run_context.toolset.tools).toEqual([
      expect.objectContaining({
        allow_arbitrary_sql: false,
        allow_arbitrary_url: false,
        data_classes: ["security_master"],
        execution_mode: "read_only_scaffold",
        handler_ready: true,
        input_schema_id: "tool.resolve_security.input.v0",
        live_data_access: false,
        name: "resolve_security",
        output_schema_id: "tool.resolve_security.output.v0",
        required_scope: "security:read",
        rights_aware: true,
        standard_response_envelope: true,
        status: "scaffold",
        version: "0.0.0"
      }),
      expect.objectContaining({
        allow_arbitrary_sql: false,
        allow_arbitrary_url: false,
        data_classes: ["financial_facts"],
        execution_mode: "read_only_scaffold",
        handler_ready: true,
        input_schema_id: "tool.get_financial_facts.input.v0",
        live_data_access: false,
        name: "get_financial_facts",
        output_schema_id: "tool.get_financial_facts.output.v0",
        required_scope: "financials:read",
        rights_aware: true,
        standard_response_envelope: true,
        status: "scaffold",
        version: "0.0.0"
      })
    ]);
  });

  it("rejects unregistered and arbitrary SQL/URL tools", () => {
    const attempt = () =>
      createAgentRunSkeleton({
        prompt: "Run arbitrary SQL or fetch an arbitrary URL",
        requestId: "req-agent-2",
        requestedTools: ["sql.query", "http.fetch"]
      });

    expect(attempt).toThrow(AgentRuntimeInputError);

    try {
      attempt();
    } catch (error) {
      expect(error).toBeInstanceOf(AgentRuntimeInputError);
      expect((error as AgentRuntimeInputError).details.deniedTools).toEqual([
        "sql.query",
        "http.fetch"
      ]);
    }
  });

  it("rejects step limits outside the scaffold budget", () => {
    expect(() =>
      createAgentRunSkeleton({
        maxSteps: 99,
        prompt: "Explain 00700.HK",
        requestId: "req-agent-3"
      })
    ).toThrow(AgentRuntimeInputError);
  });

  it("plans no-model tool loop steps with public progress and stop rules", () => {
    const plan = createToolLoopAgentPlan({
      maxSteps: 6,
      prompt: "Explain 00700.HK revenue and price trend",
      requestId: "req-agent-plan-1",
      requestedTools: [
        "resolve_security",
        "get_entitlements",
        "get_security_profile",
        "get_quote_snapshot",
        "get_price_history",
        "get_financial_facts",
        "get_data_lineage"
      ],
      userId: "user_internal_alpha",
      workspaceId: "workspace_research"
    });

    expect(plan.status).toBe("planned_no_model");
    expect(plan.model_calls).toBe(false);
    expect(plan.actual_tool_execution).toBe(false);
    expect(plan.chain_of_thought_exposed).toBe(false);
    expect(plan.max_parallel_tools).toBe(3);
    expect(plan.planned_step_count).toBe(6);
    expect(plan.progress_stream).toMatchObject({
      exposes_chain_of_thought: false,
      tool_progress_public: true,
      transport: "planned"
    });
    expect(plan.stop_conditions).toContain("two_consecutive_same_error");
    expect(plan.pre_tool_call_resolution).toMatchObject({
      clarification_required: false,
      status: "ready_with_assumptions"
    });
    expect(plan.pre_tool_call_resolution.security.resolved[0]).toMatchObject({
      instrument_id: "eq_hk_00700",
      symbol: "00700.HK"
    });
    expect(plan.budget_stop_policy).toMatchObject({
      decision: {
        reasons: [],
        status: "continue"
      },
      error_stop_policy: {
        consecutive_same_error_limit: 2,
        retry_billable: false,
        stops_automatic_retry: true
      },
      graceful_stop: {
        partial_response_ready: false,
        unfinished_step_ids: []
      },
      model_calls: false
    });
    expect(plan.budget_stop_policy.limit_status).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dimension: "steps",
          status: "within_budget"
        }),
        expect.objectContaining({
          dimension: "credits",
          status: "within_budget"
        })
      ])
    );
    expect(plan.answer_evidence_contract).toMatchObject({
      actual_tool_execution: false,
      answer_structure: {
        disclaimer_boundary: "not_a_substitute_for_runtime_controls",
        key_evidence_items: {
          max: 6,
          min: 3
        },
        max_direct_answer_sentences: 5,
        max_next_steps: 3,
        min_direct_answer_sentences: 2
      },
      claim_labels: {
        calculation_requires_calculation_ref: true,
        fact_requires_evidence_card: true,
        inference_requires_evidence_strength: true,
        required_labels: ["fact", "calculation", "inference", "unknown"],
        text_labels_required: true,
        ui_labels_required: true,
        unknown_requires_missing_reason: true
      },
      evidence_cards: {
        clickable_payload_contract: true,
        frontend_rendering: false
      },
      evidence_strength: {
        allowed_values: ["strong", "medium", "weak", "unknown"],
        confidence_score_display: false
      },
      frontend_rendering: false,
      model_calls: false,
      numeric_source_guard_version: "2026-06-21.phase1.numeric-source-guard-scaffold.v0",
      status: "answer_evidence_contract_scaffold",
      version: "2026-06-21.phase1.answer-evidence-contract-scaffold.v0"
    });
    expect(plan.answer_evidence_contract.answer_structure.ordered_sections).toEqual([
      expect.objectContaining({ order: 1, section_id: "direct_answer", source: "prd_8_3" }),
      expect.objectContaining({ order: 2, section_id: "data_status", source: "prd_8_3" }),
      expect.objectContaining({ order: 3, section_id: "key_evidence", source: "prd_8_3" }),
      expect.objectContaining({ order: 4, section_id: "explanation", source: "prd_8_3" }),
      expect.objectContaining({
        order: 5,
        section_id: "counter_evidence_risks",
        source: "prd_8_3"
      }),
      expect.objectContaining({ order: 6, section_id: "sources_methods", source: "prd_8_3" }),
      expect.objectContaining({ order: 7, section_id: "next_steps", source: "prd_8_3" }),
      expect.objectContaining({ order: 8, section_id: "disclaimer", source: "prd_8_3" })
    ]);
    expect(plan.answer_evidence_contract.evidence_cards.required_fields).toEqual([
      "card_id",
      "claim_id",
      "label",
      "source_record_id",
      "data_point",
      "document_location",
      "as_of",
      "data_version",
      "methodology_version",
      "currency",
      "unit",
      "evidence_strength",
      "warnings"
    ]);
    expect(plan.answer_evidence_contract.evidence_cards.planned_card_sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          card_type: "data_point",
          output_schema_id: "tool.get_quote_snapshot.output.v0",
          source_record_required: true,
          tool_name: "get_quote_snapshot",
          version: "0.0.0"
        }),
        expect.objectContaining({
          card_type: "data_point",
          output_schema_id: "tool.get_financial_facts.output.v0",
          source_record_required: true,
          tool_name: "get_financial_facts",
          version: "0.0.0"
        }),
        expect.objectContaining({
          card_type: "lineage",
          output_schema_id: "tool.get_data_lineage.output.v0",
          source_record_required: true,
          tool_name: "get_data_lineage",
          version: "0.0.0"
        })
      ])
    );
    expect(plan.answer_evidence_contract.validation_rules).toEqual([
      "require_ordered_answer_sections",
      "require_layer_label_per_claim",
      "require_evidence_card_ref_for_fact",
      "require_calculation_ref_for_calculation",
      "label_missing_data_unknown",
      "block_unsourced_specific_numbers"
    ]);
    expect(plan.numeric_source_guard).toMatchObject({
      actual_tool_execution: false,
      allowed_sources: ["tool_result", "deterministic_calculation"],
      answer_contract: {
        concrete_financial_numbers_allowed: false,
        failure_code: "UNSOURCED_NUMERIC_CLAIM",
        memory_generated_numbers_allowed: false,
        requires_calculation_ref: true,
        requires_source_record_ref: true,
        unsupported_numeric_claim_behavior: "block_answer_claim",
        unknown_value_label: "unknown"
      },
      blocked_sources: ["model_memory", "training_data", "unverified_prompt", "unstated_source"],
      concrete_claims_allowed_now: false,
      model_calls: false,
      post_generation_validation: "planned",
      status: "guarded_no_actual_results",
      version: "2026-06-21.phase1.numeric-source-guard-scaffold.v0"
    });
    expect(plan.numeric_source_guard.validation_rules).toEqual([
      "extract_numeric_claims",
      "require_tool_result_or_calculation_ref",
      "block_model_memory_numbers",
      "label_missing_numbers_unknown"
    ]);
    expect(plan.numeric_source_guard.planned_tool_result_sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data_classes: ["quote_snapshot"],
          output_schema_id: "tool.get_quote_snapshot.output.v0",
          source_record_required: true,
          tool_name: "get_quote_snapshot",
          version: "0.0.0"
        }),
        expect.objectContaining({
          data_classes: ["financial_facts"],
          output_schema_id: "tool.get_financial_facts.output.v0",
          source_record_required: true,
          tool_name: "get_financial_facts",
          version: "0.0.0"
        })
      ])
    );
    expect(plan.numeric_source_guard.deterministic_calculations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          calculation_id: "deterministic_return_risk_v0",
          input_source: "tool_result",
          required_source_tools: ["get_price_history"]
        }),
        expect.objectContaining({
          calculation_id: "deterministic_financial_growth_v0",
          input_source: "tool_result",
          required_source_tools: ["get_financial_facts"]
        })
      ])
    );
    expect(plan.tool_enforcement).toMatchObject({
      actual_tool_execution: false,
      allow_arbitrary_sql: false,
      allow_arbitrary_url: false,
      all_checks_passed: true,
      denied_tools: [],
      model_calls: false,
      permission_aware: true,
      registered_tool_count: 9,
      registry_version: "2026-06-21.phase1.shared-tool-registry-scaffold.v0",
      requested_tools: [
        "resolve_security",
        "get_entitlements",
        "get_security_profile",
        "get_quote_snapshot",
        "get_price_history",
        "get_financial_facts",
        "get_data_lineage"
      ],
      schema_bound: true,
      status: "allowed",
      version: "2026-06-21.phase1.tool-enforcement-scaffold.v0",
      versioned_tools: true
    });
    expect(plan.tool_enforcement.required_checks).toEqual([
      "registered",
      "versioned",
      "schema_bound",
      "permission_scope",
      "rights_aware",
      "no_arbitrary_sql",
      "no_arbitrary_url",
      "read_only_no_live_data"
    ]);
    expect(plan.tool_enforcement.tool_checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          allow_arbitrary_sql: false,
          allow_arbitrary_url: false,
          data_classes: ["financial_facts"],
          input_schema_id: "tool.get_financial_facts.input.v0",
          live_data_access: false,
          name: "get_financial_facts",
          output_schema_id: "tool.get_financial_facts.output.v0",
          permission_scope: "financials:read",
          registered: true,
          rights_aware: true,
          schema_bound: true,
          standard_response_envelope: true,
          status: "allowed",
          version: "0.0.0",
          versioned: true
        })
      ])
    );
    expect(plan.retry_policy).toMatchObject({
      consecutive_same_error_limit: 2,
      max_attempts_per_tool: 2,
      retry_billable: false
    });
    expect(plan.steps.map((step) => step.phase)).toEqual([
      "security_resolution",
      "entitlement_gate",
      "data_fetch",
      "data_fetch",
      "evidence_binding",
      "answer_contract"
    ]);
    expect(plan.steps.find((step) => step.phase === "data_fetch")?.tool_calls).toHaveLength(3);
    expect(plan.steps.every((step) => step.tool_calls.length <= 3)).toBe(true);
    expect(plan.steps.flatMap((step) => step.tool_calls).map((tool) => tool.name)).toEqual([
      "resolve_security",
      "get_entitlements",
      "get_security_profile",
      "get_quote_snapshot",
      "get_price_history",
      "get_financial_facts",
      "get_data_lineage"
    ]);
    expect(
      plan.steps
        .flatMap((step) => step.tool_calls)
        .every(
          (tool) =>
            !tool.allow_arbitrary_sql &&
            !tool.allow_arbitrary_url &&
            tool.rights_aware &&
            tool.standard_response_envelope &&
            tool.version.length > 0
        )
    ).toBe(true);
  });

  it("gracefully stops tool loop plans when the requested step budget is exhausted", () => {
    const plan = createToolLoopAgentPlan({
      maxSteps: 3,
      prompt: "Explain 00700.HK revenue and price trend",
      requestId: "req-agent-plan-budget",
      requestedTools: [
        "resolve_security",
        "get_entitlements",
        "get_security_profile",
        "get_quote_snapshot",
        "get_price_history",
        "get_financial_facts",
        "get_data_lineage"
      ]
    });

    expect(plan.status).toBe("stopped_budget");
    expect(plan.planned_step_count).toBe(3);
    expect(plan.steps.map((step) => step.phase)).toEqual([
      "security_resolution",
      "entitlement_gate",
      "answer_contract"
    ]);
    expect(plan.steps[2]).toMatchObject({
      public_label: "Return graceful budget stop response",
      tool_calls: []
    });
    expect(plan.budget_stop_policy.decision).toMatchObject({
      reasons: ["steps"],
      status: "stop_before_execution",
      stop_before_step: 3
    });
    expect(plan.budget_stop_policy.graceful_stop).toMatchObject({
      completed_step_ids: ["step_1", "step_2"],
      existing_evidence_record_ids: [],
      partial_response_ready: true
    });
    expect(plan.budget_stop_policy.graceful_stop.unfinished_step_ids).toContain("step_3");
    expect(plan.budget_stop_policy.planned_usage.steps).toBe(3);
  });

  it("gracefully stops tool loop plans when credit budget is exhausted", () => {
    const plan = createToolLoopAgentPlan({
      maxCredits: 2,
      maxSteps: 6,
      prompt: "Explain 00700.HK revenue and price trend",
      requestId: "req-agent-plan-credit-budget",
      requestedTools: [
        "resolve_security",
        "get_entitlements",
        "get_security_profile",
        "get_quote_snapshot",
        "get_price_history",
        "get_financial_facts",
        "get_data_lineage"
      ]
    });

    expect(plan.status).toBe("stopped_budget");
    expect(plan.budget_stop_policy.decision.reasons).toContain("credits");
    expect(plan.budget_stop_policy.limit_status).toContainEqual(
      expect.objectContaining({
        dimension: "credits",
        status: "would_exceed"
      })
    );
    expect(plan.budget_stop_policy.planned_usage.credits).toBeLessThanOrEqual(2);
    expect(plan.budget_stop_policy.graceful_stop.next_step).toContain("approve at least");
  });

  it("resolves pre-tool-call security, time, currency, and methodology context", () => {
    const preflight = createPreToolCallResolution({
      asOf: "2024-03-31",
      currency: "HKD",
      methodology: "split_adjusted",
      prompt: "Explain Tencent revenue",
      requestId: "req-preflight-1",
      securities: ["00700.HK"],
      timeRange: {
        end: "2024-03-31",
        start: "2023-04-01"
      }
    });

    expect(preflight.status).toBe("ready");
    expect(preflight.clarification_required).toBe(false);
    expect(preflight.security).toMatchObject({
      status: "resolved",
      resolved: [
        expect.objectContaining({
          currency: "HKD",
          instrument_id: "eq_hk_00700",
          market: "HK",
          symbol: "00700.HK"
        })
      ]
    });
    expect(preflight.time).toMatchObject({
      as_of: "2024-03-31",
      status: "resolved",
      time_range: {
        end: "2024-03-31",
        start: "2023-04-01"
      }
    });
    expect(preflight.currency).toMatchObject({
      currency: "HKD",
      status: "resolved"
    });
    expect(preflight.methodology).toMatchObject({
      price_adjustment: "split_adjusted",
      status: "resolved"
    });
    expect(preflight.tool_readiness.can_plan_tools).toBe(true);
  });

  it("requires clarification for ambiguous securities before tool calls", () => {
    const preflight = createPreToolCallResolution({
      prompt: "Explain ABC revenue",
      requestId: "req-preflight-ambiguous",
      requestedTools: ["resolve_security", "get_financial_facts"]
    });

    expect(preflight.status).toBe("needs_clarification");
    expect(preflight.clarification_required).toBe(true);
    expect(preflight.security.status).toBe("needs_clarification");
    expect(preflight.security.ambiguous_candidates).toEqual([
      expect.objectContaining({
        instrument_id: "eq_hk_00001"
      }),
      expect.objectContaining({
        instrument_id: "eq_hk_08001"
      })
    ]);
    expect(preflight.clarifications[0]).toMatchObject({
      blocking: true,
      field: "security"
    });
    expect(preflight.tool_readiness).toMatchObject({
      blocked_tools: ["resolve_security", "get_financial_facts"],
      can_plan_tools: false
    });
  });

  it("creates an AI SDK stop condition function", () => {
    expect(typeof createAiSdkStopCondition(3)).toBe("function");
  });
});
