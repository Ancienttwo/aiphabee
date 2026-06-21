import { describe, expect, it } from "vitest";
import {
  CorporateActionAdjustmentError,
  CorporateActionsInputError,
  adjustPriceSeries,
  getCorporateActions,
  getCorporateActionAdjustmentCapabilities,
  getCorporateActionsCapabilities,
  runSyntheticCorporateActionGolden
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
