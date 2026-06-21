import { describe, expect, it } from "vitest";
import {
  getAnnouncement,
  getAnnouncementCapabilities,
  getDocumentToolsCapabilities,
  getSearchAnnouncementsCapabilities,
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
      status: "get_announcement_scaffold",
      tool_name: "get_announcement",
      untrusted_document_policy: true,
      vector_search: false
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
    expect(result.document_trust_policy).toEqual({
      content_is_untrusted_data: true,
      prompt_injection_isolated: true,
      scripts_executable: false
    });
    expect(result.source).toMatchObject({
      category: "dividend",
      source_record_id: "src_announcement_00700_20260103_dividend",
      symbol: "00700.HK"
    });
    expect(result.usage.rows).toBe(1);
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
