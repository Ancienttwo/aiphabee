import { describe, expect, it } from "vitest";
import {
  diffAnnouncements,
  getDocumentSanitizerCapabilities,
  getAnnouncement,
  getAnnouncementCapabilities,
  getDiffAnnouncementsCapabilities,
  getDocumentToolsCapabilities,
  getSearchAnnouncementsCapabilities,
  getSearchDocumentsCapabilities,
  searchDocuments,
  searchAnnouncements
} from "./index";

describe("search announcements scaffold", () => {
  it("reports document tool capabilities", () => {
    expect(getDocumentToolsCapabilities()).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      package: "@aiphabee/document-tools",
      route: "POST /documents/search-announcements",
      runtime_route: "GET /documents/runtime",
      status: "document_tools_scaffold"
    });
    expect(getAnnouncementCapabilities()).toMatchObject({
      allowed_excerpt_scope: "synthetic_excerpt_allowlist",
      evidence_locator_ready: true,
      max_excerpt_chars: 400,
      original_document_fetch: false,
      route: "POST /documents/get-announcement",
      sanitizer_enabled: true,
      status: "get_announcement_scaffold",
      tool_name: "get_announcement",
      untrusted_document_policy: true,
      vector_search: false
    });
    expect(getDocumentSanitizerCapabilities()).toMatchObject({
      applied_route: "POST /documents/get-announcement",
      hidden_text_removed: true,
      output_contains_raw_html: false,
      raw_excerpt_returned: false,
      scripts_executable: false,
      status: "document_sanitizer_scaffold",
      tool_invocation_allowed_from_document: false,
      tool_name: "document_sanitizer"
    });
    expect(getSearchDocumentsCapabilities()).toMatchObject({
      embedding_model: "synthetic-text-embedding-v0",
      index_name: "document_chunks_pgvector_synthetic",
      live_pgvector: false,
      metadata_filter_pushdown: true,
      pgvector_first: true,
      route: "POST /documents/search-documents",
      search_engine: "synthetic_pgvector_scaffold",
      status: "search_documents_scaffold",
      tool_name: "search_documents",
      vector_search: true,
      vectorize_optional: true
    });
    expect(getDiffAnnouncementsCapabilities()).toMatchObject({
      comparison_engine: "synthetic_schema_bound_numeric_diff",
      evidence_binding_ready: true,
      original_document_fetch: false,
      route: "POST /documents/diff-announcements",
      schema_id: "announcement_numeric_extraction_v0",
      schema_validation_ready: true,
      status: "diff_announcements_scaffold",
      tool_name: "diff_announcements",
      untrusted_document_policy: true,
      vector_search: false
    });
    expect(getDocumentToolsCapabilities()).toMatchObject({
      diff_announcements: {
        route: "POST /documents/diff-announcements",
        status: "diff_announcements_scaffold",
        tool_name: "diff_announcements"
      },
      routes: expect.arrayContaining(["POST /documents/diff-announcements"])
    });
    expect(getSearchAnnouncementsCapabilities()).toMatchObject({
      date_basis: "published_at",
      evidence_locator_ready: true,
      max_limit: 5,
      original_document_fetch: false,
      route: "POST /documents/search-announcements",
      search_engine: "synthetic_filter_scaffold",
      status: "search_announcements_scaffold",
      tool_name: "search_announcements",
      untrusted_document_policy: true,
      vector_search: false
    });
  });

  it("searches by company, date, category, and keyword", () => {
    const result = searchAnnouncements({
      categories: ["dividend"],
      from: "2026-01-01",
      keyword: "timetable",
      requestId: "req_search_announcements",
      securityQuery: "00700.HK",
      to: "2026-01-07"
    });

    expect(result).toMatchObject({
      evidence_locator_ready: true,
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      original_document_fetch: false,
      row_count: 1,
      search_engine: "synthetic_filter_scaffold",
      status: "found",
      toolName: "search_announcements",
      vector_search: false
    });
    expect(result.filters).toMatchObject({
      date_basis: "published_at",
      from: "2026-01-01",
      keyword: "timetable",
      to: "2026-01-07"
    });
    expect(result.results[0]).toMatchObject({
      category: "dividend",
      document_id: "doc_ann_00700_20260103_dividend",
      evidence_locator: {
        anchor: "dividend-timetable",
        external_href_authority: false,
        locator_type: "synthetic_original_locator",
        original_url:
          "urn:aiphabee:synthetic:announcement:ann_00700_20260103_dividend#page=2&anchor=dividend-timetable",
        page: 2
      },
      language: "en",
      matched_fields: ["title", "summary"],
      published_at: "2026-01-03T12:00:00+08:00",
      source_record_id: "src_announcement_00700_20260103_dividend",
      title: "Dividend Timetable Update",
      untrusted_document: true
    });
    expect(result.document_trust_policy).toEqual({
      content_is_untrusted_data: true,
      prompt_injection_isolated: true,
      scripts_executable: false
    });
    expect(result.usage.rows).toBe(1);
  });

  it("filters by language and preserves newest-first ordering", () => {
    const result = searchAnnouncements({
      language: "zh-Hant",
      requestId: "req_search_announcements_zh",
      securityQuery: "00700.HK"
    });

    expect(result.status).toBe("found");
    expect(result.results.map((announcement) => announcement.announcement_id)).toEqual([
      "ann_00700_20260106_buyback"
    ]);
    expect(result.results[0]?.language).toBe("zh-Hant");
  });

  it("blocks ambiguous security resolution without guessing", () => {
    const result = searchAnnouncements({
      keyword: "results",
      requestId: "req_search_announcements_ambiguous",
      securityQuery: "ABC"
    });

    expect(result.status).toBe("blocked_resolution");
    expect(result.resolve_security?.status).toBe("ambiguous");
    expect(result.instrument_id).toBeUndefined();
    expect(result.results).toEqual([]);
    expect(result.usage.rows).toBe(0);
  });

  it("returns not_found when filters match no announcements", () => {
    const result = searchAnnouncements({
      categories: ["buyback"],
      from: "2024-01-01",
      keyword: "dividend",
      requestId: "req_search_announcements_empty",
      securityQuery: "00700.HK",
      to: "2024-12-31"
    });

    expect(result.status).toBe("not_found");
    expect(result.row_count).toBe(0);
    expect(result.total_count).toBe(0);
    expect(result.usage.credits).toBe(0);
  });
});

