import { describe, expect, it } from "vitest";
import {
  QuoteSnapshotInputError,
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
