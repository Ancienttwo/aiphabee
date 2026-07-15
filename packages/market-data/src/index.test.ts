import { describe, expect, it } from "vitest";
import {
  GetLiveQuoteSnapshotReadbackError,
  PriceHistoryInputError,
  QuoteSnapshotInputError,
  getLiveQuoteSnapshot,
  getPriceHistory,
  getPriceHistoryCapabilities,
  getQuoteSnapshot,
  getQuoteSnapshotCapabilities,
  type LiveQuoteSnapshotRawRow
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

describe("live quote snapshot resolver", () => {
  it("maps an available-coverage row into a typed EOD quote", () => {
    const result = getLiveQuoteSnapshot(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-quote-snapshot-test.v1",
        instrumentId: "hkex_security_00700"
      },
      [createLiveQuoteSnapshotRow()]
    );

    expect(result.status).toBe("found");
    expect(result.toolName).toBe("get_quote_snapshot");
    expect(result.liveDataAccess).toBe(true);
    expect(result.coverage).toEqual({ status: "available" });
    expect(result.quote).toEqual({
      close: 461.2,
      currency: "HKD",
      high: 465,
      instrumentId: "hkex_security_00700",
      low: 458.4,
      open: 460,
      sharesOutstanding: 9092370719,
      tradeDate: "2026-07-07",
      turnover: 25937523114,
      volume: 55418434
    });
    expect(result.provenance).toEqual([
      expect.objectContaining({
        source: "netquity-unadjprice2-daily",
        source_record_id: "netquity:unadjprice2.daily:00700"
      })
    ]);
    expect(result.usage.rows).toBe(1);
  });

  it("omits independently-null fields rather than backfilling them", () => {
    const row = createLiveQuoteSnapshotRow();
    const payload = row.payload as Record<string, unknown>;
    const quote = payload.quote as Record<string, unknown>;
    delete quote.open;
    delete quote.high;
    delete quote.low;
    delete quote.volume;
    delete quote.turnover;
    delete quote.sharesOutstanding;

    const result = getLiveQuoteSnapshot(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-quote-snapshot-test.v1",
        instrumentId: "hkex_security_00700"
      },
      [row]
    );

    expect(result.quote).toEqual({
      close: 461.2,
      currency: "HKD",
      instrumentId: "hkex_security_00700",
      tradeDate: "2026-07-07"
    });
  });

  it("returns not_found without throwing when no row matches", () => {
    const result = getLiveQuoteSnapshot(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-quote-snapshot-test.v1",
        instrumentId: "hkex_security_00700"
      },
      []
    );

    expect(result.status).toBe("not_found");
    expect(result.quote).toBeUndefined();
    expect(result.coverage).toBeUndefined();
    expect(result.provenance).toEqual([]);
    expect(result.usage.rows).toBe(0);
    expect(result.liveDataAccess).toBe(true);
  });

  it("requires a non-empty instrument id", () => {
    expect(() =>
      getLiveQuoteSnapshot(
        { asOf: "2026-07-15T00:00:00+08:00", dataVersion: "netquity-quote-snapshot-test.v1", instrumentId: "  " },
        []
      )
    ).toThrow(QuoteSnapshotInputError);
  });

  it("rejects more than one row for the same instrument id rather than picking one", () => {
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [createLiveQuoteSnapshotRow(), createLiveQuoteSnapshotRow()]
      )
    ).toThrow(GetLiveQuoteSnapshotReadbackError);
  });

  it("rejects a row that disagrees with snapshot authority", () => {
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...createLiveQuoteSnapshotRow(), data_version: "other-version" }]
      )
    ).toThrowError("row data version does not match the released snapshot");
  });

  it("rejects an entity id that is not an opaque HKEX security id", () => {
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "eq_hk_00700"
        },
        [{ ...createLiveQuoteSnapshotRow(), entity_id: "eq_hk_00700" }]
      )
    ).toThrowError("entity id is not an opaque HKEX security id");
  });

  it("rejects a row for a different instrument id than requested", () => {
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [createLiveQuoteSnapshotRow()]
      )
    ).toThrowError("entity id does not match the requested instrument id");
  });

  it("rejects a source record id that does not match the entity id", () => {
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...createLiveQuoteSnapshotRow(), source_record_id: "netquity:unadjprice2.daily:00001" }]
      )
    ).toThrow(GetLiveQuoteSnapshotReadbackError);
  });

  it("rejects a malformed payload", () => {
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...createLiveQuoteSnapshotRow(), payload: null }]
      )
    ).toThrow(GetLiveQuoteSnapshotReadbackError);
  });

  it("rejects a malformed coverage status", () => {
    const row = createLiveQuoteSnapshotRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unknown" } };
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("coverage status is malformed");
  });

  it.each(["tradeDate", "currency"] as const)("rejects a quote with a missing %s", (field) => {
    const row = createLiveQuoteSnapshotRow();
    const payload = row.payload as Record<string, unknown>;
    const quote = { ...(payload.quote as Record<string, unknown>) };
    delete quote[field];
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...row, payload: { ...payload, quote } }]
      )
    ).toThrow(GetLiveQuoteSnapshotReadbackError);
  });

  it("rejects a non-numeric optional quote field rather than silently dropping it", () => {
    const row = createLiveQuoteSnapshotRow();
    const payload = row.payload as Record<string, unknown>;
    const quote = { ...(payload.quote as Record<string, unknown>), close: "461.2" };
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...row, payload: { ...payload, quote } }]
      )
    ).toThrowError("quote close is malformed");
  });

  it("maps a no-daily-row unavailable-coverage row with no fabricated quote", () => {
    const result = getLiveQuoteSnapshot(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-quote-snapshot-test.v1",
        instrumentId: "hkex_security_09999"
      },
      [createUnavailableQuoteSnapshotRow()]
    );

    expect(result.status).toBe("found");
    expect(result.coverage).toEqual({
      reason:
        "no EOD price row exists in nq_unadjprice2.daily for this instrument as of the mirrored snapshot date; nq_unadjprice2.daily does not encode a reason (delisting, an instrument type outside this price feed's coverage, or a vendor coverage gap are all possible and indistinguishable from this table alone)",
      status: "unavailable"
    });
    expect(result.quote).toBeUndefined();
    expect(result.provenance).toEqual([
      expect.objectContaining({ source_record_id: "netquity:unadjprice2.unavailable:09999" })
    ]);
    expect(result.usage.rows).toBe(0);
  });

  it("rejects unavailable coverage that still carries a quote object", () => {
    const row = createUnavailableQuoteSnapshotRow();
    const payload = {
      ...(row.payload as Record<string, unknown>),
      quote: (createLiveQuoteSnapshotRow().payload as Record<string, unknown>).quote
    };
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "hkex_security_09999"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage must not carry a quote object");
  });

  it("rejects unavailable coverage without a reason", () => {
    const row = createUnavailableQuoteSnapshotRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unavailable" } };
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "hkex_security_09999"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage requires a reason");
  });

  it("rejects available coverage backed by the unavailable source record id", () => {
    const row = createLiveQuoteSnapshotRow();
    expect(() =>
      getLiveQuoteSnapshot(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-quote-snapshot-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...row, source_record_id: "netquity:unadjprice2.unavailable:00700" }]
      )
    ).toThrowError("available coverage must use the unadjprice2-daily source record id");
  });
});

function createLiveQuoteSnapshotRow(): LiveQuoteSnapshotRawRow {
  return {
    data_version: "netquity-quote-snapshot-test.v1",
    entity_id: "hkex_security_00700",
    payload: {
      coverage: { status: "available" },
      quote: {
        close: 461.2,
        currency: "HKD",
        high: 465,
        low: 458.4,
        open: 460,
        sharesOutstanding: 9092370719,
        tradeDate: "2026-07-07",
        turnover: 25937523114,
        volume: 55418434
      }
    },
    source_record_id: "netquity:unadjprice2.daily:00700"
  };
}

function createUnavailableQuoteSnapshotRow(): LiveQuoteSnapshotRawRow {
  return {
    data_version: "netquity-quote-snapshot-test.v1",
    entity_id: "hkex_security_09999",
    payload: {
      coverage: {
        reason:
          "no EOD price row exists in nq_unadjprice2.daily for this instrument as of the mirrored snapshot date; nq_unadjprice2.daily does not encode a reason (delisting, an instrument type outside this price feed's coverage, or a vendor coverage gap are all possible and indistinguishable from this table alone)",
        status: "unavailable"
      }
    },
    source_record_id: "netquity:unadjprice2.unavailable:09999"
  };
}
