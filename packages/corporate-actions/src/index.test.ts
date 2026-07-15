import { describe, expect, it } from "vitest";
import {
  CorporateActionAdjustmentError,
  CorporateActionsInputError,
  GetLiveCorporateActionsReadbackError,
  adjustPriceSeries,
  getCorporateActions,
  getCorporateActionAdjustmentCapabilities,
  getCorporateActionBenchmarkParityCapabilities,
  getCorporateActionsCapabilities,
  getLiveCorporateActions,
  runCorporateActionBenchmarkParityGate,
  runSyntheticCorporateActionGolden,
  type LiveCorporateActionsRow
} from "./index";

describe("corporate action adjustment engine", () => {
  it("backward-adjusts pre-split prices and leaves ex-date bars raw", () => {
    const result = adjustPriceSeries({
      actions: [
        {
          actionId: "split_001",
          actionType: "split",
          effectiveDate: "2016-05-09",
          ratio: 2,
          sourceRecordId: "src_split_001"
        }
      ],
      bars: [
        {
          close: 24,
          date: "2016-05-06",
          sourceRecordId: "bar_before_split"
        },
        {
          close: 12.25,
          date: "2016-05-09",
          sourceRecordId: "bar_on_split"
        }
      ],
      instrumentId: "eq_01234"
    });

    expect(result.status).toBe("pass");
    expect(result.factors).toEqual([
      {
        actionId: "split_001",
        adjustmentType: "split_adjusted",
        appliesTo: "bars_before_effective_date",
        effectiveDate: "2016-05-09",
        factor: 0.5,
        sourceRecordId: "src_split_001"
      }
    ]);
    expect(result.observations[0]).toMatchObject({
      date: "2016-05-06",
      rawClose: 24,
      splitAdjustedClose: 12,
      totalReturnAdjustedClose: 12
    });
    expect(result.observations[1]).toMatchObject({
      date: "2016-05-09",
      rawClose: 12.25,
      splitAdjustedClose: 12.25,
      totalReturnAdjustedClose: 12.25
    });
  });

  it("handles consolidation and cash dividend total-return factors", () => {
    const result = adjustPriceSeries({
      actions: [
        {
          actionId: "consolidation_001",
          actionType: "consolidation",
          effectiveDate: "2017-03-13",
          ratio: 0.5,
          sourceRecordId: "src_consolidation_001"
        },
        {
          actionId: "dividend_001",
          actionType: "dividend",
          cashAmount: 5,
          effectiveDate: "2018-08-31",
          reinvestmentPrice: 100,
          sourceRecordId: "src_dividend_001"
        }
      ],
      bars: [
        {
          close: 10,
          date: "2017-03-10",
          sourceRecordId: "bar_before_consolidation"
        },
        {
          close: 100,
          date: "2018-08-30",
          sourceRecordId: "bar_before_dividend"
        }
      ],
      instrumentId: "eq_00005"
    });

    expect(result.observations[0]).toMatchObject({
      date: "2017-03-10",
      splitAdjustedClose: 20,
      totalReturnAdjustedClose: 19
    });
    expect(result.observations[1]).toMatchObject({
      date: "2018-08-30",
      splitAdjustedClose: 100,
      totalReturnAdjustedClose: 95
    });
  });

  it("passes synthetic golden cases exposed to runtime capability", () => {
    const golden = runSyntheticCorporateActionGolden();
    const capabilities = getCorporateActionAdjustmentCapabilities();

    expect(golden.passed).toBe(true);
    expect(golden.sampleCount).toBe(3);
    expect(golden.failures).toEqual([]);
    expect(capabilities).toMatchObject({
      direction: "backward_adjusted",
      golden_cases: {
        passed: true,
        sample_count: 3
      },
      live_partner_data: false,
      status: "engine_scaffold",
      supported_action_types: ["split", "consolidation", "dividend"],
      supported_adjustment_types: [
        "raw",
        "split_adjusted",
        "total_return_adjusted"
      ]
    });
  });

  it("passes partner/public benchmark parity cases for the adjustment engine", () => {
    const report = runCorporateActionBenchmarkParityGate();
    const capability = getCorporateActionBenchmarkParityCapabilities();

    expect(report.status).toBe("passed");
    expect(report.passed).toBe(true);
    expect(report.sampleCount).toBe(20);
    expect(report.passedCount).toBe(20);
    expect(report.failures).toEqual([]);
    expect(report.sourceCounts).toEqual({
      partner_reference: 10,
      public_exchange_reference: 10
    });
    expect(report.caseResults[14]).toMatchObject({
      actual: {
        date: "2020-01-31",
        splitAdjustedClose: 30,
        totalReturnAdjustedClose: 29.008333
      },
      caseId: "split_two_dividends_partner",
      status: "pass"
    });
    expect(report.livePartnerData).toBe(false);
    expect(report.liveServingReads).toBe(false);
    expect(report.sqlEmitted).toBe(false);
    expect(capability).toMatchObject({
      benchmark_fixture_version: "corporate-action-benchmark-parity@partner-public-v0",
      live_partner_data: false,
      live_serving_reads: false,
      minimum_complex_cases: 20,
      partner_reference_cases: 10,
      public_reference_cases: 10,
      sample_count: 20,
      status: "benchmark_parity_scaffold"
    });
  });

  it("rejects malformed action factors before producing adjusted output", () => {
    expect(() =>
      adjustPriceSeries({
        actions: [
          {
            actionId: "bad_split",
            actionType: "split",
            effectiveDate: "2020-01-02",
            ratio: 0,
            sourceRecordId: "src_bad_split"
          }
        ],
        bars: [
          {
            close: 10,
            date: "2020-01-01",
            sourceRecordId: "bar_before_bad_split"
          }
        ],
        instrumentId: "eq_bad"
      })
    ).toThrow(CorporateActionAdjustmentError);
  });
});

