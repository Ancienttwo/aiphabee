import { describe, expect, it } from "vitest";
import {
  AGENT_KILL_SWITCH_VERSION,
  AgentRuntimeInputError,
  createAgentKillSwitchPlan,
  createAgentProgressStreamReport,
  createAgentRunSkeleton,
  createAgentAiGatewayObservabilityReleaseGatePlan,
  createAgentUserRunPersistenceReleaseGatePlan,
  createAiSdkStopCondition,
  createPreToolCallResolution,
  createPromptInjectionToolDenialReleaseGatePlan,
  createProductAgentReleaseGatePlan,
  createToolLoopAgentPlan,
  createUnsourcedNumericSamplingReport,
  validatePostGenerationEvidenceBinding,
  createWorkflowTaskPlan,
  getAgentLabelBudgetReleaseGateCapabilities,
  getAgentWorkflowTaskCapabilities,
  getAgentAiGatewayObservabilityReleaseGateCapabilities,
  getAgentRuntimeCapabilities,
  getAgentUserRunPersistenceReleaseGateCapabilities,
  getPromptInjectionToolDenialReleaseGateCapabilities,
  getProductAgentReleaseGateCapabilities,
  getTaskReplayModeReleaseGateCapabilities,
  runAiGatewayLiveSmoke,
  UNSOURCED_NUMERIC_SAMPLING_VERSION,
  type AiGatewayLiveSmokeFetch
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
    expect(capabilities.response_presentation).toMatchObject({
      actual_tool_execution: false,
      data_contract_invariant: true,
      default_locale: "zh-Hant",
      default_response_depth: "professional",
      frontend: false,
      locale_switch_changes_data: false,
      model_calls: false,
      response_depth_changes_data: false,
      route: "POST /agent/runs/plan",
      status: "localized_response_contract_scaffold",
      supported_locales: ["zh-Hant", "zh-Hans", "en"],
      supported_response_depths: ["newbie", "professional"],
      terminology_glossary_ready: true,
      version: "2026-06-21.phase3.localized-response-contract.v0"
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
        post_generation_validation: "local_deterministic",
        post_generation_validator_ready: true,
        post_generation_validator_route: "POST /agent/runs/validate-answer",
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
      streaming_transport: "server_sent_events"
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
    expect(capabilities.product_agent_release_gate).toMatchObject({
      actual_tool_execution: false,
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      preflight_route: "POST /agent/runs/preflight",
      route: "POST /agent/release-gates/product-agent/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "product_agent_release_gate_scaffold",
      tool_loop_route: "POST /agent/runs/plan",
      version: "2026-06-21.phase3.product-agent-release-gate-scaffold.v0"
    });
    expect(capabilities.product_agent_release_gate.required_checks).toEqual([
      "ambiguous_security_blocks_tool_planning",
      "silent_security_selection_blocked",
      "numeric_claim_requires_tool_result_or_calculation_ref",
      "post_generation_unsourced_numeric_claim_blocked",
      "answer_contract_blocks_unsourced_numbers",
      "deterministic_calculations_keep_model_out"
    ]);
    expect(capabilities.agent_label_budget_release_gate).toMatchObject({
      actual_tool_execution: false,
      analytics_high_cost_route: "POST /analytics/high-cost/plan",
      frontend_rendering: false,
      live_db_writes: false,
      live_queue_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      route: "POST /agent/release-gates/label-budget/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_label_budget_release_gate_scaffold",
      tool_loop_route: "POST /agent/runs/plan",
      usage_reservation_route: "POST /usage/high-cost/reservation/plan",
      version: "2026-06-21.phase3.agent-label-budget-release-gate-scaffold.v0"
    });
    expect(capabilities.agent_label_budget_release_gate.required_checks).toEqual([
      "fact_label_requires_evidence_card",
      "inference_label_requires_evidence_strength",
      "unknown_label_requires_missing_reason",
      "high_cost_task_requires_budget_estimate",
      "high_cost_task_requires_confirmation_before_enqueue",
      "high_cost_usage_reservation_pre_debit_and_refund"
    ]);
    expect(capabilities.task_replay_mode_release_gate).toMatchObject({
      actual_tool_execution: false,
      frontend_rendering: false,
      live_db_writes: false,
      live_queue_writes: false,
      live_tool_execution: false,
      live_workflow_execution: false,
      localized_response_route: "POST /agent/runs/plan",
      model_calls: false,
      persistent_writes: false,
      research_replay_route: "POST /research/runs/replay/plan",
      research_save_route: "POST /research/runs/save/plan",
      route: "POST /agent/release-gates/task-replay-mode/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "task_replay_mode_release_gate_scaffold",
      version: "2026-06-21.phase3.task-replay-mode-release-gate-scaffold.v0",
      workflow_task_route: "POST /agent/workflows/tasks/plan"
    });
    expect(capabilities.task_replay_mode_release_gate.required_checks).toEqual([
      "long_task_returns_task_id_and_resume_handle",
      "long_task_checkpoint_state_is_disconnect_safe",
      "saved_report_has_deterministic_replay_seed",
      "replay_preserves_old_report_snapshot",
      "newbie_professional_depth_preserves_data_contract",
      "mode_switch_changes_presentation_only"
    ]);
    expect(capabilities.prompt_injection_tool_denial_release_gate).toMatchObject({
      actual_tool_execution: false,
      document_sanitizer_route: "POST /documents/get-announcement",
      frontend_rendering: false,
      live_db_writes: false,
      live_document_fetch: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      route: "POST /agent/release-gates/prompt-injection/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "prompt_injection_tool_denial_release_gate_scaffold",
      tool_loop_route: "POST /agent/runs/plan",
      version: "2026-06-21.phase3.prompt-injection-tool-denial-release-gate-scaffold.v0"
    });
    expect(capabilities.prompt_injection_tool_denial_release_gate.required_checks).toEqual([
      "untrusted_document_content_is_isolated",
      "document_origin_tool_instructions_not_executed",
      "arbitrary_sql_tool_denied_pre_execution",
      "arbitrary_url_tool_denied_pre_execution",
      "unregistered_tool_denied_pre_execution",
      "registered_tools_remain_schema_bound_read_only"
    ]);
    expect(capabilities.agent_user_run_persistence_release_gate).toMatchObject({
      actual_tool_execution: false,
      agent_billing_posted_ledger_smoke_route: "POST /agent/runs/billing-posted-ledger-smoke",
      agent_run_live_write_smoke_route: "POST /agent/runs/live-write-smoke",
      agent_run_state_persistence_smoke_route: "POST /agent/runs/state-persistence-smoke",
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      production_persistence_enabled: false,
      route: "POST /agent/release-gates/user-run-persistence/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_user_run_persistence_release_gate_scaffold",
      version: "2026-06-22.phase1.agent-user-run-persistence-release-gate.v0"
    });
    expect(capabilities.agent_user_run_persistence_release_gate.required_checks).toEqual([
      "agent_run_live_write_smoke_contract_linked",
      "agent_run_state_persistence_smoke_contract_linked",
      "agent_billing_posted_ledger_smoke_contract_linked",
      "hash_only_smoke_responses_enforced",
      "production_cutover_signoff_required",
      "production_retention_policy_required"
    ]);
    expect(capabilities.agent_ai_gateway_observability_release_gate).toMatchObject({
      actual_tool_execution: false,
      ai_gateway_observability_smoke_command: "npm run smoke:ai-gateway-observability-live",
      ai_gateway_observability_smoke_script: "scripts/smoke-ai-gateway-observability-live.mjs",
      frontend_rendering: false,
      live_ai_gateway_reads: false,
      live_db_writes: false,
      live_model_execution: false,
      model_calls: false,
      model_execution_audit_smoke_route: "POST /agent/runs/model-execution-audit-smoke",
      model_provider_readiness_contract: "deploy/model-providers/live-smoke-readiness.contract.json",
      model_routing_audit_contract: "deploy/agent/model-routing-audit.contract.json",
      persistent_writes: false,
      route: "POST /agent/release-gates/ai-gateway-observability/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_ai_gateway_observability_release_gate_scaffold",
      version: "2026-06-22.phase1.agent-ai-gateway-observability-release-gate.v0"
    });
    expect(capabilities.agent_ai_gateway_observability_release_gate.required_checks).toEqual([
      "model_execution_audit_smoke_contract_linked",
      "ai_gateway_observability_smoke_script_linked",
      "ai_gateway_read_permission_evidence_required",
      "request_log_cost_cache_fields_required",
      "rate_limit_fallback_evidence_required",
      "hash_only_capture_packet_required"
    ]);
    expect(capabilities.registered_tools).toHaveLength(16);
    expect(capabilities.registered_tools[0]).toMatchObject({
      name: "resolve_security",
      schema: {
        standardResponseEnvelope: true
      }
    });
  });

  it("runs AI Gateway live smoke through generateText and streamText with sanitized proof", async () => {
    const { calls, fetch } = createOpenAiCompatibleMockFetch();
    const result = await runAiGatewayLiveSmoke({
      accountId: "synthetic-account-id",
      apiToken: "synthetic-token",
      fetch,
      gatewayId: "default",
      model: "@cf/aiphabee/synthetic-model",
      now: createMonotonicNow()
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      endpoint: "/ai/v1/chat/completions",
      gateway_header: "cf-aig-gateway-id",
      http_status: 200,
      http_statuses: [200, 200],
      method: "ai_sdk_openai_compatible",
      operation_count: 2,
      provider: "cloudflare_ai_gateway",
      status: "ok"
    });
    expect(result.generate_text).toMatchObject({
      api: "generateText",
      exact_output_match: true,
      input_tokens: 2,
      output_tokens: 3,
      status: "passed",
      total_tokens: 5
    });
    expect(result.stream_text).toMatchObject({
      api: "streamText",
      chunk_count: 1,
      exact_output_match: true,
      input_tokens: 2,
      output_tokens: 3,
      status: "passed",
      total_tokens: 5
    });
    expect(result.gateway_id_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(result.model_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(result.prompt_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(result.response_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(calls).toHaveLength(2);
    expect(calls.every((call) => call.url.endsWith("/ai/v1/chat/completions"))).toBe(true);
    expect(calls.every((call) => call.headers["cf-aig-gateway-id"] === "default")).toBe(true);
    expect(calls.map((call) => call.body.stream)).toEqual([undefined, true]);
    expect(serialized).not.toContain("synthetic-token");
    expect(serialized).not.toContain("synthetic-account-id");
    expect(serialized).not.toContain("@cf/aiphabee/synthetic-model");
    expect(serialized).not.toContain("AIPHABEE_AI_GATEWAY_SMOKE_OK");
  });

  it("exposes Agent label and high-cost budget release gate capability", () => {
    const capability = getAgentLabelBudgetReleaseGateCapabilities();

    expect(capability).toMatchObject({
      actual_tool_execution: false,
      analytics_high_cost_route: "POST /analytics/high-cost/plan",
      frontend_rendering: false,
      live_db_writes: false,
      live_queue_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      route: "POST /agent/release-gates/label-budget/plan",
      sql_emitted: false,
      status: "agent_label_budget_release_gate_scaffold",
      usage_reservation_route: "POST /usage/high-cost/reservation/plan"
    });
    expect(capability.tables).toEqual([
      "core.agent_label_budget_release_gate",
      "governance.agent_label_budget_release_gate_contract"
    ]);
  });

  it("exposes task replay mode release gate capability", () => {
    const capability = getTaskReplayModeReleaseGateCapabilities();

    expect(capability).toMatchObject({
      actual_tool_execution: false,
      frontend_rendering: false,
      live_db_writes: false,
      live_queue_writes: false,
      live_tool_execution: false,
      live_workflow_execution: false,
      localized_response_route: "POST /agent/runs/plan",
      model_calls: false,
      persistent_writes: false,
      research_replay_route: "POST /research/runs/replay/plan",
      research_save_route: "POST /research/runs/save/plan",
      route: "POST /agent/release-gates/task-replay-mode/plan",
      sql_emitted: false,
      status: "task_replay_mode_release_gate_scaffold",
      workflow_task_route: "POST /agent/workflows/tasks/plan"
    });
    expect(capability.tables).toEqual([
      "core.task_replay_mode_release_gate",
      "governance.task_replay_mode_release_gate_contract"
    ]);
    expect(capability.required_checks).toEqual([
      "long_task_returns_task_id_and_resume_handle",
      "long_task_checkpoint_state_is_disconnect_safe",
      "saved_report_has_deterministic_replay_seed",
      "replay_preserves_old_report_snapshot",
      "newbie_professional_depth_preserves_data_contract",
      "mode_switch_changes_presentation_only"
    ]);
  });

  it("exposes prompt injection and tool denial release gate capability", () => {
    const capability = getPromptInjectionToolDenialReleaseGateCapabilities();

    expect(capability).toMatchObject({
      actual_tool_execution: false,
      document_sanitizer_route: "POST /documents/get-announcement",
      frontend_rendering: false,
      live_db_writes: false,
      live_document_fetch: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      route: "POST /agent/release-gates/prompt-injection/plan",
      sql_emitted: false,
      status: "prompt_injection_tool_denial_release_gate_scaffold",
      tool_loop_route: "POST /agent/runs/plan"
    });
    expect(capability.tables).toEqual([
      "core.prompt_injection_tool_denial_release_gate",
      "governance.prompt_injection_tool_denial_release_gate_contract"
    ]);
  });

  it("exposes product Agent release gate capability without live execution", () => {
    const capability = getProductAgentReleaseGateCapabilities();

    expect(capability).toMatchObject({
      actual_tool_execution: false,
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      route: "POST /agent/release-gates/product-agent/plan",
      sql_emitted: false,
      status: "product_agent_release_gate_scaffold"
    });
    expect(capability.tables).toEqual([
      "core.product_agent_release_gate",
      "governance.product_agent_release_gate_contract"
    ]);
  });

  it("exposes user-run persistence release gate capability without production writes", () => {
    const capability = getAgentUserRunPersistenceReleaseGateCapabilities();

    expect(capability).toMatchObject({
      actual_tool_execution: false,
      agent_billing_posted_ledger_smoke_route: "POST /agent/runs/billing-posted-ledger-smoke",
      agent_run_live_write_smoke_route: "POST /agent/runs/live-write-smoke",
      agent_run_state_persistence_smoke_route: "POST /agent/runs/state-persistence-smoke",
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      production_persistence_enabled: false,
      route: "POST /agent/release-gates/user-run-persistence/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_user_run_persistence_release_gate_scaffold",
      version: "2026-06-22.phase1.agent-user-run-persistence-release-gate.v0"
    });
    expect(capability.required_checks).toEqual([
      "agent_run_live_write_smoke_contract_linked",
      "agent_run_state_persistence_smoke_contract_linked",
      "agent_billing_posted_ledger_smoke_contract_linked",
      "hash_only_smoke_responses_enforced",
      "production_cutover_signoff_required",
      "production_retention_policy_required"
    ]);
    expect(capability.tables).toEqual([
      "core.agent_user_run_persistence_release_gate",
      "governance.agent_user_run_persistence_release_gate_contract"
    ]);
  });

  it("exposes AI Gateway observability release gate capability without live reads", () => {
    const capability = getAgentAiGatewayObservabilityReleaseGateCapabilities();

    expect(capability).toMatchObject({
      actual_tool_execution: false,
      ai_gateway_observability_smoke_command: "npm run smoke:ai-gateway-observability-live",
      ai_gateway_observability_smoke_script: "scripts/smoke-ai-gateway-observability-live.mjs",
      frontend_rendering: false,
      live_ai_gateway_reads: false,
      live_db_writes: false,
      live_model_execution: false,
      model_calls: false,
      model_execution_audit_smoke_route: "POST /agent/runs/model-execution-audit-smoke",
      model_provider_readiness_contract: "deploy/model-providers/live-smoke-readiness.contract.json",
      model_routing_audit_contract: "deploy/agent/model-routing-audit.contract.json",
      persistent_writes: false,
      route: "POST /agent/release-gates/ai-gateway-observability/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_ai_gateway_observability_release_gate_scaffold",
      version: "2026-06-22.phase1.agent-ai-gateway-observability-release-gate.v0"
    });
    expect(capability.required_checks).toEqual([
      "model_execution_audit_smoke_contract_linked",
      "ai_gateway_observability_smoke_script_linked",
      "ai_gateway_read_permission_evidence_required",
      "request_log_cost_cache_fields_required",
      "rate_limit_fallback_evidence_required",
      "hash_only_capture_packet_required"
    ]);
    expect(capability.tables).toEqual([
      "core.agent_ai_gateway_observability_release_gate",
      "governance.agent_ai_gateway_observability_release_gate_contract"
    ]);
  });

  it("plans user-run persistence release gate from existing smoke proofs", () => {
    const plan = createAgentUserRunPersistenceReleaseGatePlan({
      operatorSignoff: true,
      productionCutoverRequested: true,
      requestId: "req-agent-user-run-persistence-gate-1",
      retentionPolicyApproved: true
    });

    expect(plan).toMatchObject({
      actual_tool_execution: false,
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      production_cutover_allowed: false,
      production_cutover_requested: true,
      production_persistence_enabled: false,
      route: "POST /agent/release-gates/user-run-persistence/plan",
      sql_emitted: false,
      status: "planned_no_write",
      version: "2026-06-22.phase1.agent-user-run-persistence-release-gate.v0"
    });
    expect(plan.smoke_gates.map((gate) => gate.route)).toEqual([
      "POST /agent/runs/live-write-smoke",
      "POST /agent/runs/state-persistence-smoke",
      "POST /agent/runs/billing-posted-ledger-smoke"
    ]);
    expect(plan.smoke_gates.every((gate) => gate.hash_only_response)).toBe(true);
    expect(plan.release_checks.map((check) => check.check)).toEqual([
      "agent_run_live_write_smoke_contract_linked",
      "agent_run_state_persistence_smoke_contract_linked",
      "agent_billing_posted_ledger_smoke_contract_linked",
      "hash_only_smoke_responses_enforced",
      "production_cutover_signoff_required",
      "production_retention_policy_required"
    ]);
    expect(plan.release_checks.every((check) => check.status === "planned_no_write")).toBe(true);
    expect(plan.production_prerequisites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requirement: "operator_cutover_signoff",
          status: "satisfied"
        }),
        expect.objectContaining({
          requirement: "production_retention_policy",
          status: "satisfied"
        }),
        expect.objectContaining({
          requirement: "production_write_path",
          status: "blocked"
        }),
        expect.objectContaining({
          requirement: "frontend_resume_rendering",
          status: "blocked"
        })
      ])
    );
    expect(plan.release_gate).toMatchObject({
      blockers: ["production_write_path", "frontend_resume_rendering"],
      gate_status: "blocked_production_user_run_persistence",
      no_live_release_claim: true,
      required_signoffs: ["agent", "data", "billing", "operations"]
    });
    expect(plan.validation).toEqual({
      agent_billing_posted_ledger_smoke_linked: true,
      agent_run_live_write_smoke_linked: true,
      agent_run_state_persistence_smoke_linked: true,
      hash_only_smoke_responses_required: true,
      no_frontend_rendering: true,
      no_live_db_writes: true,
      no_model_calls: true,
      operator_signoff_present: true,
      production_cutover_allowed: false,
      production_persistence_enabled: false,
      retention_policy_approved: true,
      smoke_chain_has_audit_evidence_usage_state_and_billing: true
    });
  });

  it("plans AI Gateway observability release gate without route-local live verification", () => {
    const plan = createAgentAiGatewayObservabilityReleaseGatePlan({
      accountAnalyticsReadPermissionEvidence: true,
      aiGatewayReadPermissionEvidence: true,
      capturePacketAccepted: true,
      costCacheEvidenceAccepted: true,
      rateLimitFallbackEvidenceAccepted: true,
      requestId: "req-agent-ai-gateway-observability-gate-1",
      requestLogEvidenceAccepted: true
    });

    expect(plan).toMatchObject({
      actual_tool_execution: false,
      frontend_rendering: false,
      live_ai_gateway_reads: false,
      live_db_writes: false,
      live_model_execution: false,
      model_calls: false,
      persistent_writes: false,
      release_transition_allowed: false,
      request_id: "req-agent-ai-gateway-observability-gate-1",
      route: "POST /agent/release-gates/ai-gateway-observability/plan",
      sql_emitted: false,
      status: "planned_no_write",
      version: "2026-06-22.phase1.agent-ai-gateway-observability-release-gate.v0"
    });
    expect(plan.capability.required_checks).toEqual([
      "model_execution_audit_smoke_contract_linked",
      "ai_gateway_observability_smoke_script_linked",
      "ai_gateway_read_permission_evidence_required",
      "request_log_cost_cache_fields_required",
      "rate_limit_fallback_evidence_required",
      "hash_only_capture_packet_required"
    ]);
    expect(plan.release_checks.map((check) => check.check)).toEqual(
      plan.capability.required_checks
    );
    expect(plan.release_checks.every((check) => check.status === "planned_no_write")).toBe(true);
    expect(plan.linked_evidence.map((evidence) => evidence.surface)).toEqual([
      "model_execution_audit_smoke",
      "model_provider_readiness",
      "model_routing_audit_contract",
      "ai_gateway_observability_live_smoke",
      "live_smoke_capture_packet"
    ]);
    expect(plan.evidence_requirements.every((requirement) => requirement.status === "satisfied")).toBe(
      true
    );
    expect(plan.release_gate).toMatchObject({
      blockers: ["route_does_not_verify_live_capture_packet"],
      gate_status: "blocked_ai_gateway_observability_evidence",
      no_live_release_claim: true,
      required_signoffs: ["agent", "observability", "platform"]
    });
    expect(plan.validation).toEqual({
      account_analytics_read_permission_evidence_present: true,
      ai_gateway_observability_smoke_script_linked: true,
      ai_gateway_read_permission_evidence_present: true,
      capture_packet_accepted: true,
      cost_cache_evidence_present: true,
      model_execution_audit_smoke_linked: true,
      no_frontend_rendering: true,
      no_live_ai_gateway_reads: true,
      no_model_calls: true,
      no_persistent_writes: true,
      rate_limit_fallback_evidence_present: true,
      release_transition_allowed: false,
      request_log_evidence_present: true
    });
  });

  it("plans product Agent release gate checks for ambiguity and numeric evidence", () => {
    const plan = createProductAgentReleaseGatePlan({
      ambiguousSecurityQuery: "ABC",
      numericPrompt: "Explain 00700.HK revenue and ROE with source records",
      requestId: "req-product-agent-gate-1",
      userId: "user_internal_alpha",
      workspaceId: "workspace_research"
    });

    expect(plan).toMatchObject({
      actual_tool_execution: false,
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      route: "POST /agent/release-gates/product-agent/plan",
      sql_emitted: false,
      status: "planned_no_write",
      version: "2026-06-21.phase3.product-agent-release-gate-scaffold.v0"
    });
    expect(plan.ambiguous_security_gate).toMatchObject({
      ambiguous_candidate_count: 2,
      clarification_required: true,
      input_security_query: "ABC",
      silent_selection_allowed: false,
      tool_planning_allowed: false
    });
    expect(plan.ambiguous_security_gate.preflight).toMatchObject({
      actual_tool_execution: false,
      clarification_required: true,
      status: "needs_clarification",
      tool_readiness: {
        can_plan_tools: false
      }
    });
    expect(plan.ambiguous_security_gate.preflight.security.resolved).toEqual([]);
    expect(plan.ambiguous_security_gate.preflight.clarifications[0]).toMatchObject({
      blocking: true,
      field: "security",
      reason: "security identifier is ambiguous and cannot be silently selected"
    });
    expect(plan.numeric_evidence_gate).toMatchObject({
      allowed_sources: ["tool_result", "deterministic_calculation"],
      blocked_sources: ["model_memory", "training_data", "unverified_prompt", "unstated_source"],
      concrete_claims_allowed_now: false,
      concrete_numbers_allowed_without_sources: false,
      failure_code: "UNSOURCED_NUMERIC_CLAIM",
      post_generation_sourced_probe_allowed: true,
      post_generation_unsourced_probe_blocked: true,
      post_generation_validation: "local_deterministic",
      post_generation_validator_route: "POST /agent/runs/validate-answer",
      requires_calculation_ref: true,
      requires_source_record_ref: true
    });
    expect(plan.numeric_evidence_gate.deterministic_calculation_count).toBeGreaterThanOrEqual(3);
    expect(plan.numeric_evidence_gate.planned_tool_result_source_count).toBeGreaterThanOrEqual(3);
    expect(plan.numeric_evidence_gate.validation_rules).toContain(
      "require_tool_result_or_calculation_ref"
    );
    expect(plan.answer_contract_gate).toMatchObject({
      calculation_requires_calculation_ref: true,
      fact_requires_evidence_card: true,
      required_claim_labels: ["fact", "calculation", "inference", "unknown"],
      unknown_requires_missing_reason: true
    });
    expect(plan.answer_contract_gate.evidence_card_required_fields).toEqual(
      expect.arrayContaining(["source_record_id", "data_version", "methodology_version"])
    );
    expect(plan.answer_contract_gate.validation_rules).toContain(
      "block_unsourced_specific_numbers"
    );
    expect(plan.release_checks.map((check) => check.check)).toEqual([
      "ambiguous_security_blocks_tool_planning",
      "silent_security_selection_blocked",
      "numeric_claim_requires_tool_result_or_calculation_ref",
      "post_generation_unsourced_numeric_claim_blocked",
      "answer_contract_blocks_unsourced_numbers",
      "deterministic_calculations_keep_model_out"
    ]);
    expect(plan.release_gate).toMatchObject({
      gate_status: "blocked_live_evidence_binding",
      no_live_release_claim: true,
      required_signoffs: ["product", "agent", "data_quality"]
    });
    expect(plan.post_generation_evidence_binding).toMatchObject({
      route: "POST /agent/runs/validate-answer",
      status: "validator_ready",
      version: "2026-06-22.phase3.post-generation-evidence-binding.v0"
    });
    expect(plan.release_gate.blockers).not.toContain(
      "actual_post_generation_numeric_extraction_missing"
    );
    expect(plan.release_gate.blockers).toEqual([
      "live_evidence_binding_missing",
      "frontend_clarification_ui_missing"
    ]);
    expect(plan.validation).toEqual({
      ambiguous_security_blocked: true,
      answer_contract_blocks_unsourced_numbers: true,
      concrete_numbers_require_evidence: true,
      deterministic_calculations_keep_model_out: true,
      no_frontend_rendering: true,
      no_live_execution: true,
      numeric_sources_restricted: true,
      post_generation_sourced_numeric_claim_allowed: true,
      post_generation_unsourced_numeric_claim_blocked: true,
      silent_selection_allowed: false,
      tool_planning_blocked_until_clarified: true
    });
    expect(plan.numeric_tool_loop_plan.status).toBe("planned_no_model");
    expect(plan.numeric_tool_loop_plan.numeric_source_guard.version).toBe(
      "2026-06-21.phase1.numeric-source-guard-scaffold.v0"
    );
  });

  it("validates post-generation numeric claims against evidence bindings", () => {
    const blocked = validatePostGenerationEvidenceBinding({
      claims: [
        {
          claimId: "claim_revenue_without_source",
          label: "fact",
          text: "00700.HK revenue grew 12.4% to HK$100.2 billion."
        }
      ],
      requestId: "req-post-generation-block"
    });

    expect(blocked).toMatchObject({
      actual_tool_execution: false,
      blocked_claim_count: 1,
      failure_code: "UNSOURCED_NUMERIC_CLAIM",
      live_evidence_binding: false,
      model_calls: false,
      output_allowed: false,
      persistent_writes: false,
      route: "POST /agent/runs/validate-answer",
      sql_emitted: false,
      status: "blocked_unsourced_numeric_claim",
      version: "2026-06-22.phase3.post-generation-evidence-binding.v0"
    });
    expect(blocked.numeric_claims[0]).toMatchObject({
      binding_status: "missing_source_binding",
      claim_id: "claim_revenue_without_source",
      financial_context: true,
      missing_fields: ["source_record_id", "data_version", "methodology_version"]
    });
    expect(blocked.numeric_claims[0].numeric_values).toEqual(
      expect.arrayContaining(["12.4%", "HK$100.2 billion"])
    );

    const evidenceBound = validatePostGenerationEvidenceBinding({
      claims: [
        {
          claimId: "claim_roe_with_card",
          evidenceCardId: "card_roe",
          label: "fact",
          text: "ROE was 18.2%."
        }
      ],
      evidenceCards: [
        {
          cardId: "card_roe",
          dataVersion: "synthetic-financial-facts-v0",
          methodologyVersion: "deterministic-financial-growth-v0",
          sourceRecordId: "financial-fact-00700-roe-2025"
        }
      ],
      requestId: "req-post-generation-card"
    });

    expect(evidenceBound).toMatchObject({
      blocked_claim_count: 0,
      output_allowed: true,
      status: "passed"
    });
    expect(evidenceBound.failure_code).toBeUndefined();
    expect(evidenceBound.numeric_claims[0]).toMatchObject({
      binding_status: "bound_evidence_card",
      evidence_card_id: "card_roe",
      source_record_id: "financial-fact-00700-roe-2025"
    });

    const calculationBound = validatePostGenerationEvidenceBinding({
      calculations: [
        {
          calculationId: "deterministic_return_risk_v0",
          methodologyVersion: "deterministic-return-risk-v0",
          sourceRecordIds: ["price-history-00700-2025"]
        }
      ],
      claims: [
        {
          calculationId: "deterministic_return_risk_v0",
          claimId: "claim_total_return",
          label: "calculation",
          text: "Total return was 21.5%."
        }
      ],
      requestId: "req-post-generation-calculation"
    });

    expect(calculationBound).toMatchObject({
      blocked_claim_count: 0,
      output_allowed: true,
      status: "passed"
    });
    expect(calculationBound.numeric_claims[0]).toMatchObject({
      binding_status: "bound_calculation",
      calculation_id: "deterministic_return_risk_v0",
      source_record_id: "price-history-00700-2025"
    });
  });

  it("creates a deterministic unsourced numeric sampling report with eval v1 threshold", () => {
    const acceptedSamples = Array.from({ length: 1000 }, (_, index) => ({
      kind: "accepted_answer" as const,
      sampleId: `accepted-${index + 1}`,
      validationInput: {
        claims: [
          {
            claimId: `accepted_claim_${index + 1}`,
            dataVersion: "synthetic-financial-facts-v0",
            label: "fact" as const,
            methodologyVersion: "deterministic-financial-growth-v0",
            sourceRecordId: `financial-fact-00700-revenue-${index + 1}`,
            text: `00700.HK revenue grew ${10 + (index % 5)}%.`
          }
        ],
        requestId: `req-sampling-accepted-${index + 1}`
      }
    }));
    const blockedProbes = Array.from({ length: 3 }, (_, index) => ({
      kind: "blocked_probe" as const,
      sampleId: `blocked-probe-${index + 1}`,
      validationInput: {
        claims: [
          {
            claimId: `blocked_probe_claim_${index + 1}`,
            label: "fact" as const,
            text: `00700.HK margin expanded ${index + 1}.1% without source.`
          }
        ],
        requestId: `req-sampling-blocked-probe-${index + 1}`
      }
    }));
    const report = createUnsourcedNumericSamplingReport([...acceptedSamples, ...blockedProbes]);

    expect(report).toMatchObject({
      accepted_sample_count: 1000,
      actual_tool_execution: false,
      blocked_probe_count: 3,
      detected_blocked_probe_count: 3,
      eval_metric_source: "eval_v1_unsourced_numeric_claims",
      live_evidence_binding: false,
      minimum_accepted_samples: 1000,
      minimum_blocked_probes: 3,
      model_calls: false,
      observed_rate: 0,
      persistent_writes: false,
      route: "POST /agent/runs/validate-answer",
      sql_emitted: false,
      status: "local_sampling_passed",
      target_rate: 0.001,
      unsourced_claim_count: 0,
      validation_version: "2026-06-22.phase3.post-generation-evidence-binding.v0",
      version: UNSOURCED_NUMERIC_SAMPLING_VERSION
    });
    expect(report.samples).toHaveLength(1003);
    expect(report.samples[0]).toMatchObject({
      kind: "accepted_answer",
      output_allowed: true,
      status: "passed"
    });
    expect(report.samples.at(-1)).toMatchObject({
      blocked_claim_count: 1,
      kind: "blocked_probe",
      output_allowed: false,
      status: "blocked_unsourced_numeric_claim"
    });
  });

  it("fails deterministic unsourced numeric sampling at the strict eval v1 boundary", () => {
    const acceptedSamples = Array.from({ length: 999 }, (_, index) => ({
      kind: "accepted_answer" as const,
      sampleId: `accepted-bound-${index + 1}`,
      validationInput: {
        claims: [
          {
            claimId: `accepted_bound_claim_${index + 1}`,
            dataVersion: "synthetic-financial-facts-v0",
            label: "fact" as const,
            methodologyVersion: "deterministic-financial-growth-v0",
            sourceRecordId: `financial-fact-00700-roe-${index + 1}`,
            text: `00700.HK ROE was ${15 + (index % 5)}%.`
          }
        ],
        requestId: `req-sampling-bound-accepted-${index + 1}`
      }
    }));
    const unsourcedAcceptedSample = {
      kind: "accepted_answer" as const,
      sampleId: "accepted-unsourced-boundary",
      validationInput: {
        claims: [
          {
            claimId: "accepted_unsourced_claim",
            label: "fact" as const,
            text: "00700.HK revenue grew 12.4% without a source binding."
          }
        ],
        requestId: "req-sampling-boundary-unsourced"
      }
    };
    const blockedProbes = Array.from({ length: 3 }, (_, index) => ({
      kind: "blocked_probe" as const,
      sampleId: `blocked-bound-probe-${index + 1}`,
      validationInput: {
        claims: [
          {
            claimId: `blocked_bound_probe_claim_${index + 1}`,
            label: "fact" as const,
            text: `00700.HK profit margin improved ${index + 1}.2% without a binding.`
          }
        ],
        requestId: `req-sampling-bound-blocked-probe-${index + 1}`
      }
    }));
    const report = createUnsourcedNumericSamplingReport([
      ...acceptedSamples,
      unsourcedAcceptedSample,
      ...blockedProbes
    ]);

    expect(report).toMatchObject({
      accepted_sample_count: 1000,
      blocked_probe_count: 3,
      detected_blocked_probe_count: 3,
      observed_rate: 0.001,
      status: "local_sampling_failed",
      target_rate: 0.001,
      unsourced_claim_count: 1
    });
    expect(
      report.samples.find((sample) => sample.sample_id === "accepted-unsourced-boundary")
    ).toMatchObject({
      blocked_claim_count: 1,
      kind: "accepted_answer",
      output_allowed: false,
      status: "blocked_unsourced_numeric_claim"
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

  it("plans prompt injection and arbitrary tool denial release gate checks", () => {
    const plan = createPromptInjectionToolDenialReleaseGatePlan({
      requestId: "req-prompt-injection-tool-denial-gate-1",
      userId: "user_internal_alpha",
      workspaceId: "workspace_research"
    });

    expect(plan).toMatchObject({
      actual_tool_execution: false,
      capability: {
        route: "POST /agent/release-gates/prompt-injection/plan",
        status: "prompt_injection_tool_denial_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_db_writes: false,
      live_document_fetch: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      release_gate: {
        gate_status: "blocked_live_prompt_injection_red_team_validation",
        no_live_release_claim: true,
        required_signoffs: ["security", "agent", "data_governance"]
      },
      route: "POST /agent/release-gates/prompt-injection/plan",
      sql_emitted: false,
      status: "planned_no_write",
      version: "2026-06-21.phase3.prompt-injection-tool-denial-release-gate-scaffold.v0"
    });
    expect(plan.prompt_injection_gate).toMatchObject({
      document_sanitizer_capability: {
        prompt_injection_isolated: true,
        tool_invocation_allowed_from_document: false
      },
      malicious_document_id: "doc_ann_00700_20260103_dividend",
      malicious_section_id: "dividend_timetable",
      sanitized_excerpt_contains_script: false,
      sanitized_excerpt_contains_tool_instruction: false
    });
    expect(plan.prompt_injection_gate.removed_items).toEqual([
      "hidden_text",
      "script_tag",
      "suspicious_instruction"
    ]);
    expect(plan.prompt_injection_gate.document_result).toMatchObject({
      document_trust_policy: {
        content_is_untrusted_data: true,
        prompt_injection_isolated: true,
        scripts_executable: false
      },
      sanitization_summary: {
        raw_document_instructions_ignored: true,
        sections_sanitized: 1
      }
    });
    expect(plan.tool_denial_gate.denied_tool_probes).toEqual([
      expect.objectContaining({
        denied_pre_execution: true,
        denied_tools: ["sql.query"],
        kind: "arbitrary_sql_tool",
        requested_tool: "sql.query",
        runtime_error_code: "UNREGISTERED_TOOL",
        status: "denied_pre_execution"
      }),
      expect.objectContaining({
        denied_pre_execution: true,
        denied_tools: ["http.fetch"],
        kind: "arbitrary_url_tool",
        requested_tool: "http.fetch",
        runtime_error_code: "UNREGISTERED_TOOL",
        status: "denied_pre_execution"
      }),
      expect.objectContaining({
        denied_pre_execution: true,
        denied_tools: ["admin.override"],
        kind: "unregistered_tool",
        requested_tool: "admin.override",
        runtime_error_code: "UNREGISTERED_TOOL",
        status: "denied_pre_execution"
      })
    ]);
    expect(plan.tool_denial_gate.baseline_tool_enforcement).toMatchObject({
      allow_arbitrary_sql: false,
      allow_arbitrary_url: false,
      all_checks_passed: true,
      status: "allowed"
    });
    expect(plan.release_checks.map((check) => check.check)).toEqual([
      "untrusted_document_content_is_isolated",
      "document_origin_tool_instructions_not_executed",
      "arbitrary_sql_tool_denied_pre_execution",
      "arbitrary_url_tool_denied_pre_execution",
      "unregistered_tool_denied_pre_execution",
      "registered_tools_remain_schema_bound_read_only"
    ]);
    expect(plan.release_checks.every((check) => check.status === "planned_no_write")).toBe(true);
    expect(plan.validation).toMatchObject({
      arbitrary_sql_denied_pre_execution: true,
      arbitrary_url_denied_pre_execution: true,
      document_origin_tool_instructions_not_executed: true,
      no_frontend_rendering: true,
      no_live_execution: true,
      registered_tools_schema_bound_read_only: true,
      unregistered_tool_denied_pre_execution: true,
      untrusted_document_content_is_isolated: true
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
      transport: "server_sent_events"
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
    expect(plan.answer_evidence_contract.presentation).toMatchObject({
      default_locale: "zh-Hant",
      default_response_depth: "professional",
      frontend_rendering: false,
      locale: "zh-Hant",
      locale_switch_invariant: {
        currency: true,
        data_values: true,
        evidence_card_refs: true,
        methodology_versions: true,
        numeric_precision: true,
        source_record_ids: true,
        units: true
      },
      model_calls: false,
      response_depth: "professional",
      response_depth_invariant: {
        conclusion: true,
        currency: true,
        data_values: true,
        evidence_card_refs: true,
        methodology_versions: true,
        source_record_ids: true,
        units: true
      },
      response_depth_policy: {
        newbie_adds_examples: true,
        newbie_requires_plain_language_definition: true,
        professional_can_show_raw_formula_and_source_fields: true
      },
      supported_locales: ["zh-Hant", "zh-Hans", "en"],
      supported_response_depths: ["newbie", "professional"],
      terminology_policy: {
        bilingual_terms_required: true,
        same_glossary_for_all_locales: true,
        unknown_terms_use_source_label: true
      },
      version: "2026-06-21.phase3.localized-response-contract.v0"
    });
    expect(plan.answer_evidence_contract.presentation.terminology_glossary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          en: "free cash flow",
          metric_id: "free_cash_flow",
          methodology_note_required: true,
          source_record_required_when_numeric: true,
          zh_hans: "自由现金流",
          zh_hant: "自由現金流"
        }),
        expect.objectContaining({
          en: "abnormal return",
          metric_id: "abnormal_return",
          zh_hans: "异常收益",
          zh_hant: "異常收益"
        })
      ])
    );
    expect(plan.answer_evidence_contract.presentation.validation_rules).toEqual([
      "require_locale_in_zh_hant_zh_hans_en",
      "preserve_numeric_values_across_locale_switch",
      "preserve_source_record_ids_across_locale_switch",
      "preserve_methodology_versions_across_locale_switch",
      "preserve_conclusion_and_evidence_across_response_depth",
      "require_bilingual_financial_terms",
      "require_methodology_note_for_financial_terms"
    ]);
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
      post_generation_validation: "local_deterministic",
      status: "guarded_no_actual_results",
      version: "2026-06-21.phase1.numeric-source-guard-scaffold.v0"
    });
    expect(plan.post_generation_evidence_binding).toMatchObject({
      allowed_binding_refs: ["evidence_card", "source_record", "deterministic_calculation"],
      failure_code: "UNSOURCED_NUMERIC_CLAIM",
      live_evidence_binding: false,
      local_deterministic_validation: true,
      model_calls: false,
      route: "POST /agent/runs/validate-answer",
      status: "validator_ready",
      version: "2026-06-22.phase3.post-generation-evidence-binding.v0"
    });
    expect(plan.numeric_source_guard.post_generation_evidence_binding).toEqual(
      plan.post_generation_evidence_binding
    );
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

  it("creates a no-model progress stream report from the ToolLoopAgent plan", () => {
    const report = createAgentProgressStreamReport({
      maxSteps: 6,
      prompt: "Explain 00700.HK trend",
      requestedTools: ["resolve_security", "get_financial_facts"],
      requestId: "req-agent-stream",
      workspaceId: "workspace_research"
    });

    expect(report).toMatchObject({
      actual_tool_execution: false,
      chain_of_thought_exposed: false,
      content_type: "text/event-stream",
      frontend: false,
      model_calls: false,
      request_id: "req-agent-stream",
      route: "POST /agent/runs/stream",
      status: "progress_stream_ready",
      stream_transport: "server_sent_events",
      tool_progress_public: true,
      version: "2026-06-22.phase1.agent-progress-stream-readiness.v0"
    });
    expect(report.plan.progress_stream).toMatchObject({
      exposes_chain_of_thought: false,
      tool_progress_public: true,
      transport: "server_sent_events"
    });
    expect(report.stream_events[0]).toMatchObject({
      event: "run.started",
      event_index: 1,
      payload: {
        execution: "streaming_no_model",
        request_id: "req-agent-stream",
        status: "started"
      }
    });
    expect(report.stream_events.some((event) => event.event === "tool.step.planned")).toBe(true);
    expect(report.stream_events.some((event) => event.event === "tool.call.started")).toBe(true);
    expect(report.stream_events.some((event) => event.event === "tool.call.completed")).toBe(true);
    expect(report.stream_events.at(-1)?.event).toBe("run.completed");
    expect(JSON.stringify(report.stream_events).includes("Explain 00700.HK trend")).toBe(false);
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

  it("keeps locale and response depth as presentation-only answer contract choices", () => {
    const plan = createToolLoopAgentPlan({
      locale: "zh-Hans",
      maxSteps: 4,
      prompt: "用新手模式解释 00700.HK ROE 和自由现金流",
      requestId: "req-agent-localized-response",
      requestedTools: ["resolve_security", "get_financial_facts", "get_data_lineage"],
      responseDepth: "newbie"
    });

    expect(plan.answer_evidence_contract.presentation).toMatchObject({
      locale: "zh-Hans",
      response_depth: "newbie",
      locale_switch_invariant: {
        currency: true,
        data_values: true,
        evidence_card_refs: true,
        methodology_versions: true,
        numeric_precision: true,
        source_record_ids: true,
        units: true
      },
      response_depth_invariant: {
        conclusion: true,
        currency: true,
        data_values: true,
        evidence_card_refs: true,
        methodology_versions: true,
        source_record_ids: true,
        units: true
      }
    });
    expect(plan.answer_evidence_contract.presentation.terminology_glossary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          en: "ROE",
          metric_id: "roe",
          methodology_note_required: true,
          zh_hans: "净资产收益率",
          zh_hant: "股本回報率"
        })
      ])
    );
    expect(plan.actual_tool_execution).toBe(false);
    expect(plan.model_calls).toBe(false);
  });

  it("creates an AI SDK stop condition function", () => {
    expect(typeof createAiSdkStopCondition(3)).toBe("function");
  });
});

