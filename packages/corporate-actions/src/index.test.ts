import { describe, expect, it } from "vitest";
import {
  CorporateActionAdjustmentError,
  adjustPriceSeries,
  getCorporateActionAdjustmentCapabilities,
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
