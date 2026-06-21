import { describe, expect, it } from "vitest";
import {
  PriceHistoryInputError,
  QuoteSnapshotInputError,
  getPriceHistory,
  getPriceHistoryCapabilities,
  getQuoteSnapshot,
  getQuoteSnapshotCapabilities
} from "./index";

describe("quote snapshot scaffold", () => {
  it("returns delayed quote snapshot with price, volume, and delay metadata", () => {
    const result = getQuoteSnapshot({
      instrumentId: "eq_hk_00700"
    });

    expect(result.status).toBe("found");
    expect(result.toolName).toBe("get_quote_snapshot");
    expect(result.liveDataAccess).toBe(false);
    expect(result.quote).toMatchObject({
      currency: "HKD",
      delay: {
        minutes: 15,
        type: "delayed"
      },
      instrumentId: "eq_hk_00700",
      market: "HK",
      qualityState: "PASS",
      symbol: "00700.HK"
    });
    expect(result.quote?.fields).toMatchObject({
      lastPrice: 448.2,
      volume: 28600000
    });
    expect(result.usage.rows).toBe(1);
    expect(result.usage.credits).toBe(2);
  });

  it("supports requested quote field subsets and close mode", () => {
    const result = getQuoteSnapshot({
      fields: ["lastPrice", "volume"],
      instrumentId: "eq_hk_00700",
      mode: "close"
    });

    expect(result.status).toBe("found");
    expect(result.mode).toBe("close");
    expect(result.quote?.delay).toEqual({
      minutes: 0,
      type: "close"
    });
    expect(result.quote?.marketStatus).toBe("closed");
    expect(Object.keys(result.quote?.fields ?? {})).toEqual(["lastPrice", "volume"]);
    expect(result.usage.credits).toBe(1);
  });

  it("returns data_not_licensed for unsupported quote fields", () => {
    const result = getQuoteSnapshot({
      fields: ["lastPrice", "realTimeBidAsk"],
      instrumentId: "eq_hk_00700"
    });

    expect(result.status).toBe("data_not_licensed");
    expect(result.quote).toBeUndefined();
    expect(result.rejectedFields).toEqual(["realTimeBidAsk"]);
    expect(result.usage.rows).toBe(0);
  });

  it("returns data_quality_hold for held quote fixtures", () => {
    const result = getQuoteSnapshot({
      instrumentId: "eq_hk_08001"
    });

    expect(result.status).toBe("data_quality_hold");
    expect(result.quote).toBeUndefined();
    expect(result.usage.credits).toBe(0);
  });

  it("returns not_found and point_in_time_unavailable states", () => {
    expect(getQuoteSnapshot({ instrumentId: "eq_hk_missing" }).status).toBe("not_found");
    expect(
      getQuoteSnapshot({
        asOf: "2026-01-06T16:15:00+08:00",
        instrumentId: "eq_hk_00700"
      }).status
    ).toBe("point_in_time_unavailable");
    expect(
      getQuoteSnapshot({
        instrumentId: "eq_hk_00001",
        mode: "delayed"
      }).status
    ).toBe("point_in_time_unavailable");
  });

  it("requires a non-empty instrument id", () => {
    expect(() => getQuoteSnapshot({ instrumentId: "  " })).toThrow(
      QuoteSnapshotInputError
    );
  });

  it("reports no-live quote snapshot capabilities", () => {
    expect(getQuoteSnapshotCapabilities()).toMatchObject({
      delay_metadata: true,
      handler_ready: true,
      live_data_access: false,
      status: "get_quote_snapshot_scaffold",
      supported_modes: ["delayed", "close"]
    });
  });
});