interface OpenAiCompatibleMockCall {
  body: Record<string, unknown>;
  headers: Record<string, string>;
  url: string;
}

function createOpenAiCompatibleMockFetch(): {
  calls: OpenAiCompatibleMockCall[];
  fetch: AiGatewayLiveSmokeFetch;
} {
  const calls: OpenAiCompatibleMockCall[] = [];
  const fetch = (async (...args: Parameters<AiGatewayLiveSmokeFetch>) => {
    const [resource, options] = args;
    const body = parseMockRequestBody((options as { body?: unknown } | undefined)?.body);
    const headers = normalizeMockHeaders((options as { headers?: unknown } | undefined)?.headers);
    calls.push({
      body,
      headers,
      url: String(resource)
    });

    if (body.stream === true) {
      return createMockResponse(
        [
          `data: ${JSON.stringify({
            choices: [
              {
                delta: {
                  content: "AIPHABEE_AI_GATEWAY_SMOKE_OK",
                  role: "assistant"
                },
                finish_reason: null,
                index: 0
              }
            ],
            created: 0,
            id: "chatcmpl-synthetic-stream",
            model: "synthetic-model",
            object: "chat.completion.chunk"
          })}`,
          "",
          `data: ${JSON.stringify({
            choices: [
              {
                delta: {},
                finish_reason: "stop",
                index: 0
              }
            ],
            created: 0,
            id: "chatcmpl-synthetic-stream",
            model: "synthetic-model",
            object: "chat.completion.chunk",
            usage: {
              completion_tokens: 3,
              prompt_tokens: 2,
              total_tokens: 5
            }
          })}`,
          "",
          "data: [DONE]",
          ""
        ].join("\n"),
        {
          "content-type": "text/event-stream"
        }
      );
    }

    return createMockResponse(
      JSON.stringify({
        choices: [
          {
            finish_reason: "stop",
            index: 0,
            message: {
              content: "AIPHABEE_AI_GATEWAY_SMOKE_OK",
              role: "assistant"
            }
          }
        ],
        created: 0,
        id: "chatcmpl-synthetic",
        model: "synthetic-model",
        object: "chat.completion",
        usage: {
          completion_tokens: 3,
          prompt_tokens: 2,
          total_tokens: 5
        }
      }),
      {
        "content-type": "application/json"
      }
    );
  }) as AiGatewayLiveSmokeFetch;

  return {
    calls,
    fetch
  };
}

function createMonotonicNow(): () => number {
  let current = 1000;

  return () => {
    current += 10;

    return current;
  };
}

function parseMockRequestBody(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") {
    return {};
  }

  return JSON.parse(value) as Record<string, unknown>;
}

function normalizeMockHeaders(value: unknown): Record<string, string> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, headerValue]) => [key.toLowerCase(), String(headerValue)])
  );
}

function createMockResponse(body: string, headers: Record<string, string>) {
  const ResponseConstructor = (globalThis as typeof globalThis & {
    Response: new (
      body?: string,
      init?: { headers?: Record<string, string>; status?: number }
    ) => Awaited<ReturnType<AiGatewayLiveSmokeFetch>>;
  }).Response;

  return new ResponseConstructor(body, {
    headers,
    status: 200
  });
}
