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
      chain_of_thought_exposed: false,
      max_parallel_tools: 3,
      model_calls: false,
      planner_ready: true,
      status: "tool_loop_agent_planner_scaffold",
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
        input_schema_id: "tool.resolve_security.input.v0",
        name: "resolve_security",
        output_schema_id: "tool.resolve_security.output.v0",
        version: "0.0.0"
      }),
      expect.objectContaining({
        input_schema_id: "tool.get_financial_facts.input.v0",
        name: "get_financial_facts",
        output_schema_id: "tool.get_financial_facts.output.v0",
        version: "0.0.0"
      })
    ]);
  });

  it("rejects unregistered tools", () => {
    expect(() =>
      createAgentRunSkeleton({
        prompt: "Run arbitrary SQL",
        requestId: "req-agent-2",
        requestedTools: ["sql.query"]
      })
    ).toThrow(AgentRuntimeInputError);
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
  });

  it("rejects tool loop plans that exceed the requested step budget", () => {
    expect(() =>
      createToolLoopAgentPlan({
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
      })
    ).toThrow(AgentRuntimeInputError);
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