describe("semantic document search scaffold", () => {
  it("returns pgvector-style semantic matches with metadata locators", () => {
    const result = searchDocuments({
      categories: ["dividend"],
      from: "2026-01-01",
      limit: 1,
      query: "payment date dividend",
      requestId: "req_search_documents",
      to: "2026-01-07"
    });

    expect(result).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      live_pgvector: false,
      original_document_fetch: false,
      result_count: 1,
      search_engine: "synthetic_pgvector_scaffold",
      status: "found",
      toolName: "search_documents",
      vector_search: true
    });
    expect(result.index).toEqual({
      embedding_model: "synthetic-text-embedding-v0",
      index_name: "document_chunks_pgvector_synthetic",
      metadata_filter_pushdown: true,
      pgvector_first: true,
      vectorize_optional: true
    });
    expect(result.filters).toMatchObject({
      date_basis: "published_at",
      from: "2026-01-01",
      query: "payment date dividend",
      to: "2026-01-07"
    });
    expect(result.results[0]).toMatchObject({
      category: "dividend",
      chunk_id: "doc_ann_00700_20260103_dividend:dividend_timetable",
      document_id: "doc_ann_00700_20260103_dividend",
      evidence_locator: {
        anchor: "dividend-timetable",
        page: 2,
        paragraph: 3,
        source_record_id: "src_announcement_00700_20260103_dividend"
      },
      rank: 1,
      section_id: "dividend_timetable",
      source_record_id: "src_announcement_00700_20260103_dividend",
      title: "Dividend Timetable Update",
      untrusted_document: true
    });
    expect(result.results[0]?.similarity_score).toBeGreaterThanOrEqual(0.9);
    expect(result.results[0]?.score_explanation).toEqual([
      "matched:payment",
      "matched:date",
      "matched:dividend"
    ]);
    expect(result.results[0]?.sanitized_snippet).not.toMatch(
      /<script|callTool|grant_access|ignore previous instructions|invoke tools|run tool_call/iu
    );
    expect(result.document_trust_policy).toEqual({
      content_is_untrusted_data: true,
      prompt_injection_isolated: true,
      scripts_executable: false
    });
    expect(result.usage.rows).toBe(1);
  });

  it("applies document metadata filters before ranking", () => {
    const result = searchDocuments({
      documentIds: ["doc_ann_00700_20240320_results"],
      limit: 1,
      query: "segment revenue payment date",
      requestId: "req_search_documents_filtered"
    });

    expect(result.status).toBe("found");
    expect(result.results.map((row) => row.document_id)).toEqual([
      "doc_ann_00700_20240320_results"
    ]);
    expect(result.results[0]?.section_id).toBe("financial_highlights");
    expect(result.filters.document_ids).toEqual(["doc_ann_00700_20240320_results"]);
  });

  it("returns not_found when semantic score is below threshold", () => {
    const result = searchDocuments({
      minScore: 0.95,
      query: "unrelated macro commodity weather",
      requestId: "req_search_documents_empty"
    });

    expect(result.status).toBe("not_found");
    expect(result.result_count).toBe(0);
    expect(result.results).toEqual([]);
    expect(result.usage.credits).toBe(0);
  });
});

