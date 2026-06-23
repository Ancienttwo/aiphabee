import { describe, expect, it } from "vitest";
import {
  compareIpos,
  diffResearchAnnouncements,
  getDeveloperConsoleSnapshot,
  getResearchAnnouncement,
  getResearchLibrarySnapshot,
  getIpo,
  getIpos,
  normalizeScreeningInput,
  searchResearchLibrary,
  screenIpos,
} from "./mock-api";
import { IPOS } from "../data/ipos";
import {
  demandColor,
  formatHKD,
  formatListingDate,
  formatMultiple,
  formatPercent,
  formatScore,
} from "./format";

describe("mock-api", () => {
  it("getIpos wraps every IPO in a success envelope (contract shape)", () => {
    const env = getIpos();
    expect(env.ok).toBe(true);
    expect(env.market_status).toBe("not_applicable");
    expect(env.provenance[0]?.source).toBe("mock-fixture");
    expect(env.usage.credits).toBe(0);
    if (env.ok) {
      expect(env.data.length).toBe(IPOS.length);
      expect(env.data.length).toBeGreaterThan(0);
    }
  });

  it("getIpo returns a success envelope for a known id", () => {
    const env = getIpo("honeycomb");
    expect(env.ok).toBe(true);
    if (env.ok) {
      expect(env.data.ticker).toBe("2769.HK");
      // Compliance: research signal, NOT a buy/sell recommendation field.
      expect(env.data).not.toHaveProperty("recommendation");
      expect(env.data.signal).toBe("strong_positive");
    }
  });

  it("getIpo returns a NOT_FOUND error envelope for an unknown id", () => {
    const env = getIpo("does-not-exist");
    expect(env.ok).toBe(false);
    if (!env.ok) {
      expect(env.error.code).toBe("NOT_FOUND");
    }
  });

  it("compareIpos exposes a 2-5 IPO comparison matrix with why text", () => {
    const env = compareIpos(["honeycomb", "lotus", "pearl"]);
    expect(env.ok).toBe(true);
    if (env.ok) {
      expect(env.data.rows).toHaveLength(3);
      expect(env.data.metrics.map((metric) => metric.key)).toEqual([
        "score",
        "subscription",
        "confidence",
        "rating",
        "cornerstone",
      ]);
      expect(env.data.rows[0]?.metrics.subscription).toBe(128.4);
      expect(env.data.rows[0]?.why.join(" ")).toContain("2769.HK");
      expect(env.data.incomparable_reasons).toEqual([]);
    }
  });

  it("compareIpos rejects requests outside the 2-5 item contract", () => {
    const env = compareIpos(["honeycomb"]);
    expect(env.ok).toBe(false);
    if (!env.ok) {
      expect(env.error.code).toBe("OUT_OF_RANGE");
    }
  });

  it("screenIpos returns editable conditions, hits, and rejected reasons", () => {
    const env = screenIpos({
      minScore: 60,
      minSubscription: 20,
      minConfidence: 70,
      status: "pending",
      requireCornerstone: true,
    });
    expect(env.ok).toBe(true);
    if (env.ok) {
      expect(env.data.confirmation_required_before_live_execution).toBe(true);
      expect(env.data.conditions.some((condition) => condition.field === "status")).toBe(true);
      expect(env.data.hits.map((hit) => hit.ipo.id)).toEqual(["honeycomb", "lotus"]);
      expect(env.data.hits[0]?.why.join(" ")).toContain("passes all structured conditions");
      expect(env.data.rejected.find((row) => row.ipo.id === "apex")?.rejected_reasons.join(" ")).toContain(
        "score 49 < 60",
      );
    }
  });

  it("normalizeScreeningInput clamps editable numeric fields", () => {
    expect(normalizeScreeningInput({ minScore: 120, minConfidence: -5, minSubscription: -10 })).toMatchObject({
      minScore: 100,
      minConfidence: 0,
      minSubscription: 0,
    });
  });

  it("searchResearchLibrary returns announcement rows with evidence locators", () => {
    const env = searchResearchLibrary({ keyword: "results", category: "results" });
    expect(env.ok).toBe(true);
    if (env.ok) {
      expect(env.data.toolName).toBe("search_announcements");
      expect(env.data.frontend_rendering).toBe(false);
      expect(env.data.results.length).toBeGreaterThan(0);
      expect(env.data.results[0]?.document_id).toContain("ann_");
      expect(env.data.results[0]?.evidence_locator.locator_type).toBe("synthetic_original_locator");
    }
  });

  it("getResearchAnnouncement exposes bounded sanitized excerpts", () => {
    const env = getResearchAnnouncement("doc_ann_00700_20260103_dividend");
    expect(env.ok).toBe(true);
    if (env.ok) {
      expect(env.data.toolName).toBe("get_announcement");
      expect(env.data.full_document_returned).toBe(false);
      expect(env.data.excerpts_authorized).toBe(true);
      expect(env.data.sanitization_summary.removed_item_count).toBeGreaterThan(0);
      expect(env.data.excerpts.length).toBeGreaterThan(0);
      expect(env.data.excerpts.every((excerpt) => excerpt.sanitization.raw_excerpt_returned === false)).toBe(true);
    }
  });

  it("diffResearchAnnouncements returns schema-bound numeric changes", () => {
    const env = diffResearchAnnouncements();
    expect(env.ok).toBe(true);
    if (env.ok) {
      expect(env.data.toolName).toBe("diff_announcements");
      expect(env.data.schema_validation.valid).toBe(true);
      expect(env.data.diffs.map((diff) => diff.field_id)).toEqual(["revenue", "operating_profit"]);
      expect(env.data.diffs[0]?.direction).toBe("increase");
    }
  });

  it("getResearchLibrarySnapshot plans immutable save and no-write replay", () => {
    const env = getResearchLibrarySnapshot({ keyword: "results" });
    expect(env.ok).toBe(true);
    if (env.ok) {
      expect(env.data.savedRun.toolName).toBe("save_research_run");
      expect(env.data.savedRun.immutable_report_snapshot).toBe(true);
      expect(env.data.savedRun.persistence_plan.write_status).toBe("planned_no_write");
      expect(env.data.replay.toolName).toBe("replay_research_run");
      expect(env.data.replay.old_report.silent_rewrite_allowed).toBe(false);
      expect(env.data.replay.replay_execution.execution_status).toBe("planned_no_write");
      expect(env.data.replay.diff_summary.categories).toEqual(["data", "model", "parameters"]);
    }
  });

  it("getDeveloperConsoleSnapshot renders planned MCP console evidence without secrets", () => {
    const env = getDeveloperConsoleSnapshot();
    expect(env.ok).toBe(true);
    if (env.ok) {
      const { plan, guardrails } = env.data;
      expect(plan.connection_guide.steps.map((step) => step.step)).toEqual([
        "choose_credential",
        "initialize",
        "list_tools",
        "first_tool_call",
      ]);
      expect(plan.credentials.api_key.create_route).toBe("POST /mcp/api-keys/create/plan");
      expect(plan.credentials.oauth.authorize_route).toBe("POST /mcp/oauth/authorize/plan");
      expect(plan.scope_panel.scope_catalog.some((scope) => scope.scope === "market.read")).toBe(true);
      expect(plan.quota_panel.request_id_visible).toBe(true);
      expect(plan.quota_panel.usage.request_id).toContain("mock-developer-console");
      expect(plan.examples.calls.map((example) => example.method)).toEqual([
        "initialize",
        "tools/list",
        "tools/call",
      ]);
      expect(plan.request_log_panel.sample_rows[0]?.request_id).toContain("example-tools-call");
      expect(guardrails).toEqual({
        liveApiKeyGeneration: false,
        liveConsoleLogStore: false,
        liveOAuthProvider: false,
        liveTargetClientE2E: false,
        rawSecretDisplay: false,
      });
      expect(Object.keys(plan.request_log_panel.sample_rows[0] ?? {})).not.toEqual(
        expect.arrayContaining(Array.from(plan.request_log_panel.forbidden_fields)),
      );
      expect(plan.credentials.api_key.live_secret_generation).toBe(false);
      expect(plan.credentials.oauth.token_storage_live).toBe(false);
    }
  });
});

describe("format helpers", () => {
  it("formats finance values in the product's conventions", () => {
    expect(formatHKD(24.8)).toBe("HK$24.80");
    expect(formatMultiple(128.4)).toBe("128.4×");
    expect(formatPercent(86)).toBe("86%");
    expect(formatScore(72)).toBe("72 / 100");
    expect(formatListingDate("Jun 24, 2026")).toBe("Jun 24");
  });

  it("demandColor reflects oversubscription bands", () => {
    expect(demandColor(128)).toBe("var(--green-600)");
    expect(demandColor(2)).toBe("var(--neutral-500)");
    expect(demandColor(20)).toBe("var(--text-primary)");
  });
});