describe("corporate actions tool scaffold", () => {
  it("returns synthetic corporate action timeline rows with adjustment impact metadata", () => {
    const result = getCorporateActions({
      from: "2026-01-03",
      instrumentId: "eq_hk_00700",
      to: "2026-01-07"
    });

    expect(result.status).toBe("found");
    expect(result.toolName).toBe("get_corporate_actions");
    expect(result.liveDataAccess).toBe(false);
    expect(result.timeline).toMatchObject({
      currency: "HKD",
      instrumentId: "eq_hk_00700",
      market: "HK",
      qualityState: "PASS",
      rowCount: 3,
      symbol: "00700.HK",
      totalRows: 4
    });
    expect(result.timeline?.actions[0]).toMatchObject({
      actionType: "dividend",
      adjustmentImpact: {
        affectsSplitAdjusted: false,
        affectsTotalReturnAdjusted: true
      },
      effectiveDate: "2026-01-07",
      terms: {
        cashAmount: 1,
        currency: "HKD"
      }
    });
    expect(result.timeline?.nextCursor).toBe("offset:3");
    expect(result.usage.rows).toBe(3);
    expect(result.usage.credits).toBe(6);
  });

  it("supports type subsets and deterministic cursor pagination", () => {
    const firstPage = getCorporateActions({
      from: "2026-01-03",
      instrumentId: "eq_hk_00700",
      limit: 2,
      to: "2026-01-07",
      types: ["dividend", "buyback", "split", "placement"]
    });
    const secondPage = getCorporateActions({
      cursor: firstPage.timeline?.nextCursor,
      from: "2026-01-03",
      instrumentId: "eq_hk_00700",
      limit: 2,
      to: "2026-01-07",
      types: ["dividend", "buyback", "split", "placement"]
    });
    const subset = getCorporateActions({
      from: "2026-01-03",
      instrumentId: "eq_hk_00700",
      to: "2026-01-07",
      types: ["buyback"]
    });

    expect(firstPage.timeline?.actions.map((action) => action.actionType)).toEqual([
      "dividend",
      "buyback"
    ]);
    expect(firstPage.timeline?.nextCursor).toBe("offset:2");
    expect(secondPage.timeline?.actions.map((action) => action.actionType)).toEqual([
      "split",
      "placement"
    ]);
    expect(secondPage.timeline?.nextCursor).toBeUndefined();
    expect(subset.timeline?.actions.map((action) => action.actionType)).toEqual(["buyback"]);
  });

  it("returns data_not_licensed for unsupported corporate action types", () => {
    const result = getCorporateActions({
      from: "2026-01-03",
      instrumentId: "eq_hk_00700",
      to: "2026-01-07",
      types: ["dividend", "spin_off"]
    });

    expect(result.status).toBe("data_not_licensed");
    expect(result.rejectedTypes).toEqual(["spin_off"]);
    expect(result.timeline).toBeUndefined();
    expect(result.usage.rows).toBe(0);
  });

  it("returns quality, range, missing, and row-limit states", () => {
    expect(
      getCorporateActions({
        from: "2026-01-07",
        instrumentId: "eq_hk_08001",
        to: "2026-01-07"
      }).status
    ).toBe("data_quality_hold");
    expect(
      getCorporateActions({
        from: "2025-12-01",
        instrumentId: "eq_hk_00700",
        to: "2025-12-31"
      }).status
    ).toBe("out_of_range");
    expect(
      getCorporateActions({
        from: "2026-01-03",
        instrumentId: "eq_hk_missing",
        to: "2026-01-07"
      }).status
    ).toBe("not_found");
    expect(
      getCorporateActions({
        from: "2026-01-03",
        instrumentId: "eq_hk_00700",
        limit: 4,
        to: "2026-01-07"
      }).status
    ).toBe("too_many_rows");
  });

  it("requires valid corporate action inputs", () => {
    expect(() =>
      getCorporateActions({
        from: "2026-01-03",
        instrumentId: "  ",
        to: "2026-01-07"
      })
    ).toThrow(CorporateActionsInputError);
    expect(() =>
      getCorporateActions({
        from: "2026-01-07",
        instrumentId: "eq_hk_00700",
        to: "2026-01-03"
      })
    ).toThrow(CorporateActionsInputError);
    expect(() =>
      getCorporateActions({
        cursor: "bad-cursor",
        from: "2026-01-03",
        instrumentId: "eq_hk_00700",
        to: "2026-01-07"
      })
    ).toThrow(CorporateActionsInputError);
  });

  it("reports no-live corporate actions capabilities", () => {
    expect(getCorporateActionsCapabilities()).toMatchObject({
      adjustment_impact_metadata: true,
      cursor_pagination: true,
      handler_ready: true,
      live_data_access: false,
      max_rows_per_request: 3,
      status: "get_corporate_actions_scaffold",
      supported_action_types: [
        "dividend",
        "split",
        "consolidation",
        "rights",
        "placement",
        "buyback"
      ]
    });
  });
});

