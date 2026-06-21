import { describe, expect, it } from "vitest";
import {
  EventTimelineInputError,
  getEventTimeline,
  getEventTimelineCapabilities
} from "./index";

describe("event timeline scaffold", () => {
  it("returns company and market events with source-linked related data", () => {
    const result = getEventTimeline({
      from: "2026-01-03",
      instrumentId: "eq_hk_00700",
      to: "2026-01-07"
    });

    expect(result.status).toBe("found");
    expect(result.toolName).toBe("get_event_timeline");
    expect(result.liveDataAccess).toBe(false);
    expect(result.timeline).toMatchObject({
      instrumentId: "eq_hk_00700",
      rowCount: 4,
      symbol: "00700.HK",
      totalRows: 4
    });
    expect(result.timeline?.events.map((event) => event.eventType)).toEqual([
      "announcement",
      "market_event",
      "financial_disclosure",
      "corporate_action"
    ]);
    expect(result.timeline?.events.some((event) => event.eventScope === "market")).toBe(true);
    expect(
      result.timeline?.events.every(
        (event) =>
          event.sourceRecordId.length > 0 &&
          event.relatedData.every((item) => item.sourceRecordId.length > 0)
      )
    ).toBe(true);
    expect(result.usage).toMatchObject({
      cached: false,
      credits: 12,
      rows: 4
    });
  });

  it("filters event types and paginates timeline rows", () => {
    const firstPage = getEventTimeline({
      from: "2026-01-03",
      instrumentId: "EQ_HK_00700",
      limit: 1,
      to: "2026-01-07",
      types: ["announcement", "corporate_action"]
    });

    expect(firstPage.status).toBe("found");
    expect(firstPage.requestedTypes).toEqual(["announcement", "corporate_action"]);
    expect(firstPage.timeline?.events.map((event) => event.eventType)).toEqual(["announcement"]);
    expect(firstPage.timeline?.nextCursor).toBe("offset:1");

    const secondPage = getEventTimeline({
      cursor: firstPage.timeline?.nextCursor,
      from: "2026-01-03",
      instrumentId: "eq_hk_00700",
      limit: 1,
      to: "2026-01-07",
      types: ["announcement", "corporate_action"]
    });

    expect(secondPage.timeline?.events.map((event) => event.eventType)).toEqual([
      "corporate_action"
    ]);
    expect(secondPage.timeline?.nextCursor).toBeUndefined();
  });

  it("blocks unlicensed event types and data held by quality policy", () => {
    expect(
      getEventTimeline({
        from: "2026-01-03",
        instrumentId: "eq_hk_00700",
        to: "2026-01-07",
        types: ["rumor"]
      })
    ).toMatchObject({
      rejectedTypes: ["rumor"],
      status: "data_not_licensed"
    });

    expect(
      getEventTimeline({
        from: "2026-01-03",
        instrumentId: "eq_hk_hold",
        to: "2026-01-07"
      })
    ).toMatchObject({
      status: "data_quality_hold"
    });
  });

  it("returns not_found, out_of_range, and too_many_rows states", () => {
    expect(
      getEventTimeline({
        from: "2026-01-03",
        instrumentId: "eq_hk_unknown",
        to: "2026-01-07"
      }).status
    ).toBe("not_found");
    expect(
      getEventTimeline({
        from: "2026-01-02",
        instrumentId: "eq_hk_00700",
        to: "2026-01-07"
      }).status
    ).toBe("out_of_range");
    expect(
      getEventTimeline({
        from: "2026-01-03",
        instrumentId: "eq_hk_00700",
        limit: 6,
        to: "2026-01-07"
      }).status
    ).toBe("too_many_rows");
  });

  it("requires instrument and valid date range", () => {
    expect(() =>
      getEventTimeline({
        from: "2026-01-03",
        instrumentId: " ",
        to: "2026-01-07"
      })
    ).toThrow(EventTimelineInputError);
    expect(() =>
      getEventTimeline({
        from: "2026-01-08",
        instrumentId: "eq_hk_00700",
        to: "2026-01-07"
      })
    ).toThrow(EventTimelineInputError);
    expect(() =>
      getEventTimeline({
        cursor: "page:1",
        from: "2026-01-03",
        instrumentId: "eq_hk_00700",
        to: "2026-01-07"
      })
    ).toThrow(EventTimelineInputError);
  });

  it("reports no-live event timeline capabilities", () => {
    expect(getEventTimelineCapabilities()).toMatchObject({
      company_and_market_events: true,
      cursor_pagination: true,
      handler_ready: true,
      live_data_access: false,
      max_rows_per_request: 5,
      related_data_links: true,
      source_record_required: true,
      status: "get_event_timeline_scaffold",
      supported_event_types: [
        "announcement",
        "corporate_action",
        "financial_disclosure",
        "market_event"
      ]
    });
  });
});
