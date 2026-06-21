import { describe, expect, it } from "vitest";
import {
  EvidenceServiceInputError,
  createEvidenceRecordPlan,
  DataLineageInputError,
  EntitlementsInputError,
  getDataLineage,
  getDataLineageCapabilities,
  getEntitlements,
  getEntitlementsCapabilities,
  getEvidenceServiceCapabilities,
  getEvidenceLineageCapabilities
} from "./index";

describe("evidence-lineage tool scaffolds", () => {
  it("returns source, batch, version, formula, and upstream lineage by evidence id", () => {
    const result = getDataLineage({
      evidenceId: "ev_financial_facts_00700_fy2023"
    });

    expect(result.status).toBe("found");
    expect(result.liveDataAccess).toBe(false);
    expect(result.lineage).toMatchObject({
      dataVersion: "financial-facts-synthetic-v0",
      dataset: "financial_facts",
      formula: "standardized_statement_row = source_fact.value * scale",
      recordId: "financial_fact:eq_hk_00700:2023-12-31:restatement-1",
      sourceBatchId: "batch-financial-facts-20240401",
      toolName: "get_financial_facts",
      version: 1
    });
    expect(result.lineage?.upstream[0]).toMatchObject({
      dataset: "security_master",
      recordId: "security:eq_hk_00700"
    });
    expect(result.provenance[0]?.source).toBe("evidence-lineage");
    expect(result.usage.rows).toBe(1);
  });

  it("returns lineage by source record id and can suppress upstream detail", () => {
    const result = getDataLineage({
      includeUpstream: false,
      recordId: "quote:eq_hk_00700:2026-01-07:close"
    });

    expect(result.status).toBe("found");
    expect(result.lookupKind).toBe("record_id");
    expect(result.lineage?.evidenceId).toBe("ev_quote_00700_20260107_close");
    expect(result.lineage?.upstream).toEqual([]);
  });

  it("returns held lineage fixtures without enabling live reads", () => {
    const result = getDataLineage({
      evidenceId: "ev_quote_08001_quality_hold"
    });

    expect(result.status).toBe("data_quality_hold");
    expect(result.lineage?.qualityState).toBe("HOLD");
    expect(result.liveDataAccess).toBe(false);
  });

  it("returns not_found and validates lineage lookup input", () => {
    const result = getDataLineage({
      evidenceId: "ev_missing"
    });

    expect(result.status).toBe("not_found");
    expect(result.usage.rows).toBe(0);
    expect(() => getDataLineage({})).toThrow(DataLineageInputError);
    expect(() =>
      getDataLineage({
        asOf: "not-a-date",
        evidenceId: "ev_quote_00700_20260107_close"
      })
    ).toThrow(DataLineageInputError);
  });

  it("returns an overview of current workspace entitlements", () => {
    const result = getEntitlements();

    expect(result.status).toBe("found");
    expect(result.workspaceId).toBe("ws_demo_pro");
    expect(result.entitlements.datasets).toContain("financial_facts");
    expect(result.entitlements.tools).toContain("get_financial_facts");
    expect(result.policySource).toMatchObject({
      liveDbReads: false,
      partnerRightsMatrixLoaded: false,
      sqlEmitted: false,
      status: "policy_source_scaffold"
    });
    expect(result.liveDataAccess).toBe(false);
  });

  it("runs field-level entitlement checks through the gateway policy evaluator", () => {
    const result = getEntitlements({
      dataset: "financial_facts",
      fields: ["revenue", "capital_expenditure"],
      workspaceId: "ws_demo_pro"
    });

    expect(result.status).toBe("found");
    expect(result.decision?.status).toBe("allow_with_redactions");
    expect(result.entitlements.allowedFields).toEqual(["revenue"]);
    expect(result.entitlements.deniedFields).toEqual([
      {
        field: "capital_expenditure",
        reason: "workspace_entitlement_blocked"
      }
    ]);
    expect(result.entitlements.limitationCodes).toContain("field_redactions_applied");
  });

  it("maps tool names to datasets and default entitlement fields", () => {
    const result = getEntitlements({
      toolName: "get_quote_snapshot",
      workspaceId: "ws_demo_free"
    });

    expect(result.status).toBe("found");
    expect(result.dataset).toBe("quote_snapshot");
    expect(result.requestedFields).toContain("lastPrice");
    expect(result.entitlements.delaySeconds).toBe(900);
    expect(result.entitlements.historyDays).toBe(30);
    expect(result.decision?.status).toBe("allow");
  });

  it("returns standard denial statuses for unsupported scope and limits", () => {
    expect(
      getEntitlements({
        workspaceId: "ws_missing"
      }).status
    ).toBe("scope_denied");
    expect(
      getEntitlements({
        dataset: "vendor_ticks",
        workspaceId: "ws_demo_pro"
      }).status
    ).toBe("data_not_licensed");
    expect(
      getEntitlements({
        dataset: "financial_facts",
        fields: ["free_cash_flow"],
        workspaceId: "ws_demo_pro"
      }).status
    ).toBe("data_not_licensed");
    expect(
      getEntitlements({
        dataset: "quote_snapshot",
        requestedRows: 501,
        workspaceId: "ws_demo_pro"
      }).status
    ).toBe("too_many_rows");
    expect(
      getEntitlements({
        dataset: "quote_snapshot",
        timeRange: {
          from: "2024-01-01",
          to: "2026-01-07"
        },
        workspaceId: "ws_demo_pro"
      }).status
    ).toBe("out_of_range");
  });

  it("validates entitlement query input", () => {
    expect(() =>
      getEntitlements({
        channel: "partner"
      })
    ).toThrow(EntitlementsInputError);
    expect(() =>
      getEntitlements({
        fields: ["valid", "  "]
      })
    ).toThrow(EntitlementsInputError);
    expect(() =>
      getEntitlements({
        requestedRows: 0
      })
    ).toThrow(EntitlementsInputError);
    expect(() =>
      getEntitlements({
        timeRange: {
          from: "2026-01-07",
          to: "2026-01-01"
        }
      })
    ).toThrow(EntitlementsInputError);
  });

  it("reports scaffold capabilities for both tools", () => {
    expect(getDataLineageCapabilities()).toMatchObject({
      handler_ready: true,
      live_data_access: false,
      status: "get_data_lineage_scaffold"
    });
    expect(getEntitlementsCapabilities()).toMatchObject({
      gateway_policy_compiler: true,
      handler_ready: true,
      live_data_access: false,
      status: "get_entitlements_scaffold"
    });
    expect(getEvidenceLineageCapabilities()).toMatchObject({
      handler_ready_tool_count: 2,
      live_data_access: false,
      status: "evidence_lineage_tools_scaffold"
    });
  });

  it("creates no-write evidence record plans with user-visible citations", () => {
    const plan = createEvidenceRecordPlan({
      dataVersion: "financial-facts-synthetic-v0",
      inputSchemaId: "tool.get_financial_facts.input.v0",
      methodologyVersion: "2026-06-21.phase1.get-financial-facts-tool-scaffold.v0",
      outputSchemaId: "tool.get_financial_facts.output.v0",
      requestId: "req-financial-facts",
      sourceRecords: [
        {
          dataVersion: "financial-facts-synthetic-v0",
          methodologyVersion: "2026-06-21.phase1.get-financial-facts-tool-scaffold.v0",
          source: "synthetic.financial_facts.statement",
          sourceRecordId: "financial-facts:eq_hk_00700:2023-12-31:v1"
        }
      ],
      toolName: "get_financial_facts",
      userVisibleLabel: "FY2023 financial facts"
    });

    expect(plan.status).toBe("planned_no_write");
    expect(plan.liveDbWrites).toBe(false);
    expect(plan.sqlEmitted).toBe(false);
    expect(plan.tables).toEqual(["core.evidence_record", "core.evidence_source_ref"]);
    expect(plan.evidenceRecord).toMatchObject({
      inputSchemaId: "tool.get_financial_facts.input.v0",
      outputSchemaId: "tool.get_financial_facts.output.v0",
      requestId: "req-financial-facts",
      rightsState: "default_deny",
      toolName: "get_financial_facts"
    });
    expect(plan.sourceRefs[0]).toMatchObject({
      evidenceRecordId: plan.evidenceRecord.evidenceRecordId,
      source: "synthetic.financial_facts.statement",
      sourceRecordId: "financial-facts:eq_hk_00700:2023-12-31:v1"
    });
    expect(plan.citation).toMatchObject({
      label: "FY2023 financial facts",
      visibility: "user_visible"
    });
    expect(plan.provenance.map((source) => source.source_record_id)).toContain(
      "financial-facts:eq_hk_00700:2023-12-31:v1"
    );
  });

  it("validates evidence service planner input and reports capabilities", () => {
    expect(() =>
      createEvidenceRecordPlan({
        dataVersion: "financial-facts-synthetic-v0",
        methodologyVersion: "methodology-v0",
        requestId: "req-missing-source",
        sourceRecords: [],
        toolName: "get_financial_facts"
      })
    ).toThrow(EvidenceServiceInputError);
    expect(() =>
      createEvidenceRecordPlan({
        dataVersion: "financial-facts-synthetic-v0",
        methodologyVersion: "methodology-v0",
        requestId: "req-bad-as-of",
        asOf: "not-a-date",
        sourceRecords: [
          {
            dataVersion: "financial-facts-synthetic-v0",
            methodologyVersion: "methodology-v0",
            source: "synthetic",
            sourceRecordId: "record-1"
          }
        ],
        toolName: "get_financial_facts"
      })
    ).toThrow(EvidenceServiceInputError);
    expect(getEvidenceServiceCapabilities()).toMatchObject({
      durable_schema_ready: true,
      live_db_writes: false,
      source_record_linking: true,
      status: "evidence_lineage_service_scaffold",
      user_visible_citations: true
    });
  });
});