describe("live corporate actions resolver", () => {
  it("maps an available-coverage row into typed, per-type actions", () => {
    const result = getLiveCorporateActions(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-corporate-actions-test.v1",
        instrumentId: "hkex_security_00697"
      },
      [createLiveCorporateActionsRow()]
    );

    expect(result.status).toBe("found");
    expect(result.toolName).toBe("get_corporate_actions");
    expect(result.liveDataAccess).toBe(true);
    expect(result.coverage).toEqual({ status: "available" });
    expect(result.actions).toHaveLength(3);
    expect(result.actions?.[0]).toEqual({
      actionId: "corp_action_dividend_00697_918273_cd",
      actionType: "dividend",
      announcementDate: "2026-05-27",
      effectiveDate: "2026-06-11",
      exDate: "2026-06-11",
      instrumentId: "hkex_security_00697",
      paymentDate: "2026-07-02",
      sourceRecordId: "netquity:dividendinfo.dividendinfo:00697:918273:cd",
      summary: "Cash Dividend: HKD 0.05",
      terms: { cashAmount: 0.05, currency: "HKD" }
    });
    expect(result.actions?.[1]).toMatchObject({
      actionType: "buyback",
      summary: undefined,
      terms: { buybackValue: 1262874, currency: "HKD", shares: 5052000 }
    });
    expect(result.actions?.[2]).toMatchObject({ actionType: "split", terms: undefined });
    expect(result.provenance).toEqual([
      expect.objectContaining({
        source: "netquity-corporate-actions",
        source_record_id: "netquity:dividendinfo.dividendinfo:00697:918273:cd"
      }),
      expect.objectContaining({
        source: "netquity-corporate-actions",
        source_record_id: "netquity:sharebuyback.daily_data:00697:2026-06-29"
      }),
      expect.objectContaining({
        source: "netquity-corporate-actions",
        source_record_id: "netquity:corpact.stocksplit:00697:2026-05-27"
      })
    ]);
    expect(result.usage.rows).toBe(3);
  });

  it("returns not_found without throwing when no row matches", () => {
    const result = getLiveCorporateActions(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-corporate-actions-test.v1",
        instrumentId: "hkex_security_00697"
      },
      []
    );

    expect(result.status).toBe("not_found");
    expect(result.actions).toBeUndefined();
    expect(result.coverage).toBeUndefined();
    expect(result.provenance).toEqual([]);
    expect(result.usage.rows).toBe(0);
    expect(result.liveDataAccess).toBe(true);
  });

  it("requires a non-empty instrument id", () => {
    expect(() =>
      getLiveCorporateActions(
        { asOf: "2026-07-15T00:00:00+08:00", dataVersion: "netquity-corporate-actions-test.v1", instrumentId: "  " },
        []
      )
    ).toThrow(CorporateActionsInputError);
  });

  it("rejects more than one row for the same instrument id rather than picking one", () => {
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [createLiveCorporateActionsRow(), createLiveCorporateActionsRow()]
      )
    ).toThrow(GetLiveCorporateActionsReadbackError);
  });

  it("rejects a row that disagrees with snapshot authority", () => {
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...createLiveCorporateActionsRow(), data_version: "other-version" }]
      )
    ).toThrowError("row data version does not match the released snapshot");
  });

  it("rejects an entity id that is not an opaque HKEX security id", () => {
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "eq_hk_00697"
        },
        [{ ...createLiveCorporateActionsRow(), entity_id: "eq_hk_00697" }]
      )
    ).toThrowError("entity id is not an opaque HKEX security id");
  });

  it("rejects a row for a different instrument id than requested", () => {
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [createLiveCorporateActionsRow()]
      )
    ).toThrowError("entity id does not match the requested instrument id");
  });

  it("rejects a source record id that does not match the entity id", () => {
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...createLiveCorporateActionsRow(), source_record_id: "netquity:corporate_actions.available:00001" }]
      )
    ).toThrow(GetLiveCorporateActionsReadbackError);
  });

  it("rejects a malformed payload", () => {
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...createLiveCorporateActionsRow(), payload: null }]
      )
    ).toThrow(GetLiveCorporateActionsReadbackError);
  });

  it("rejects a malformed coverage status", () => {
    const row = createLiveCorporateActionsRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unknown" } };
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("coverage status is malformed");
  });

  it("rejects payload actions that are not an array", () => {
    const row = createLiveCorporateActionsRow();
    const payload = { ...(row.payload as Record<string, unknown>), actions: {} };
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("payload actions is malformed");
  });

  it("rejects available coverage with zero actions", () => {
    const row = createLiveCorporateActionsRow();
    const payload = { ...(row.payload as Record<string, unknown>), actions: [] };
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("available coverage must carry at least one action");
  });

  it("rejects an action type that is not a promoted live type", () => {
    const row = createLiveCorporateActionsRow();
    const payload = row.payload as Record<string, unknown>;
    const actions = (payload.actions as Array<Record<string, unknown>>).map((action, index) =>
      index === 0 ? { ...action, actionType: "rights" } : action
    );
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...row, payload: { ...payload, actions } }]
      )
    ).toThrowError("action actionType is malformed or not a promoted live action type");
  });

  it("rejects an actionId that does not match its actionType", () => {
    const row = createLiveCorporateActionsRow();
    const payload = row.payload as Record<string, unknown>;
    const actions = (payload.actions as Array<Record<string, unknown>>).map((action, index) =>
      index === 0 ? { ...action, actionId: "corp_action_buyback_00697_918273_cd" } : action
    );
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...row, payload: { ...payload, actions } }]
      )
    ).toThrowError("action actionId does not match its actionType");
  });

  it("rejects a dividend action missing terms.cashAmount", () => {
    const row = createLiveCorporateActionsRow();
    const payload = row.payload as Record<string, unknown>;
    const actions = (payload.actions as Array<Record<string, unknown>>).map((action, index) =>
      index === 0 ? { ...action, terms: { currency: "HKD" } } : action
    );
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...row, payload: { ...payload, actions } }]
      )
    ).toThrowError("dividend action terms.cashAmount is malformed");
  });

  it("rejects a dividend action whose terms carry buyback fields", () => {
    const row = createLiveCorporateActionsRow();
    const payload = row.payload as Record<string, unknown>;
    const actions = (payload.actions as Array<Record<string, unknown>>).map((action, index) =>
      index === 0 ? { ...action, terms: { cashAmount: 0.05, currency: "HKD", shares: 100 } } : action
    );
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...row, payload: { ...payload, actions } }]
      )
    ).toThrowError("dividend action terms must not carry buyback fields");
  });

  it("rejects a buyback action carrying a fabricated summary", () => {
    const row = createLiveCorporateActionsRow();
    const payload = row.payload as Record<string, unknown>;
    const actions = (payload.actions as Array<Record<string, unknown>>).map((action, index) =>
      index === 1 ? { ...action, summary: "On-market buyback" } : action
    );
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...row, payload: { ...payload, actions } }]
      )
    ).toThrowError("buyback action must not carry a fabricated summary");
  });

  it("rejects a split action carrying terms", () => {
    const row = createLiveCorporateActionsRow();
    const payload = row.payload as Record<string, unknown>;
    const actions = (payload.actions as Array<Record<string, unknown>>).map((action, index) =>
      index === 2 ? { ...action, terms: { cashAmount: 1 } } : action
    );
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...row, payload: { ...payload, actions } }]
      )
    ).toThrowError("split action must not carry terms");
  });

  it("rejects an action sourceRecordId that does not match its actionType's field pointer", () => {
    const row = createLiveCorporateActionsRow();
    const payload = row.payload as Record<string, unknown>;
    const actions = (payload.actions as Array<Record<string, unknown>>).map((action, index) =>
      index === 0 ? { ...action, sourceRecordId: "netquity:sharebuyback.daily_data:00697:2026-06-29" } : action
    );
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...row, payload: { ...payload, actions } }]
      )
    ).toThrowError("action sourceRecordId is not a matching Netquity corporate-actions field pointer");
  });

  it("maps a zero-event unavailable-coverage row with no fabricated actions", () => {
    const result = getLiveCorporateActions(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-corporate-actions-test.v1",
        instrumentId: "hkex_security_00007"
      },
      [createUnavailableCorporateActionsRow()]
    );

    expect(result.status).toBe("found");
    expect(result.coverage).toEqual({
      reason:
        "no dividend, buyback, split, or consolidation event found in nq_dividendinfo/nq_sharebuyback/nq_corpact for this instrument in the current mirrored snapshot",
      status: "unavailable"
    });
    expect(result.actions).toEqual([]);
    expect(result.provenance).toEqual([
      expect.objectContaining({ source_record_id: "netquity:corporate_actions.unavailable:00007" })
    ]);
    expect(result.usage.rows).toBe(0);
  });

  it("rejects unavailable coverage that still carries action rows", () => {
    const row = createUnavailableCorporateActionsRow();
    const payload = {
      ...(row.payload as Record<string, unknown>),
      actions: (createLiveCorporateActionsRow().payload as Record<string, unknown>).actions
    };
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00007"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage must not carry action rows");
  });

  it("rejects unavailable coverage without a reason", () => {
    const row = createUnavailableCorporateActionsRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unavailable" } };
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00007"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage requires a reason");
  });

  it("rejects available coverage backed by the corporate_actions-unavailable source record id", () => {
    const row = createLiveCorporateActionsRow();
    expect(() =>
      getLiveCorporateActions(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-corporate-actions-test.v1",
          instrumentId: "hkex_security_00697"
        },
        [{ ...row, source_record_id: "netquity:corporate_actions.unavailable:00697" }]
      )
    ).toThrowError("available coverage must use the corporate_actions-available source record id");
  });
});

