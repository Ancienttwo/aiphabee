import { describe, expect, it } from "vitest";
import {
  ResearchRunInputError,
  createResearchRunSavePlan,
  getResearchRuntimeCapabilities
} from "./index";

describe("research run save scaffold", () => {
  it("reports research runtime capabilities", () => {
    expect(getResearchRuntimeCapabilities()).toMatchObject({
      frontend_rendering: false,
      immutable_report_snapshot: true,
      live_db_writes: false,
      package: "@aiphabee/research-runtime",
      replay_seed_ready: true,
      route: "POST /research/runs/save/plan",
      runtime_route: "GET /research/runtime",
      sql_emitted: false,
      status: "research_run_save_scaffold",
      tool_name: "save_research_run"
    });
    expect(getResearchRuntimeCapabilities().required_fields).toEqual([
      "question",
      "tool_calls",
      "evidence_records",
      "model_version",
      "prompt_version"
    ]);
  });

  it("plans a complete no-write research run snapshot", () => {
    const plan = createResearchRunSavePlan({
      answerHash: "answer_hash_00700_revenue",
      evidenceRecords: [
        {
          citationLabel: "Tencent FY2024 annual results financial highlights",
          dataVersion: "2026-06-21.phase2.announcement-diff-extraction-scaffold.v0",
          documentLocation: {
            anchor: "financial-highlights",
            documentId: "doc_ann_00700_20250320_results",
            page: 4,
            paragraph: 2,
            sourceRecordId: "src_announcement_00700_20250320_results"
          },
          evidenceRecordId: "evidence_doc_diff_00700_fy2024",
          methodologyVersion:
            "2026-06-21.phase2.announcement-diff-extraction-scaffold.v0",
          sourceRecordIds: ["src_announcement_00700_20250320_results"]
        }
      ],
      modelProvider: "cloudflare_ai_gateway",
      modelVersion: "gpt-5.4-dry-run",
      promptTemplateId: "research-summary-v0",
      promptVersion: "prompt.research-summary.v0",
      question: "Compare Tencent annual revenue and operating profit across periods.",
      requestId: "req-research-save",
      runId: "run_00700_research",
      toolCalls: [
        {
          dataVersion: "2026-06-21.phase2.announcement-diff-extraction-scaffold.v0",
          input: {
            base_document_id: "doc_ann_00700_20240320_results",
            comparison_document_id: "doc_ann_00700_20250320_results"
          },
          inputSchemaId: "tool.diff_announcements.input.v0",
          methodologyVersion:
            "2026-06-21.phase2.announcement-diff-extraction-scaffold.v0",
          outputSchemaId: "tool.diff_announcements.output.v0",
          requestId: "req-diff-announcements",
          toolCallId: "tool_call_diff_announcements_1",
          toolName: "diff_announcements",
          toolVersion: "2026-06-21.phase2.announcement-diff-extraction-scaffold.v0"
        }
      ],
      userId: "user_internal_alpha",
      workspaceId: "workspace_research"
    });

    expect(plan).toMatchObject({
      answer_snapshot: {
        answer_hash: "answer_hash_00700_revenue",
        output_hash_recorded: true
      },
      channel: "web",
      frontend_rendering: false,
      immutable_report_snapshot: true,
      live_db_writes: false,
      model_snapshot: {
        model_provider: "cloudflare_ai_gateway",
        model_version: "gpt-5.4-dry-run",
        prompt_template_id: "research-summary-v0",
        prompt_version: "prompt.research-summary.v0"
      },
      request_id: "req-research-save",
      research_run_id: "run_00700_research",
      run_id: "run_00700_research",
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "save_research_run"
    });
    expect(plan.schema_validation).toEqual({
      errors: [],
      required_fields: [
        "question",
        "tool_calls",
        "evidence_records",
        "model_version",
        "prompt_version"
      ],
      valid: true
    });
    expect(plan.persistence_plan).toMatchObject({
      old_report_mutation_allowed: false,
      sql_emitted: false,
      write_status: "planned_no_write"
    });
    expect(plan.persistence_plan.tables).toEqual([
      "core.research_run",
      "core.research_run_tool_call",
      "core.research_run_evidence_snapshot",
      "core.research_run_model_snapshot"
    ]);
    expect(plan.tool_input_snapshot.tool_call_count).toBe(1);
    expect(plan.tool_input_snapshot.tool_calls[0]).toMatchObject({
      input_schema_id: "tool.diff_announcements.input.v0",
      request_id: "req-diff-announcements",
      tool_call_id: "tool_call_diff_announcements_1",
      tool_name: "diff_announcements"
    });
    expect(plan.tool_input_snapshot.tool_calls[0]?.input_hash).toMatch(
      /^[a-f0-9]{8}$/u
    );
    expect(plan.evidence_snapshot).toMatchObject({
      evidence_record_count: 1,
      records: [
        {
          document_location: {
            document_id: "doc_ann_00700_20250320_results",
            page: 4,
            paragraph: 2,
            source_record_id: "src_announcement_00700_20250320_results"
          },
          evidence_record_id: "evidence_doc_diff_00700_fy2024",
          source_record_ids: ["src_announcement_00700_20250320_results"]
        }
      ]
    });
    expect(plan.evidence_snapshot.snapshot_hash).toMatch(/^[a-f0-9]{8}$/u);
    expect(plan.snapshot_id).toBe(
      `research_snapshot_${plan.evidence_snapshot.snapshot_hash}`
    );
    expect(plan.replay_seed).toEqual({
      deterministic_replay_ready: true,
      replay_route: "POST /research/runs/replay/plan",
      replay_status: "planned",
      snapshot_id: plan.snapshot_id
    });
    expect(plan.user).toEqual({
      source: "request",
      user_id: "user_internal_alpha"
    });
    expect(plan.workspace).toEqual({
      source: "request",
      workspace_id: "workspace_research"
    });
    expect(plan.usage.rows).toBe(3);
  });

  it("rejects incomplete research run save plans", () => {
    expect(() =>
      createResearchRunSavePlan({
        evidenceRecords: [],
        modelVersion: "model-v0",
        promptVersion: "prompt-v0",
        question: "Compare Tencent",
        requestId: "req-research-save-missing",
        toolCalls: []
      })
    ).toThrow(ResearchRunInputError);
    expect(() =>
      createResearchRunSavePlan({
        evidenceRecords: [
          {
            dataVersion: "data-v0",
            evidenceRecordId: "evidence_1",
            methodologyVersion: "method-v0",
            sourceRecordIds: ["source_1"]
          }
        ],
        modelVersion: "model-v0",
        question: "Compare Tencent",
        requestId: "req-research-save-missing-prompt",
        toolCalls: [
          {
            dataVersion: "data-v0",
            input: {
              symbol: "00700.HK"
            },
            methodologyVersion: "method-v0",
            requestId: "req-tool",
            toolName: "search_announcements"
          }
        ]
      })
    ).toThrow(ResearchRunInputError);
  });
});