describe("announcement diff extraction scaffold", () => {
  it("extracts schema-bound key numbers and binds them to source locators", () => {
    const result = diffAnnouncements({
      baseDocumentId: "doc_ann_00700_20240320_results",
      comparisonDocumentId: "doc_ann_00700_20250320_results",
      requestId: "req_diff_announcements"
    });
    const revenueDiff = result.diffs.find((diff) => diff.field_id === "revenue");
    const operatingProfitDiff = result.diffs.find(
      (diff) => diff.field_id === "operating_profit"
    );

    expect(result).toMatchObject({
      comparison_engine: "synthetic_schema_bound_numeric_diff",
      diff_count: 2,
      evidence_binding_ready: true,
      extracted_value_count: 4,
      extraction_source: "synthetic_announcement_section_fixture",
      frontend_rendering: false,
      live_data_access: false,
      original_document_fetch: false,
      row_count: 2,
      schema_validation_ready: true,
      sql_emitted: false,
      status: "found",
      toolName: "diff_announcements",
      vector_search: false
    });
    expect(result.documents.base).toMatchObject({
      document_id: "doc_ann_00700_20240320_results",
      source_record_id: "src_announcement_00700_20240320_results",
      symbol: "00700.HK"
    });
    expect(result.documents.comparison).toMatchObject({
      document_id: "doc_ann_00700_20250320_results",
      source_record_id: "src_announcement_00700_20250320_results",
      symbol: "00700.HK"
    });
    expect(result.schema_validation).toMatchObject({
      errors: [],
      schema_id: "announcement_numeric_extraction_v0",
      valid: true,
      validated_value_count: 4
    });
    expect(result.schema_validation.required_fields).toEqual(
      expect.arrayContaining([
        "document_id",
        "field_id",
        "value",
        "source_record_id",
        "evidence_locator"
      ])
    );
    expect(result.extracted_values[0]).toMatchObject({
      document_id: "doc_ann_00700_20240320_results",
      document_role: "base",
      evidence_locator: {
        document_id: "doc_ann_00700_20240320_results",
        page: 4,
        paragraph: 2,
        source_record_id: "src_announcement_00700_20240320_results"
      },
      field_id: "revenue",
      schema_valid: true,
      section_id: "financial_highlights",
      unit: "HKD billion",
      untrusted_document: true,
      value: 609
    });
    expect(revenueDiff).toMatchObject({
      absolute_change: 51.3,
      base_period: "FY2023",
      base_value: 609,
      comparison_period: "FY2024",
      comparison_value: 660.3,
      direction: "increase",
      evidence_locators: {
        base: {
          page: 4,
          paragraph: 2,
          source_record_id: "src_announcement_00700_20240320_results"
        },
        comparison: {
          page: 4,
          paragraph: 2,
          source_record_id: "src_announcement_00700_20250320_results"
        }
      },
      schema_valid: true,
      unit: "HKD billion"
    });
    expect(revenueDiff?.percent_change).toBeCloseTo(0.084236, 6);
    expect(operatingProfitDiff).toMatchObject({
      absolute_change: 24.5,
      base_value: 184.3,
      comparison_value: 208.8,
      field_id: "operating_profit"
    });
    expect(operatingProfitDiff?.percent_change).toBeCloseTo(0.132935, 6);
    expect(result.document_trust_policy).toEqual({
      content_is_untrusted_data: true,
      prompt_injection_isolated: true,
      scripts_executable: false
    });
    expect(result.usage).toEqual({
      cached: false,
      credits: 2,
      rows: 2
    });
  });

  it("does not fabricate diffs for missing announcement documents", () => {
    const result = diffAnnouncements({
      baseDocumentId: "doc_missing",
      comparisonDocumentId: "doc_ann_00700_20250320_results",
      requestId: "req_diff_announcements_missing"
    });

    expect(result.status).toBe("not_found");
    expect(result.diffs).toEqual([]);
    expect(result.extracted_values).toEqual([]);
    expect(result.row_count).toBe(0);
    expect(result.usage.credits).toBe(0);
  });
});