describe("price history scaffold", () => {
  it("returns synthetic OHLCV and return history with adjustment metadata", () => {
    const result = getPriceHistory({
      adjustment: "total_return_adjusted",
      from: "2026-01-02",
      instrumentId: "eq_hk_00700",
      to: "2026-01-07"
    });

    expect(result.status).toBe("found");
    expect(result.toolName).toBe("get_price_history");
    expect(result.liveDataAccess).toBe(false);
    expect(result.adjustment).toBe("total_return_adjusted");
    expect(result.history).toMatchObject({
      adjustment: "total_return_adjusted",
      adjustmentMethodology: {
        dividendReinvestment: true,
        priceBasis: "close_to_close"
      },
      currency: "HKD",
      instrumentId: "eq_hk_00700",
      market: "HK",
      qualityState: "PASS",
      rowCount: 3,
      symbol: "00700.HK",
      totalRows: 4
    });
    expect(result.history?.rows[0]).toMatchObject({
      date: "2026-01-02",
      fields: {
        close: 438.6,
        return: 0,
        volume: 23200000
      }
    });
    expect(result.history?.nextCursor).toBe("offset:3");
    expect(result.usage.rows).toBe(3);
    expect(result.usage.credits).toBe(6);
  });

  it("supports field subsets and deterministic cursor pagination", () => {
    const firstPage = getPriceHistory({
      fields: ["close", "volume"],
      from: "2026-01-02",
      instrumentId: "eq_hk_00700",
      limit: 2,
      to: "2026-01-07"
    });
    const secondPage = getPriceHistory({
      cursor: firstPage.history?.nextCursor,
      fields: ["close", "volume"],
      from: "2026-01-02",
      instrumentId: "eq_hk_00700",
      limit: 2,
      to: "2026-01-07"
    });

    expect(firstPage.status).toBe("found");
    expect(firstPage.history?.rows.map((row) => row.date)).toEqual([
      "2026-01-02",
      "2026-01-05"
    ]);
    expect(firstPage.history?.rows.map((row) => Object.keys(row.fields))).toEqual([
      ["close", "volume"],
      ["close", "volume"]
    ]);
    expect(firstPage.history?.nextCursor).toBe("offset:2");
    expect(secondPage.history?.rows.map((row) => row.date)).toEqual([
      "2026-01-06",
      "2026-01-07"
    ]);
    expect(secondPage.history?.nextCursor).toBeUndefined();
  });

  it("returns data_not_licensed for unsupported fields and adjustments", () => {
    const unsupportedField = getPriceHistory({
      fields: ["close", "realTimeBidAsk"],
      from: "2026-01-02",
      instrumentId: "eq_hk_00700",
      to: "2026-01-07"
    });
    const unsupportedAdjustment = getPriceHistory({
      adjustment: "vendor_factor",
      from: "2026-01-02",
      instrumentId: "eq_hk_00700",
      to: "2026-01-07"
    });

    expect(unsupportedField.status).toBe("data_not_licensed");
    expect(unsupportedField.rejectedFields).toEqual(["realTimeBidAsk"]);
    expect(unsupportedField.history).toBeUndefined();
    expect(unsupportedAdjustment.status).toBe("data_not_licensed");
    expect(unsupportedAdjustment.rejectedAdjustment).toBe("vendor_factor");
  });

  it("returns quality, range, missing, and row-limit states", () => {
    expect(
      getPriceHistory({
        from: "2026-01-07",
        instrumentId: "eq_hk_08001",
        to: "2026-01-07"
      }).status
    ).toBe("data_quality_hold");
    expect(
      getPriceHistory({
        from: "2025-12-31",
        instrumentId: "eq_hk_00700",
        to: "2026-01-01"
      }).status
    ).toBe("out_of_range");
    expect(
      getPriceHistory({
        from: "2026-01-02",
        instrumentId: "eq_hk_missing",
        to: "2026-01-07"
      }).status
    ).toBe("not_found");
    expect(
      getPriceHistory({
        from: "2026-01-02",
        instrumentId: "eq_hk_00700",
        limit: 4,
        to: "2026-01-07"
      }).status
    ).toBe("too_many_rows");
  });

  it("requires valid price history inputs", () => {
    expect(() =>
      getPriceHistory({
        from: "2026-01-02",
        instrumentId: "  ",
        to: "2026-01-07"
      })
    ).toThrow(PriceHistoryInputError);
    expect(() =>
      getPriceHistory({
        from: "2026-01-07",
        instrumentId: "eq_hk_00700",
        to: "2026-01-02"
      })
    ).toThrow(PriceHistoryInputError);
    expect(() =>
      getPriceHistory({
        cursor: "bad-cursor",
        from: "2026-01-02",
        instrumentId: "eq_hk_00700",
        to: "2026-01-07"
      })
    ).toThrow(PriceHistoryInputError);
  });

  it("reports no-live price history capabilities", () => {
    expect(getPriceHistoryCapabilities()).toMatchObject({
      adjustment_methodology: true,
      cursor_pagination: true,
      handler_ready: true,
      live_data_access: false,
      max_rows_per_request: 3,
      status: "get_price_history_scaffold",
      supported_adjustments: ["raw", "split_adjusted", "total_return_adjusted"]
    });
  });
});
