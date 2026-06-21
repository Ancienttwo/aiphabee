import { describe, expect, it } from "vitest";
import {
  MarketCalendarInputError,
  getMarketCalendar,
  getMarketCalendarCapabilities
} from "./index";

describe("market calendar scaffold", () => {
  it("returns trading day and half-day sessions for a date range", () => {
    const result = getMarketCalendar({
      from: "2026-01-05",
      market: "HK",
      to: "2026-01-07"
    });

    expect(result.status).toBe("found");
    expect(result.toolName).toBe("get_market_calendar");
    expect(result.liveDataAccess).toBe(false);
    expect(result.timezone).toBe("Asia/Hong_Kong");
    expect(result.sessions.map((session) => session.sessionStatus)).toEqual([
      "trading_day",
      "trading_day",
      "half_day"
    ]);
    expect(result.sessions[2]).toMatchObject({
      closeAt: "2026-01-07T12:00:00+08:00",
      isTradingDay: true,
      openAt: "2026-01-07T09:30:00+08:00"
    });
    expect(result.usage.rows).toBe(3);
  });

  it("returns weather, holiday, and weekend closed sessions", () => {
    const result = getMarketCalendar({
      from: "2026-01-08",
      market: "hk",
      to: "2026-01-10"
    });

    expect(result.status).toBe("found");
    expect(result.sessions).toHaveLength(3);
    expect(result.sessions.map((session) => session.closureReason)).toEqual([
      "weather",
      "holiday",
      "weekend"
    ]);
    expect(result.sessions.every((session) => session.isTradingDay === false)).toBe(true);
  });

  it("returns not_found for unsupported markets", () => {
    const result = getMarketCalendar({
      from: "2026-01-05",
      market: "US",
      to: "2026-01-05"
    });

    expect(result.status).toBe("not_found");
    expect(result.sessions).toEqual([]);
    expect(result.usage.rows).toBe(0);
  });

  it("returns out_of_range for dates outside synthetic coverage", () => {
    const result = getMarketCalendar({
      from: "2026-01-04",
      market: "HK",
      to: "2026-01-05"
    });

    expect(result.status).toBe("out_of_range");
    expect(result.sessions).toEqual([]);
    expect(result.usage.rows).toBe(0);
  });

  it("requires market and valid date range", () => {
    expect(() =>
      getMarketCalendar({
        from: "2026-01-05",
        market: "  ",
        to: "2026-01-05"
      })
    ).toThrow(MarketCalendarInputError);
    expect(() =>
      getMarketCalendar({
        from: "2026-01-07",
        market: "HK",
        to: "2026-01-05"
      })
    ).toThrow(MarketCalendarInputError);
  });

  it("reports no-live market calendar capabilities", () => {
    expect(getMarketCalendarCapabilities()).toMatchObject({
      handler_ready: true,
      live_data_access: false,
      status: "get_market_calendar_scaffold",
      supported_markets: ["HK"],
      supported_session_statuses: ["trading_day", "half_day", "closed"],
      timezone: "Asia/Hong_Kong"
    });
  });
});