describe("get announcement scaffold", () => {
  it("returns authorized excerpts with page and paragraph locators", () => {
    const result = getAnnouncement({
      documentId: "doc_ann_00700_20260103_dividend",
      requestId: "req_get_announcement",
      sections: ["dividend_timetable"]
    });

    expect(result).toMatchObject({
      document_id: "doc_ann_00700_20260103_dividend",
      excerpts_authorized: true,
      frontend_rendering: false,
      full_document_returned: false,
      live_data_access: false,
      original_document_fetch: false,
      row_count: 1,
      status: "found",
      toolName: "get_announcement",
      vector_search: false
    });
    expect(result.allowed_sections).toEqual(["document_summary", "dividend_timetable"]);
    expect(result.excerpts[0]).toMatchObject({
      authorization: {
        excerpt_scope: "synthetic_excerpt_allowlist",
        full_text_returned: false,
        max_excerpt_chars: 240,
        truncated: false
      },
      evidence_locator: {
        anchor: "dividend-timetable",
        document_id: "doc_ann_00700_20260103_dividend",
        external_href_authority: false,
        locator_type: "synthetic_excerpt_locator",
        original_url:
          "urn:aiphabee:synthetic:announcement:ann_00700_20260103_dividend#page=2&paragraph=3&anchor=dividend-timetable",
        page: 2,
        paragraph: 3,
        source_record_id: "src_announcement_00700_20260103_dividend"
      },
      section_id: "dividend_timetable",
      section_title: "Dividend timetable",
      untrusted_document: true
    });
    expect(result.excerpts[0]?.sanitization).toMatchObject({
      document_instruction_executed: false,
      raw_excerpt_returned: false,
      sanitizer_version: "2026-06-21.phase2.document-sanitizer-scaffold.v0",
      status: "sanitized"
    });
    expect(result.excerpts[0]?.sanitization.removed_items).toEqual([
      "hidden_text",
      "script_tag",
      "suspicious_instruction"
    ]);
    expect(result.document_trust_policy).toEqual({
      content_is_untrusted_data: true,
      prompt_injection_isolated: true,
      scripts_executable: false
    });
    expect(result.sanitization_policy).toMatchObject({
      hidden_text_removed: true,
      output_contains_raw_html: false,
      scripts_removed: true,
      suspicious_instructions_neutralized: true,
      tool_invocation_allowed_from_document: false
    });
    expect(result.sanitization_summary).toEqual({
      raw_document_instructions_ignored: true,
      removed_item_count: 3,
      sections_sanitized: 1,
      sections_reviewed: 1
    });
    expect(result.source).toMatchObject({
      category: "dividend",
      source_record_id: "src_announcement_00700_20260103_dividend",
      symbol: "00700.HK"
    });
    expect(result.usage.rows).toBe(1);
  });

  it("removes script, hidden text, and document-origin instructions before returning excerpts", () => {
    const result = getAnnouncement({
      documentId: "doc_ann_00700_20260103_dividend",
      requestId: "req_get_announcement_sanitized",
      sections: ["dividend_timetable"]
    });
    const excerpt = result.excerpts[0]?.excerpt ?? "";

    expect(result.status).toBe("found");
    expect(result.sanitization_summary).toMatchObject({
      raw_document_instructions_ignored: true,
      sections_sanitized: 1
    });
    expect(result.excerpts[0]?.sanitization).toMatchObject({
      document_instruction_executed: false,
      raw_excerpt_returned: false,
      status: "sanitized"
    });
    expect(excerpt).toContain("The timetable section identifies");
    expect(excerpt).not.toMatch(/<script|<\/script|display:none|callTool|grant_access/iu);
    expect(excerpt).not.toMatch(/ignore (system|previous) instructions|invoke tools|run tool_call/iu);
  });

  it("caps excerpts to the requested authorized length", () => {
    const result = getAnnouncement({
      documentId: "doc_ann_00700_20260103_dividend",
      maxExcerptChars: 80,
      requestId: "req_get_announcement_truncated",
      sections: ["dividend_timetable"]
    });

    expect(result.status).toBe("found");
    expect(result.excerpts[0]?.excerpt.length).toBeLessThanOrEqual(80);
    expect(result.excerpts[0]?.authorization).toMatchObject({
      max_excerpt_chars: 80,
      truncated: true
    });
  });

  it("does not fabricate missing documents or sections", () => {
    const missingDocument = getAnnouncement({
      documentId: "doc_missing",
      requestId: "req_get_announcement_missing"
    });
    const missingSection = getAnnouncement({
      documentId: "doc_ann_00700_20260103_dividend",
      requestId: "req_get_announcement_section_missing",
      sections: ["financial_highlights"]
    });

    expect(missingDocument.status).toBe("not_found");
    expect(missingDocument.row_count).toBe(0);
    expect(missingDocument.usage.credits).toBe(0);
    expect(missingSection.status).toBe("section_not_found");
    expect(missingSection.allowed_sections).toEqual(["document_summary", "dividend_timetable"]);
    expect(missingSection.excerpts).toEqual([]);
  });
});
