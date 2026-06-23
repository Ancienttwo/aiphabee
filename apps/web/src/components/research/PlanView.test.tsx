import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EvidenceContractCard, ResearchPlanCard } from "./PlanView";
import type { AgentPlan } from "../../lib/api";

const PLAN: AgentPlan = {
  actual_tool_execution: false,
  model_calls: false,
  chain_of_thought_exposed: false,
  planned_step_count: 2,
  steps: [
    {
      index: 1,
      phase: "security_resolution",
      public_label: "Resolve security and time context",
      step_id: "step_1",
      tool_calls: [
        {
          name: "resolve_security",
          required_scope: "security:read",
          data_classes: ["security_master"],
          live_data_access: false,
          allow_arbitrary_sql: false,
          allow_arbitrary_url: false,
          status: "scaffold",
        },
      ],
    },
    {
      index: 2,
      phase: "entitlement_gate",
      public_label: "Check workspace entitlement scope",
      step_id: "step_2",
      tool_calls: [],
    },
  ],
  answer_evidence_contract: {
    answer_structure: {
      ordered_sections: [
        { order: 1, required: true, section_id: "direct_answer", source: "prd_8_3" },
        { order: 2, required: true, section_id: "data_status", source: "prd_8_3" },
        { order: 3, required: true, section_id: "key_evidence", source: "prd_8_3" },
      ],
      key_evidence_items: { min: 3, max: 6 },
      min_direct_answer_sentences: 2,
      max_direct_answer_sentences: 5,
      max_next_steps: 3,
    },
  },
  numeric_source_guard: {
    allowed_sources: ["tool_result", "deterministic_calculation"],
    blocked_sources: ["model_memory", "training_data"],
    answer_contract: {
      requires_source_record_ref: true,
      requires_calculation_ref: true,
      unsupported_numeric_claim_behavior: "block_answer_claim",
      failure_code: "UNSOURCED_NUMERIC_CLAIM",
      unknown_value_label: "unknown",
    },
  },
  budget: { max_credits: 20, max_parallel_tools: 3, max_rows: 500, max_steps: 6, max_tokens: 8000 },
};

describe("research plan view (SSR)", () => {
  it("ResearchPlanCard lists phased steps with their tools and scopes", () => {
    const html = renderToStaticMarkup(<ResearchPlanCard plan={PLAN} />);
    expect(html).toContain("研究计划");
    expect(html).toContain("Resolve security and time context");
    expect(html).toContain("证券解析");
    expect(html).toContain("resolve_security");
    expect(html).toContain("security:read");
  });

  it("EvidenceContractCard shows the answer structure and the numeric guard", () => {
    const html = renderToStaticMarkup(<EvidenceContractCard plan={PLAN} />);
    expect(html).toContain("直接回答");
    expect(html).toContain("关键证据");
    expect(html).toContain("工具结果"); // allowed source
    expect(html).toContain("模型记忆"); // blocked source
    expect(html).toContain("UNSOURCED_NUMERIC_CLAIM");
    expect(html).toContain("20 credits");
  });
});
