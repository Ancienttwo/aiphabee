import { describe, expect, it } from "vitest";
import {
  ResearchRunInputError,
  createDataCorrectionNotificationPlan,
  createDeepReportWorkflowPlan,
  createResearchRunReplayPlan,
  createResearchRunSavePlan,
  createStaticReportPlan,
  getDataCorrectionNotificationCapabilities,
  getDeepReportWorkflowCapabilities,
  getResearchRuntimeCapabilities,
  getStaticReportCapabilities
} from "./index";

describe("research run save scaffold", () => {
  it("reports research runtime capabilities", () => {
    expect(getResearchRuntimeCapabilities()).toMatchObject({
      frontend_rendering: false,
      immutable_report_snapshot: true,
      live_db_writes: false,
      package: "@aiphabee/research-runtime",
      replay_seed_ready: true,
      replay_diff_ready: true,
      replay_route: "POST /research/runs/replay/plan",
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
    expect(getResearchRuntimeCapabilities().supported_diffs).toEqual([
      "data",
      "model",
      "parameters"
    ]);
    expect(getResearchRuntimeCapabilities().deep_report_workflow).toMatchObject({
      citation_validation_required: true,
      evidence_index_required: true,
      live_db_writes: false,
      live_tool_execution: false,
      live_workflow_execution: false,
      model_calls: false,
      replay_route: "POST /research/runs/replay/plan",
      route: "POST /research/reports/deep/plan",
      status: "deep_report_workflow_scaffold",
      tool_name: "plan_deep_report_workflow",
      workflow_binding: "AIPHABEE_RESEARCH_WORKFLOW"
    });
    expect(getResearchRuntimeCapabilities().data_correction_notifications).toMatchObject({
      affected_report_marking_required: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      frontend_rendering: false,
      live_db_writes: false,
      notification_fanout: false,
      route: "POST /research/data-corrections/plan",
      runtime_route: "GET /research/runtime",
      saved_report_notification_required: true,
      status: "data_correction_notifications_scaffold",
      tool_name: "plan_data_correction_notifications"
    });
    expect(getResearchRuntimeCapabilities().static_report_artifact).toMatchObject({
      artifact_writes: false,
      data_delay_required: true,
      disclaimer_required: true,
      generated_at_required: true,
      route: "POST /research/reports/static/plan",
      status: "static_report_metadata_scaffold",
      tool_name: "plan_static_report_artifact",
      watermark_required: true
    });
  });

  it("reports data correction notification capabilities", () => {
    expect(getDataCorrectionNotificationCapabilities()).toMatchObject({
      affected_report_marking_required: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      evidence_snapshot_marking_required: true,
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      notification_fanout: false,
      package: "@aiphabee/research-runtime",
      persistent_writes: false,
      route: "POST /research/data-corrections/plan",
      runtime_route: "GET /research/runtime",
      saved_report_notification_required: true,
      sql_emitted: false,
      status: "data_correction_notifications_scaffold",
      tool_name: "plan_data_correction_notifications"
    });
    expect(getDataCorrectionNotificationCapabilities().supported_notification_channels).toEqual([
      "in_app",
      "email"
    ]);
    expect(getDataCorrectionNotificationCapabilities().tables).toEqual([
      "core.data_correction_event",
      "core.research_run_correction_impact",
      "core.user_notification"
    ]);
  });

  it("reports deep report workflow capabilities", () => {
    expect(getDeepReportWorkflowCapabilities()).toMatchObject({
      citation_validation_required: true,
      evidence_index_required: true,
      frontend_rendering: false,
      high_cost_confirmation_required: true,
      live_db_writes: false,
      live_tool_execution: false,
      live_workflow_execution: false,
      model_calls: false,
      package: "@aiphabee/research-runtime",
      replay_route: "POST /research/runs/replay/plan",
      route: "POST /research/reports/deep/plan",
      runtime_route: "GET /research/runtime",
      sql_emitted: false,
      status: "deep_report_workflow_scaffold",
      tool_name: "plan_deep_report_workflow",
      workflow_binding: "AIPHABEE_RESEARCH_WORKFLOW"
    });
    expect(getDeepReportWorkflowCapabilities().stages).toEqual([
      "data_fetch",
      "deterministic_analysis",
      "section_generation",
      "citation_validation",
      "evidence_index",
      "rerun_seed"
    ]);
  });

  it("reports static report capabilities", () => {
    expect(getStaticReportCapabilities()).toMatchObject({
      artifact_writes: false,
      data_delay_required: true,
      disclaimer_required: true,
      frontend_rendering: false,
      generated_at_required: true,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      package: "@aiphabee/research-runtime",
      persistent_writes: false,
      required_scope: "exports.read",
      rights_policy_required: true,
      route: "POST /research/reports/static/plan",
      runtime_route: "GET /research/runtime",
      sql_emitted: false,
      status: "static_report_metadata_scaffold",
      tool_name: "plan_static_report_artifact",
      watermark_required: true
    });
    expect(getStaticReportCapabilities().metadata_required_fields).toEqual([
      "generated_at",
      "data_delay_minutes",
      "data_version",
      "methodology_version",
      "rights_policy_version",
      "disclaimer"
    ]);
  });

  it("plans static report metadata within allowed scope", () => {
    const plan = createStaticReportPlan({
      asOf: "2026-06-21T09:30:00+08:00",
      dataDelayMinutes: 15,
      dataVersion: "static-report-data-v0",
      format: "pdf",
      generatedAt: "2026-06-21T10:00:00+08:00",
      methodologyVersion: "static-report-method-v0",
      reportId: "report_00700_static",
      requestId: "req-static-report",
      rightsPolicyVersion: "rights-static-report-v0",
      scopes: ["exports.read"],
      sections: ["summary", "disclaimer"],
      sourceRunId: "research_run_00700",
      title: "Tencent static report",
      workspaceId: "workspace_research"
    });

    expect(plan).toMatchObject({
      artifact: {
        pdf: "planned_no_write",
        public_url: "not_generated",
        r2_write: false,
        written: false
      },
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      request_id: "req-static-report",
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "plan_static_report_artifact"
    });
    expect(plan.metadata).toMatchObject({
      data_delay_minutes: 15,
      data_version: "static-report-data-v0",
      generated_at: "2026-06-21T10:00:00+08:00",
      methodology_version: "static-report-method-v0",
      rights_policy_version: "rights-static-report-v0"
    });
    expect(plan.metadata.disclaimer).toContain("not investment advice");
    expect(plan.report).toMatchObject({
      format: "pdf",
      report_id: "report_00700_static",
      source_run_id: "research_run_00700",
      static_report_allowed: true,
      table: "core.static_report_artifact"
    });
    expect(plan.rights_boundary).toEqual({
      allowed_scope_only: true,
      field_authorization_source: "data_access_gateway_or_report_snapshot",
      raw_partner_data_embedded: false,
      redistribution_requires_rights_policy: true,
      required_scope: "exports.read",
      scope_granted: true
    });
    expect(plan.watermark.text).toContain("data_delay_minutes=15");
    expect(plan.usage.credits).toBe(0);
    expect(plan.usage.rows).toBeGreaterThan(0);
  });

  it("blocks static reports without required scope or metadata", () => {
    const missingScope = createStaticReportPlan({
      dataDelayMinutes: 15,
      requestId: "req-static-report-scope",
      scopes: [],
      sourceRunId: "research_run_00700",
      workspaceId: "workspace_research"
    });
    const missingMetadata = createStaticReportPlan({
      dataDelayMinutes: -1,
      requestId: "req-static-report-metadata",
      scopes: ["exports.read"],
      sourceRunId: "research_run_00700",
      workspaceId: "workspace_research"
    });

    expect(missingScope.status).toBe("blocked_unlicensed_scope");
    expect(missingScope.rights_boundary.scope_granted).toBe(false);
    expect(missingMetadata.status).toBe("blocked_metadata_incomplete");
    expect(missingMetadata.validation.metadata_complete).toBe(false);
  });

  it("plans a no-write deep report workflow with evidence index and rerun seed", () => {
    const plan = createDeepReportWorkflowPlan({
      asOf: "2026-06-21T09:30:00+08:00",
      dataDelayMinutes: 15,
      modelVersion: "gpt-5.4-dry-run",
      promptVersion: "prompt.deep-report.v0",
      question: "Generate a deep report for Tencent.",
      requestId: "req-deep-report",
      securityQuery: "00700.HK",
      userId: "user_internal_alpha",
      workflowTaskId: "workflow_task_00700_deep_report",
      workspaceId: "workspace_research"
    });

    expect(plan).toMatchObject({
      as_of: "2026-06-21T09:30:00+08:00",
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      request_id: "req-deep-report",
      sql_emitted: false,
      status: "planned_no_write",
      task_id: "workflow_task_00700_deep_report",
      toolName: "plan_deep_report_workflow",
      workflow_task_id: "workflow_task_00700_deep_report"
    });
    expect(plan.workflow).toEqual({
      binding: "AIPHABEE_RESEARCH_WORKFLOW",
      checkpoint_writes: false,
      execution_status: "planned_no_write",
      live_execution: false,
      provider: "cloudflare_workflows",
      queue_writes: false,
      task_id: "workflow_task_00700_deep_report"
    });
    expect(plan.stages.map((stage) => stage.stage_id)).toEqual([
      "data_fetch",
      "deterministic_analysis",
      "section_generation",
      "citation_validation",
      "evidence_index",
      "rerun_seed"
    ]);
    expect(plan.stages.every((stage) => stage.status === "planned_no_write")).toBe(true);
    expect(plan.stages.every((stage) => stage.live_tool_execution === false)).toBe(true);
    expect(plan.stages.every((stage) => stage.model_calls === false)).toBe(true);
    expect(plan.data_fetch_plan.required_tools).toEqual([
      "resolve_security",
      "get_entitlements",
      "get_security_profile",
      "get_quote_snapshot",
      "get_price_history",
      "get_financial_facts",
      "get_data_lineage",
      "search_announcements",
      "search_documents",
      "diff_announcements"
    ]);
    expect(plan.deterministic_analysis_plan).toMatchObject({
      deterministic_calculations: true,
      model_calls: false,
      status: "planned_no_write"
    });
    expect(plan.section_plan).toMatchObject({
      generation_status: "planned_no_model",
      model_calls: false
    });
    expect(plan.section_plan.sections).toEqual([
      "executive_summary",
      "business_snapshot",
      "financial_analysis",
      "risk_events",
      "evidence_appendix",
      "disclaimer"
    ]);
    expect(plan.citation_validation).toEqual({
      every_claim_requires_evidence: true,
      required: true,
      status: "planned_no_write",
      unsupported_claim_label: "unknown"
    });
    expect(plan.evidence_index).toMatchObject({
      table: "core.deep_report_evidence_index"
    });
    expect(plan.evidence_index.records).toHaveLength(plan.section_plan.sections.length);
    expect(plan.evidence_index.records[0]).toMatchObject({
      citation_status: "planned_validation",
      data_version: plan.version,
      methodology_version: plan.version
    });
    expect(plan.report_snapshot).toMatchObject({
      as_of: "2026-06-21T09:30:00+08:00",
      data_delay_minutes: 15,
      immutable_report_snapshot: true,
      static_report_allowed: true,
      table: "core.deep_report_snapshot",
      version: plan.version
    });
    expect(plan.rerun).toEqual({
      data_model_parameter_diff_ready: true,
      deterministic_replay_ready: true,
      old_report_mutation_allowed: false,
      replay_route: "POST /research/runs/replay/plan",
      saved_snapshot_id: plan.report_snapshot.snapshot_id,
      silent_rewrite_allowed: false
    });
    expect(plan.persistence_plan).toEqual({
      checkpoint_writes: false,
      live_db_writes: false,
      r2_writes: false,
      sql_emitted: false,
      tables: [
        "core.deep_report_snapshot",
        "core.deep_report_evidence_index",
        "core.workflow_task",
        "core.workflow_task_checkpoint"
      ],
      write_status: "planned_no_write"
    });
    expect(plan.usage_estimate).toEqual({
      debit_status: "not_debited",
      estimated_credits: 20,
      failure_refund_ready: true,
      high_cost_confirmation_required: true
    });
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
      parameters: {
        comparison_periods: 2,
        currency: "HKD"
      },
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
    expect(plan.parameter_snapshot).toMatchObject({
      parameters: {
        comparison_periods: 2,
        currency: "HKD"
      },
      parameters_recorded: true
    });
    expect(plan.parameter_snapshot.parameter_hash).toMatch(/^[a-f0-9]{8}$/u);
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

  it("plans saved run replay with data, model, and parameter diffs", () => {
    const savedPlan = createResearchRunSavePlan({
      evidenceRecords: [
        {
          dataVersion: "data-v0",
          evidenceRecordId: "evidence_00700_old",
          methodologyVersion: "method-v0",
          sourceRecordIds: ["src_00700_old"]
        }
      ],
      modelProvider: "cloudflare_ai_gateway",
      modelVersion: "gpt-5.4-dry-run",
      parameters: {
        currency: "HKD",
        period_count: 2
      },
      promptTemplateId: "research-summary-v0",
      promptVersion: "prompt.research-summary.v0",
      question: "Compare Tencent annual revenue across periods.",
      requestId: "req-research-save-for-replay",
      runId: "run_00700_research",
      toolCalls: [
        {
          dataVersion: "data-v0",
          input: {
            document_id: "doc_ann_00700_20240320_results"
          },
          methodologyVersion: "method-v0",
          requestId: "req-tool-old",
          toolCallId: "tool_call_diff_announcements_1",
          toolName: "diff_announcements",
          toolVersion: "tool-v0"
        }
      ]
    });

    const replayPlan = createResearchRunReplayPlan({
      currentRun: {
        evidenceRecords: [
          {
            dataVersion: "data-v1",
            evidenceRecordId: "evidence_00700_new",
            methodologyVersion: "method-v1",
            sourceRecordIds: ["src_00700_new"]
          }
        ],
        modelProvider: "cloudflare_ai_gateway",
        modelVersion: "gpt-5.5-dry-run",
        parameters: {
          currency: "USD",
          include_segments: true,
          period_count: 2
        },
        promptTemplateId: "research-summary-v0",
        promptVersion: "prompt.research-summary.v1",
        question: "Compare Tencent annual revenue across periods.",
        toolCalls: [
          {
            dataVersion: "data-v1",
            input: {
              document_id: "doc_ann_00700_20250320_results"
            },
            methodologyVersion: "method-v1",
            requestId: "req-tool-new",
            toolCallId: "tool_call_diff_announcements_1",
            toolName: "diff_announcements",
            toolVersion: "tool-v1"
          }
        ]
      },
      replayReason: "new annual results filing",
      requestId: "req-research-replay",
      savedRun: savedPlan
    });

    expect(replayPlan).toMatchObject({
      frontend_rendering: false,
      immutable_report_snapshot: true,
      live_db_writes: false,
      old_report: {
        immutable_report_snapshot: true,
        mutation_allowed: false,
        preserved_snapshot_id: savedPlan.snapshot_id,
        silent_rewrite_allowed: false
      },
      replay_execution: {
        execution_status: "planned_no_write",
        live_model_call: false,
        live_tool_execution: false,
        sql_emitted: false
      },
      replay_reason: "new annual results filing",
      route: "POST /research/runs/replay/plan",
      saved_snapshot_id: savedPlan.snapshot_id,
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "replay_research_run"
    });
    expect(replayPlan.diff_summary).toEqual({
      categories: ["data", "model", "parameters"],
      changed: true,
      data_changed: true,
      model_changed: true,
      parameters_changed: true
    });
    expect(replayPlan.diffs.data).toMatchObject({
      changed: true,
      changed_source_record_ids: ["src_00700_new", "src_00700_old"],
      current_source_record_ids: ["src_00700_new"],
      data_version_changed: true,
      previous_source_record_ids: ["src_00700_old"]
    });
    expect(replayPlan.diffs.model).toMatchObject({
      changed: true,
      current_model_version: "gpt-5.5-dry-run",
      current_prompt_version: "prompt.research-summary.v1",
      model_version_changed: true,
      previous_model_version: "gpt-5.4-dry-run",
      prompt_version_changed: true
    });
    expect(replayPlan.diffs.parameters).toMatchObject({
      added_keys: ["include_segments"],
      changed: true,
      changed_keys: ["currency"],
      question_changed: false,
      removed_keys: [],
      tool_input_changed: true
    });
    expect(replayPlan.replay_snapshot_id).toBe(
      replayPlan.current_run_plan.snapshot_id
    );
    expect(replayPlan.current_run_plan.parameter_snapshot.parameters).toEqual({
      currency: "USD",
      include_segments: true,
      period_count: 2
    });
  });

  it("plans data correction impact marks and user notifications", () => {
    const affectedRun = createResearchRunSavePlan({
      evidenceRecords: [
        {
          dataVersion: "data-v0",
          evidenceRecordId: "evidence_00700_old",
          methodologyVersion: "method-v0",
          sourceRecordIds: ["src_00700_old", "src_00700_unchanged"]
        }
      ],
      modelProvider: "cloudflare_ai_gateway",
      modelVersion: "gpt-5.4-dry-run",
      promptVersion: "prompt.research-summary.v0",
      question: "Compare Tencent annual revenue across periods.",
      requestId: "req-research-save-for-correction",
      runId: "run_00700_research",
      toolCalls: [
        {
          dataVersion: "data-v0",
          input: {
            document_id: "doc_ann_00700_20240320_results"
          },
          methodologyVersion: "method-v0",
          requestId: "req-tool-old",
          toolCallId: "tool_call_diff_announcements_1",
          toolName: "diff_announcements",
          toolVersion: "tool-v0"
        }
      ],
      userId: "user_internal_alpha",
      workspaceId: "workspace_research"
    });
    const unaffectedRun = createResearchRunSavePlan({
      evidenceRecords: [
        {
          dataVersion: "data-v0",
          evidenceRecordId: "evidence_00005_old",
          methodologyVersion: "method-v0",
          sourceRecordIds: ["src_00005_old"]
        }
      ],
      modelProvider: "cloudflare_ai_gateway",
      modelVersion: "gpt-5.4-dry-run",
      promptVersion: "prompt.research-summary.v0",
      question: "Summarize HSBC annual revenue.",
      requestId: "req-research-save-unaffected",
      runId: "run_00005_research",
      toolCalls: [
        {
          dataVersion: "data-v0",
          input: {
            document_id: "doc_ann_00005_20240320_results"
          },
          methodologyVersion: "method-v0",
          requestId: "req-tool-unaffected",
          toolName: "search_announcements"
        }
      ],
      userId: "user_internal_beta",
      workspaceId: "workspace_research"
    });

    const plan = createDataCorrectionNotificationPlan({
      affectedRuns: [affectedRun, unaffectedRun],
      asOf: "2026-06-21T10:15:00+08:00",
      corrections: [
        {
          correctedDataVersion: "data-v1",
          correctionId: "correction_src_00700_old_v1",
          previousDataVersion: "data-v0",
          reason: "partner_restatement",
          severity: "high",
          sourceRecordId: "src_00700_old"
        }
      ],
      notificationChannels: ["in_app", "email"],
      requestId: "req-data-correction-notify"
    });

    expect(plan).toMatchObject({
      as_of: "2026-06-21T10:15:00+08:00",
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      notification_fanout: false,
      request_id: "req-data-correction-notify",
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "plan_data_correction_notifications"
    });
    expect(plan.corrections).toEqual([
      {
        corrected_data_version: "data-v1",
        correction_event_id: "correction_src_00700_old_v1",
        previous_data_version: "data-v0",
        reason: "partner_restatement",
        severity: "high",
        source_record_id: "src_00700_old",
        table: "core.data_correction_event",
        write_status: "planned_no_write"
      }
    ]);
    expect(plan.affected_reports.count).toBe(1);
    expect(plan.affected_reports.items[0]).toMatchObject({
      evidence_record_ids: ["evidence_00700_old"],
      impacted_source_record_ids: ["src_00700_old"],
      notification_required: true,
      research_run_id: "run_00700_research",
      snapshot_id: affectedRun.snapshot_id,
      table: "core.research_run_correction_impact",
      user_id: "user_internal_alpha",
      workspace_id: "workspace_research",
      write_status: "planned_no_write"
    });
    expect(plan.notification_plan).toMatchObject({
      channels: ["in_app", "email"],
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      fanout_status: "planned_no_write",
      notification_required: true,
      table: "core.user_notification",
      user_notification_count: 2
    });
    expect(plan.notification_plan.notifications.map((item) => item.channel)).toEqual([
      "in_app",
      "email"
    ]);
    expect(plan.persistence_plan).toEqual({
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      tables: [
        "core.data_correction_event",
        "core.research_run_correction_impact",
        "core.user_notification"
      ],
      write_status: "planned_no_write"
    });
    expect(plan.replay).toEqual({
      old_report_mutation_allowed: false,
      replay_route: "POST /research/runs/replay/plan",
      rerun_recommended: true,
      silent_rewrite_allowed: false
    });
    expect(plan.validation).toEqual({
      affected_reports_present: true,
      corrections_present: true,
      required_context_present: true
    });
    expect(plan.usage.rows).toBe(4);
  });

  it("blocks data correction notifications without affected reports", () => {
    const plan = createDataCorrectionNotificationPlan({
      corrections: [
        {
          correctedDataVersion: "data-v1",
          sourceRecordId: "src_00700_old"
        }
      ],
      requestId: "req-data-correction-blocked"
    });

    expect(plan.status).toBe("blocked_missing_context");
    expect(plan.affected_reports.count).toBe(0);
    expect(plan.persistence_plan.write_status).toBe("blocked");
    expect(plan.validation).toEqual({
      affected_reports_present: false,
      corrections_present: true,
      required_context_present: false
    });
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
