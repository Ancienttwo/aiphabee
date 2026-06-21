import { describe, expect, it } from "vitest";
import {
  AGENT_KILL_SWITCH_VERSION,
  AgentRuntimeInputError,
  createAgentKillSwitchPlan,
  createAgentRunSkeleton,
  createAiSdkStopCondition,
  createPreToolCallResolution,
  createToolLoopAgentPlan,
  createWorkflowTaskPlan,
  getAgentWorkflowTaskCapabilities,
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
    expect(capabilities.kill_switch).toMatchObject({
      actual_tool_execution: false,
      frontend: false,
      live_flag_reads: false,
      model_calls: false,
      model_kill_switch_ready: true,
      persistent_writes: false,
      route: "POST /agent/kill-switch/plan",
      safe_degradation_ready: true,
      status: "kill_switch_scaffold",
      tool_kill_switch_ready: true,
      version: "2026-06-21.phase2.kill-switch-scaffold.v0"
    });
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
      failure_recovery_policy: {
        no_double_charge: true,
        partial_retry: true,
        retry_billable: false,
        status: "failure_recovery_policy_scaffold"
      },
      model_routing_audit: {
        ai_gateway_provider: "cloudflare_ai_gateway",
        audit_required: true,
        fallback: "planned",
        live_model_routing: false,
        model_calls: false,
        records_model_change: true,
        status: "model_routing_audit_scaffold"
      },
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
    expect(capabilities.workflow_tasks).toMatchObject({
      actual_workflow_execution: false,
      binding: "AIPHABEE_RESEARCH_WORKFLOW",
      disconnect_safe: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      frontend: false,
      live_workflow_execution: false,
      notification_plan: true,
      persistent_writes: false,
      resume_route: "GET /agent/workflows/tasks/:task_id",
      route: "POST /agent/workflows/tasks/plan",
      sql_emitted: false,
      status: "workflow_task_scaffold",
      task_id_visible: true
    });
    expect(capabilities.registered_tools).toHaveLength(16);
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

  it("reports long-running Workflow task capabilities", () => {
    expect(getAgentWorkflowTaskCapabilities()).toMatchObject({
      actual_workflow_execution: false,
      binding: "AIPHABEE_RESEARCH_WORKFLOW",
      disconnect_safe: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      frontend: false,
      live_workflow_execution: false,
      notification_plan: true,
      persistent_writes: false,
      resume_route: "GET /agent/workflows/tasks/:task_id",
      route: "POST /agent/workflows/tasks/plan",
      sql_emitted: false,
      status: "workflow_task_scaffold",
      task_id_visible: true
    });
    expect(getAgentWorkflowTaskCapabilities().task_kinds).toEqual([
      "deep_report",
      "event_research",
      "long_document",
      "multi_company_analysis"
    ]);
  });

  it("plans model/tool kill switch safe degradation without live flags", () => {
    expect(AGENT_KILL_SWITCH_VERSION).toBe(
      "2026-06-21.phase2.kill-switch-scaffold.v0"
    );

    const plan = createAgentKillSwitchPlan({
      killSwitchReason: "provider incident",
      modelKillSwitch: true,
      requestId: "req-agent-kill-switch",
      toolKillSwitch: true
    });

    expect(plan).toMatchObject({
      actual_tool_execution: false,
      decision: {
        degraded: true,
        degradation_mode: "no_model_no_tools",
        model_calls_allowed: false,
        model_request_blocked: true,
        safe_degradation_required: true,
        tool_execution_blocked: true,
        tool_execution_allowed: false
      },
      frontend: false,
      live_flag_reads: false,
      model_calls: false,
      persistent_writes: false,
      reason: "provider incident",
      route: "POST /agent/kill-switch/plan",
      safe_degradation: {
        deterministic_calculation_allowed: true,
        evidence_required_for_reused_outputs: true,
        partial_answer_allowed: true,
        unknown_label_required: true,
        user_visible_state: true
      },
      status: "planned_no_live_kill_switch",
      switch_state: {
        model_kill_switch: true,
        target: "all",
        tool_kill_switch: true
      },
      version: AGENT_KILL_SWITCH_VERSION
    });
  });

  it("degrades tool loop planning when tool execution kill switch is tripped", () => {
    const plan = createToolLoopAgentPlan({
      killSwitchReason: "tool provider incident",
      prompt: "Explain 00700.HK revenue and price trend",
      requestId: "req-agent-kill-switch-plan",
      requestedTools: ["resolve_security", "get_quote_snapshot"],
      toolKillSwitch: true
    });

    expect(plan.status).toBe("degraded_kill_switch");
    expect(plan.model_calls).toBe(false);
    expect(plan.actual_tool_execution).toBe(false);
    expect(plan.kill_switch).toMatchObject({
      decision: {
        degradation_mode: "no_model_no_tools",
        safe_degradation_required: true,
        tool_execution_blocked: true
      },
      reason: "tool provider incident",
      switch_state: {
        model_kill_switch: false,
        target: "tool",
        tool_kill_switch: true
      }
    });
    expect(plan.planned_step_count).toBe(1);
    expect(plan.steps).toEqual([
      expect.objectContaining({
        kind: "answer_contract",
        phase: "answer_contract",
        public_label: "Return safe degraded response while tool execution is disabled",
        tool_calls: []
      })
    ]);
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
    expect(plan.kill_switch).toMatchObject({
      decision: {
        degraded: false,
        degradation_mode: "normal_no_live",
        safe_degradation_required: false
      },
      switch_state: {
        target: "none"
      }
    });
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
    expect(plan.failure_recovery_policy).toMatchObject({
      actual_tool_execution: false,
      billing: {
        charge_grain: "tool_call_success",
        failed_attempt_billable: false,
        idempotency_key_required: true,
        no_double_charge: true,
        retry_attempt_billable: false,
        usage_ledger_write: "planned"
      },
      error_classes: {
        non_retryable: [
          "DATA_NOT_LICENSED",
          "DATA_QUALITY_HOLD",
          "INVALID_INPUT",
          "OUT_OF_RANGE",
          "SCOPE_DENIED",
          "TOO_MANY_ROWS"
        ],
        retryable: ["RATE_LIMITED", "TOOL_TIMEOUT", "UPSTREAM_5XX", "NETWORK_RESET"],
        stop_after_consecutive_same_error: 2
      },
      graceful_degradation: {
        evidence_binding_required_for_reused_outputs: true,
        failed_tool_claim_label: "unknown",
        partial_answer_allowed: true,
        single_tool_failure_does_not_drop_run: true,
        user_visible_recovery_state: true
      },
      model_calls: false,
      partial_retry: {
        enabled: true,
        max_attempts_per_tool: 2,
        preserves_completed_steps: true,
        retry_after_supported: true,
        retry_billable: false,
        retry_scope: "failed_tool_call_only",
        reuse_completed_evidence: true
      },
      recovery_state: {
        durable_runtime: "planned",
        idempotency_key: "planned",
        persisted: false,
        resume_token: "planned",
        state_store: "planned_run_state"
      },
      status: "failure_recovery_policy_scaffold",
      version: "2026-06-21.phase1.failure-recovery-policy-scaffold.v0"
    });
    expect(plan.failure_recovery_policy.planned_step_recovery).toEqual([
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        phase: "security_resolution",
        retryable_tool_call_count: 1,
        step_id: "step_1"
      }),
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        phase: "entitlement_gate",
        retryable_tool_call_count: 1,
        step_id: "step_2"
      }),
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        phase: "data_fetch",
        retryable_tool_call_count: 3,
        step_id: "step_3"
      }),
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        phase: "data_fetch",
        retryable_tool_call_count: 1,
        step_id: "step_4"
      }),
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        phase: "evidence_binding",
        retryable_tool_call_count: 1,
        step_id: "step_5"
      }),
      expect.objectContaining({
        local_recovery_action: "return_partial_response",
        phase: "answer_contract",
        retryable_tool_call_count: 0,
        step_id: "step_6"
      })
    ]);
    expect(plan.failure_recovery_policy.validation_rules).toEqual([
      "preserve_completed_steps",
      "retry_failed_tool_call_only",
      "reuse_existing_evidence_records",
      "do_not_rebill_retries",
      "stop_after_two_same_errors",
      "surface_partial_response"
    ]);
    expect(plan.model_routing_audit).toMatchObject({
      actual_tool_execution: false,
      audit_contract: {
        cost_latency_required: true,
        product_analytics_separate: true,
        prompt_version_required: true,
        redact_sensitive_content: true
      },
      cache_policy: {
        non_sensitive_only: true,
        safe_reusable_results_only: true,
        user_private_prompt_content_cacheable: false
      },
      fallback_policy: {
        fallback_model_status: "planned",
        max_fallbacks_per_run: 1,
        records_model_change: true,
        strategy: "switch_to_backup_model",
        triggers: ["MODEL_TIMEOUT", "RATE_LIMITED", "UPSTREAM_5XX"]
      },
      gateway: {
        gateway_id: "default",
        provider: "cloudflare_ai_gateway",
        required_env: ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "AI_GATEWAY_NAME"],
        status: "planned",
        unified_billing: true
      },
      linked_policy_versions: {
        answer_evidence_contract: "2026-06-21.phase1.answer-evidence-contract-scaffold.v0",
        failure_recovery_policy: "2026-06-21.phase1.failure-recovery-policy-scaffold.v0",
        numeric_source_guard: "2026-06-21.phase1.numeric-source-guard-scaffold.v0"
      },
      live_model_routing: false,
      model_calls: false,
      run_context_model_tier: "dry_run",
      status: "model_routing_audit_scaffold",
      version: "2026-06-21.phase1.model-routing-audit-scaffold.v0"
    });
    expect(plan.model_routing_audit.audit_contract.required_fields).toEqual([
      "user_id",
      "workspace_id",
      "token_client_id",
      "ip_risk_summary",
      "tool_name",
      "tool_version",
      "input_summary_hash",
      "authorization_policy_version",
      "dataset",
      "data_version",
      "source_record_id",
      "cache_hit",
      "model_provider",
      "model_id",
      "model_version",
      "prompt_version",
      "input_tokens",
      "output_tokens",
      "estimated_cost",
      "latency_ms",
      "output_hash",
      "error_code",
      "retry_count",
      "fallback_from_model",
      "fallback_to_model",
      "human_intervention"
    ]);
    expect(plan.model_routing_audit.routing_tiers).toEqual([
      expect.objectContaining({
        model_calls: false,
        status: "planned",
        task_layer: "lightweight",
        tasks: [
          "intent_detection",
          "security_resolution_assist",
          "simple_formatting",
          "summary_draft"
        ]
      }),
      expect.objectContaining({
        model_calls: false,
        status: "planned",
        task_layer: "main",
        tasks: ["research_planning", "evidence_synthesis", "cross_document_explanation"]
      }),
      expect.objectContaining({
        model_calls: false,
        status: "wired_no_model",
        task_layer: "deterministic_code",
        tasks: ["financial_calculation", "screening", "structured_transform"]
      })
    ]);
    expect(plan.model_routing_audit.validation_rules).toEqual([
      "require_ai_gateway_logs",
      "require_model_change_audit",
      "require_budget_ledger_link",
      "block_arbitrary_model_id",
      "keep_deterministic_financial_calculations_out_of_model",
      "redact_sensitive_audit_payloads"
    ]);
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
      registered_tool_count: 16,
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

  it("plans long-running Workflow tasks with resumable task IDs and notification plans", () => {
    const task = createWorkflowTaskPlan({
      channel: "web",
      maxSteps: 6,
      notificationChannels: ["in_app", "email"],
      prompt: "Create a deep report for 00700.HK with cited evidence",
      requestId: "req-workflow-report-1",
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
      workflowKind: "deep_report",
      workspaceId: "workspace_research"
    });

    expect(task).toMatchObject({
      actual_workflow_execution: false,
      frontend_rendering: false,
      live_workflow_execution: false,
      persistent_writes: false,
      request_id: "req-workflow-report-1",
      sql_emitted: false,
      status: "planned_no_write",
      task_id: "workflow_task_req_workflow_report_1_deep_report",
      task_id_visible: true
    });
    expect(task.task).toMatchObject({
      created_from: "agent_tool_loop_plan",
      run_id: "dry_req-workflow-report-1",
      status: "planned_no_write",
      table: "core.workflow_task",
      task_id: "workflow_task_req_workflow_report_1_deep_report",
      task_kind: "deep_report",
      user_id: "user_internal_alpha",
      workspace_id: "workspace_research"
    });
    expect(task.workflow).toEqual({
      binding: "AIPHABEE_RESEARCH_WORKFLOW",
      execution_ready: false,
      provider: "cloudflare_workflows",
      start_status: "not_started",
      workflow_name: "research-long-running-orchestrator"
    });
    expect(task.resume).toMatchObject({
      disconnect_safe: true,
      frontend_can_leave: true,
      resume_handle: "resume_workflow_task_req_workflow_report_1_deep_report",
      resume_route: "GET /agent/workflows/tasks/:task_id",
      resumable: true,
      state_table: "core.workflow_task_checkpoint"
    });
    expect(task.notification).toEqual({
      channels: ["in_app", "email"],
      completion_notification: "planned_no_write",
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      failure_notification: "planned_no_write",
      required: true,
      user_visible: true
    });
    expect(task.long_task_boundary).toMatchObject({
      interactive_wall_clock_limit_ms: 30000,
      transfer_reasons: ["task_kind_requires_workflow", "user_can_leave_and_resume"]
    });
    expect(task.tool_loop_plan.status).toBe("planned_no_model");
    expect(task.tool_loop_plan.actual_tool_execution).toBe(false);
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
    expect(plan.model_routing_audit).toMatchObject({
      live_model_routing: false,
      model_calls: false,
      status: "model_routing_audit_scaffold"
    });
    expect(plan.failure_recovery_policy.planned_step_recovery).toEqual([
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        step_id: "step_1"
      }),
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        step_id: "step_2"
      }),
      expect.objectContaining({
        local_recovery_action: "return_partial_response",
        phase: "answer_contract",
        step_id: "step_3"
      })
    ]);
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