function createLiveCorporateActionsRow(): LiveCorporateActionsRow {
  return {
    data_version: "netquity-corporate-actions-test.v1",
    entity_id: "hkex_security_00697",
    payload: {
      actions: [
        {
          actionId: "corp_action_dividend_00697_918273_cd",
          actionType: "dividend",
          announcementDate: "2026-05-27",
          effectiveDate: "2026-06-11",
          exDate: "2026-06-11",
          paymentDate: "2026-07-02",
          sourceRecordId: "netquity:dividendinfo.dividendinfo:00697:918273:cd",
          summary: "Cash Dividend: HKD 0.05",
          terms: { cashAmount: 0.05, currency: "HKD" }
        },
        {
          actionId: "corp_action_buyback_00697_20260629",
          actionType: "buyback",
          announcementDate: "2026-06-29",
          effectiveDate: "2026-06-29",
          sourceRecordId: "netquity:sharebuyback.daily_data:00697:2026-06-29",
          terms: { buybackValue: 1262874, currency: "HKD", shares: 5052000 }
        },
        {
          actionId: "corp_action_split_00697_20260527",
          actionType: "split",
          announcementDate: "2026-05-27",
          effectiveDate: "2026-07-10",
          exDate: "2026-07-10",
          sourceRecordId: "netquity:corpact.stocksplit:00697:2026-05-27",
          summary: "Share Split: 8 - for - 1"
        }
      ],
      coverage: { status: "available" }
    },
    source_record_id: "netquity:corporate_actions.available:00697"
  };
}

function createUnavailableCorporateActionsRow(): LiveCorporateActionsRow {
  return {
    data_version: "netquity-corporate-actions-test.v1",
    entity_id: "hkex_security_00007",
    payload: {
      actions: [],
      coverage: {
        reason:
          "no dividend, buyback, split, or consolidation event found in nq_dividendinfo/nq_sharebuyback/nq_corpact for this instrument in the current mirrored snapshot",
        status: "unavailable"
      }
    },
    source_record_id: "netquity:corporate_actions.unavailable:00007"
  };
}
