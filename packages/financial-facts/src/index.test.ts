import { describe, expect, it } from "vitest";
import {
  FinancialRestatementError,
  buildFinancialRestatementTimeline,
  getFinancialRestatementCapabilities,
  runSyntheticFinancialRestatementGolden,
  selectFinancialStatementAsOf
} from "./index";

describe("financial restatement engine", () => {
  it("preserves original and restated versions without overwriting history", () => {
    const timeline = buildFinancialRestatementTimeline([
      {
        accountingStandard: "HKFRS",
        companyId: "co_00001",
        currency: "HKD",
        facts: {
          assets: 1000,
          equity: 380,
          liabilities: 620
        },
        periodEnd: "2022-12-31",
        publishedAt: "2023-03-15T08:00:00Z",
        scale: 1_000_000,
        sourceRecordId: "src_hk_financial_restatement_pass_001",
        statementId: "financial_stmt_00001_2022_original",
        unit: "million"
      },
      {
        accountingStandard: "HKFRS",
        companyId: "co_00001",
        currency: "HKD",
        facts: {
          assets: 1000,
          equity: 400,
          liabilities: 600
        },
        isRestatement: true,
        periodEnd: "2022-12-31",
        priorVersionId: "financial_stmt_00001_2022_original",
        publishedAt: "2023-08-01T08:00:00Z",
        restatementReason: "partner correction to liability classification",
        scale: 1_000_000,
        sourceRecordId: "src_hk_financial_restatement_pass_001",
        statementId: "financial_stmt_00001_2022_restatement_1",
        unit: "million"
      }
    ]);

    expect(timeline.versions).toHaveLength(2);
    expect(timeline.versions[0]).toMatchObject({
      isLatest: false,
      restatementVersion: 0,
      statementId: "financial_stmt_00001_2022_original"
    });
    expect(timeline.versions[1]).toMatchObject({
      isLatest: true,
      isRestatement: true,
      restatementVersion: 1,
      statementId: "financial_stmt_00001_2022_restatement_1"
    });
    expect(timeline.events[0]).toMatchObject({
      originalStatementId: "financial_stmt_00001_2022_original",
      reason: "partner correction to liability classification",
      restatedStatementId: "financial_stmt_00001_2022_restatement_1"
    });
    expect(timeline.events[0]?.deltas).toEqual([
      {
        metricId: "equity",
        originalValue: 380,
        restatedValue: 400,
        unit: "million",
        valueDelta: 20
      },
      {
        metricId: "liabilities",
        originalValue: 620,
        restatedValue: 600,
        unit: "million",
        valueDelta: -20
      }
    ]);
  });

  it("selects point-in-time visible statements by publication timestamp", () => {
    const timeline = buildFinancialRestatementTimeline(
      runSyntheticFinancialRestatementGoldenFixture()
    );

    expect(
      selectFinancialStatementAsOf(timeline, "2023-07-31T23:59:59Z")?.statementId
    ).toBe("financial_stmt_00001_2022_original");
    expect(
      selectFinancialStatementAsOf(timeline, "2023-08-02T00:00:00Z")?.statementId
    ).toBe("financial_stmt_00001_2022_restatement_1");
  });

  it("passes synthetic golden cases exposed to runtime capability", () => {
    const golden = runSyntheticFinancialRestatementGolden();
    const capabilities = getFinancialRestatementCapabilities();

    expect(golden.passed).toBe(true);
    expect(golden.sampleCount).toBe(2);
    expect(golden.failures).toEqual([]);
    expect(capabilities).toMatchObject({
      golden_cases: {
        passed: true,
        sample_count: 2
      },
      live_partner_data: false,
      point_in_time_selection: true,
      preserve_prior_versions: true,
      status: "engine_scaffold",
      supported_statement_types: ["balance_sheet"]
    });
  });

  it("rejects identity-breaking balance sheets before timeline output", () => {
    expect(() =>
      buildFinancialRestatementTimeline([
        {
          accountingStandard: "HKFRS",
          companyId: "co_bad",
          currency: "HKD",
          facts: {
            assets: 2500,
            equity: 650,
            liabilities: 1700
          },
          periodEnd: "2023-12-31",
          publishedAt: "2024-03-20T08:00:00Z",
          scale: 1_000_000,
          sourceRecordId: "src_hk_financial_identity_hold_001",
          statementId: "financial_stmt_00016_2023_bad_identity",
          unit: "million"
        }
      ])
    ).toThrow(FinancialRestatementError);
  });
});

function runSyntheticFinancialRestatementGoldenFixture() {
  return [
    {
      accountingStandard: "HKFRS",
      companyId: "co_00001",
      currency: "HKD",
      facts: {
        assets: 1000,
        equity: 380,
        liabilities: 620
      },
      periodEnd: "2022-12-31",
      publishedAt: "2023-03-15T08:00:00Z",
      scale: 1_000_000,
      sourceRecordId: "src_hk_financial_restatement_pass_001",
      statementId: "financial_stmt_00001_2022_original",
      unit: "million"
    },
    {
      accountingStandard: "HKFRS",
      companyId: "co_00001",
      currency: "HKD",
      facts: {
        assets: 1000,
        equity: 400,
        liabilities: 600
      },
      isRestatement: true,
      periodEnd: "2022-12-31",
      priorVersionId: "financial_stmt_00001_2022_original",
      publishedAt: "2023-08-01T08:00:00Z",
      restatementReason: "partner correction to liability classification",
      scale: 1_000_000,
      sourceRecordId: "src_hk_financial_restatement_pass_001",
      statementId: "financial_stmt_00001_2022_restatement_1",
      unit: "million"
    }
  ];
}
