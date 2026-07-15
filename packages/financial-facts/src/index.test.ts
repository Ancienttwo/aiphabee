import { describe, expect, it } from "vitest";
import {
  FinancialFactsInputError,
  FinancialRestatementError,
  GetLiveFinancialFactsReadbackError,
  buildFinancialRestatementTimeline,
  getFinancialFacts,
  getFinancialFactsCapabilities,
  getFinancialRestatementCapabilities,
  getLiveFinancialFacts,
  runSyntheticFinancialRestatementGolden,
  selectFinancialStatementAsOf,
  type LiveFinancialFactsRow
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

describe("financial facts tool scaffold", () => {
  it("returns standardized financial facts with currency, unit, and version metadata", () => {
    const result = getFinancialFacts({
      from: "2023-12-31",
      instrumentId: "eq_hk_00700",
      metrics: ["revenue", "net_income", "assets", "equity"],
      to: "2023-12-31"
    });

    expect(result.status).toBe("found");
    expect(result.toolName).toBe("get_financial_facts");
    expect(result.liveDataAccess).toBe(false);
    expect(result.facts).toMatchObject({
      accountingStandard: "HKFRS",
      currency: "HKD",
      instrumentId: "eq_hk_00700",
      qualityState: "PASS",
      rowCount: 4,
      symbol: "00700.HK",
      totalRows: 4,
      unit: "million"
    });
    expect(result.facts?.facts.map((fact) => fact.metricId)).toEqual([
      "assets",
      "equity",
      "net_income",
      "revenue"
    ]);
    expect(result.facts?.facts[0]).toMatchObject({
      periodEnd: "2023-12-31",
      restatementVersion: 1,
      scale: 1000000,
      versionStatus: "latest"
    });
    expect(result.usage.rows).toBe(4);
    expect(result.usage.credits).toBe(8);
  });

  it("supports statement type subsets and deterministic cursor pagination", () => {
    const firstPage = getFinancialFacts({
      from: "2023-12-31",
      instrumentId: "eq_hk_00700",
      limit: 2,
      statementTypes: ["balance_sheet"],
      to: "2023-12-31"
    });
    const secondPage = getFinancialFacts({
      cursor: firstPage.facts?.nextCursor,
      from: "2023-12-31",
      instrumentId: "eq_hk_00700",
      limit: 2,
      statementTypes: ["balance_sheet"],
      to: "2023-12-31"
    });

    expect(firstPage.facts?.facts.map((fact) => fact.metricId)).toEqual([
      "assets",
      "equity"
    ]);
    expect(firstPage.facts?.nextCursor).toBe("offset:2");
    expect(secondPage.facts?.facts.map((fact) => fact.metricId)).toEqual([
      "liabilities"
    ]);
    expect(secondPage.facts?.nextCursor).toBeUndefined();
  });

  it("returns data_not_licensed for unsupported metrics and statement types", () => {
    const unsupportedMetric = getFinancialFacts({
      from: "2023-12-31",
      instrumentId: "eq_hk_00700",
      metrics: ["revenue", "ev_to_ebitda"],
      to: "2023-12-31"
    });
    const unsupportedStatement = getFinancialFacts({
      from: "2023-12-31",
      instrumentId: "eq_hk_00700",
      statementTypes: ["segment_note"],
      to: "2023-12-31"
    });

    expect(unsupportedMetric.status).toBe("data_not_licensed");
    expect(unsupportedMetric.rejectedMetrics).toEqual(["ev_to_ebitda"]);
    expect(unsupportedMetric.facts).toBeUndefined();
    expect(unsupportedStatement.status).toBe("data_not_licensed");
    expect(unsupportedStatement.rejectedStatementTypes).toEqual(["segment_note"]);
  });

  it("returns quality, time, range, missing, and row-limit states", () => {
    expect(
      getFinancialFacts({
        from: "2023-12-31",
        instrumentId: "eq_hk_08001",
        to: "2023-12-31"
      }).status
    ).toBe("data_quality_hold");
    expect(
      getFinancialFacts({
        asOf: "2022-01-01T00:00:00Z",
        from: "2023-12-31",
        instrumentId: "eq_hk_00700",
        to: "2023-12-31"
      }).status
    ).toBe("point_in_time_unavailable");
    expect(
      getFinancialFacts({
        from: "2021-12-31",
        instrumentId: "eq_hk_00700",
        to: "2021-12-31"
      }).status
    ).toBe("out_of_range");
    expect(
      getFinancialFacts({
        from: "2023-12-31",
        instrumentId: "eq_hk_missing",
        to: "2023-12-31"
      }).status
    ).toBe("not_found");
    expect(
      getFinancialFacts({
        from: "2023-12-31",
        instrumentId: "eq_hk_00700",
        limit: 5,
        to: "2023-12-31"
      }).status
    ).toBe("too_many_rows");
  });

  it("requires valid financial fact inputs", () => {
    expect(() =>
      getFinancialFacts({
        from: "2023-12-31",
        instrumentId: "  ",
        to: "2023-12-31"
      })
    ).toThrow(FinancialFactsInputError);
    expect(() =>
      getFinancialFacts({
        from: "2023-12-31",
        instrumentId: "eq_hk_00700",
        to: "2022-12-31"
      })
    ).toThrow(FinancialFactsInputError);
    expect(() =>
      getFinancialFacts({
        asOf: "not-a-date",
        from: "2023-12-31",
        instrumentId: "eq_hk_00700",
        to: "2023-12-31"
      })
    ).toThrow(FinancialFactsInputError);
  });

  it("reports no-live financial facts capabilities", () => {
    expect(getFinancialFactsCapabilities()).toMatchObject({
      currency_unit_metadata: true,
      handler_ready: true,
      live_data_access: false,
      max_rows_per_request: 4,
      point_in_time_selection: true,
      restatement_versions: true,
      status: "get_financial_facts_scaffold",
      supported_statement_types: ["income_statement", "balance_sheet", "cash_flow"]
    });
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

describe("live financial facts resolver", () => {
  it("maps an available-coverage row into typed facts", () => {
    const result = getLiveFinancialFacts(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-financial-facts-test.v1",
        instrumentId: "hkex_security_00700"
      },
      [createLiveFinancialFactsRow()]
    );

    expect(result.status).toBe("found");
    expect(result.toolName).toBe("get_financial_facts");
    expect(result.liveDataAccess).toBe(true);
    expect(result.coverage).toEqual({ status: "available" });
    expect(result.facts).toHaveLength(2);
    expect(result.facts?.[0]).toEqual({
      currency: "RMB",
      instrumentId: "hkex_security_00700",
      metricId: "revenue",
      periodEnd: "2025-12-31",
      periodType: "FY",
      publishedAt: "2026-03-18T00:00:00+08:00",
      qualityState: "PASS",
      scale: 1,
      sourceRecordId: "netquity:finreport.pla_nb.totalturnover:00700:2025-12-31:F",
      statementId: "netquity:finreport.stmt:00700:2025-12-31:F",
      statementType: "income_statement",
      unit: "unit",
      value: 751766000000
    });
    expect(result.provenance).toEqual([
      expect.objectContaining({
        source: "netquity-finreport-nb",
        source_record_id: "netquity:finreport.pla_nb.totalturnover:00700:2025-12-31:F"
      }),
      expect.objectContaining({
        source: "netquity-finreport-nb",
        source_record_id: "netquity:finreport.pla_nb.net_prof:00700:2025-12-31:F"
      })
    ]);
    expect(result.usage.rows).toBe(2);
  });

  it("returns not_found without throwing when no row matches", () => {
    const result = getLiveFinancialFacts(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-financial-facts-test.v1",
        instrumentId: "hkex_security_00700"
      },
      []
    );

    expect(result.status).toBe("not_found");
    expect(result.facts).toBeUndefined();
    expect(result.coverage).toBeUndefined();
    expect(result.provenance).toEqual([]);
    expect(result.usage.rows).toBe(0);
    expect(result.liveDataAccess).toBe(true);
  });

  it("requires a non-empty instrument id", () => {
    expect(() =>
      getLiveFinancialFacts(
        { asOf: "2026-07-15T00:00:00+08:00", dataVersion: "netquity-financial-facts-test.v1", instrumentId: "  " },
        []
      )
    ).toThrow(FinancialFactsInputError);
  });

  it("rejects more than one row for the same instrument id rather than picking one", () => {
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [createLiveFinancialFactsRow(), createLiveFinancialFactsRow()]
      )
    ).toThrow(GetLiveFinancialFactsReadbackError);
  });

  it("rejects a row that disagrees with snapshot authority", () => {
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...createLiveFinancialFactsRow(), data_version: "other-version" }]
      )
    ).toThrowError("row data version does not match the released snapshot");
  });

  it("rejects an entity id that is not an opaque HKEX security id", () => {
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "eq_hk_00700"
        },
        [{ ...createLiveFinancialFactsRow(), entity_id: "eq_hk_00700" }]
      )
    ).toThrowError("entity id is not an opaque HKEX security id");
  });

  it("rejects a row for a different instrument id than requested", () => {
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [createLiveFinancialFactsRow()]
      )
    ).toThrowError("entity id does not match the requested instrument id");
  });

  it("rejects a source record id that does not match the entity id", () => {
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...createLiveFinancialFactsRow(), source_record_id: "netquity:finreport.nb:00001" }]
      )
    ).toThrow(GetLiveFinancialFactsReadbackError);
  });

  it("rejects a malformed payload", () => {
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...createLiveFinancialFactsRow(), payload: null }]
      )
    ).toThrow(GetLiveFinancialFactsReadbackError);
  });

  it("rejects a malformed coverage status", () => {
    const row = createLiveFinancialFactsRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unknown" } };
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("coverage status is malformed");
  });

  it("rejects payload facts that are not an array", () => {
    const row = createLiveFinancialFactsRow();
    const payload = { ...(row.payload as Record<string, unknown>), facts: {} };
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("payload facts is malformed");
  });

  it.each([
    "currency",
    "statementType",
    "periodEnd",
    "periodType",
    "value",
    "scale",
    "publishedAt",
    "qualityState",
    "statementId",
    "sourceRecordId"
  ] as const)("rejects a fact with a missing %s", (field) => {
    const row = createLiveFinancialFactsRow();
    const payload = row.payload as Record<string, unknown>;
    const facts = (payload.facts as Array<Record<string, unknown>>).map((fact, index) => {
      if (index !== 0) return fact;
      const clone = { ...fact };
      delete clone[field];
      return clone;
    });
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...row, payload: { ...payload, facts } }]
      )
    ).toThrow(GetLiveFinancialFactsReadbackError);
  });

  it("rejects a fact whose statementType disagrees with its metricId", () => {
    const row = createLiveFinancialFactsRow();
    const payload = row.payload as Record<string, unknown>;
    const facts = (payload.facts as Array<Record<string, unknown>>).map((fact, index) =>
      index === 0 ? { ...fact, statementType: "balance_sheet" } : fact
    );
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...row, payload: { ...payload, facts } }]
      )
    ).toThrowError("fact statementType does not match metricId");
  });

  it("rejects free_cash_flow even though it is a valid synthetic FinancialFactMetric", () => {
    const row = createLiveFinancialFactsRow();
    const payload = row.payload as Record<string, unknown>;
    const facts = (payload.facts as Array<Record<string, unknown>>).map((fact, index) =>
      index === 0 ? { ...fact, metricId: "free_cash_flow", statementType: "cash_flow" } : fact
    );
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...row, payload: { ...payload, facts } }]
      )
    ).toThrowError("fact metricId is malformed or not a promoted live metric");
  });

  it("maps a bank/insurance unavailable-coverage row with no fabricated facts", () => {
    const result = getLiveFinancialFacts(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-financial-facts-test.v1",
        instrumentId: "hkex_security_00005"
      },
      [createUnavailableFinancialFactsRow()]
    );

    expect(result.status).toBe("found");
    expect(result.coverage).toEqual({
      reason:
        "reports under the bank/insurance statement schema (pla_b/pla_i/bal_b/bal_i), which is not rights-pinned by this promotion",
      status: "unavailable"
    });
    expect(result.facts).toEqual([]);
    expect(result.provenance).toEqual([
      expect.objectContaining({ source_record_id: "netquity:finreport.bank_insurance_excluded:00005" })
    ]);
    expect(result.usage.rows).toBe(0);
  });

  it("rejects unavailable coverage that still carries fact rows", () => {
    const row = createUnavailableFinancialFactsRow();
    const payload = {
      ...(row.payload as Record<string, unknown>),
      facts: (createLiveFinancialFactsRow().payload as Record<string, unknown>).facts
    };
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00005"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage must not carry fact rows");
  });

  it("rejects unavailable coverage without a reason", () => {
    const row = createUnavailableFinancialFactsRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unavailable" } };
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00005"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage requires a reason");
  });

  it("rejects available coverage backed by the bank/insurance-excluded source record id", () => {
    const row = createLiveFinancialFactsRow();
    expect(() =>
      getLiveFinancialFacts(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-financial-facts-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [{ ...row, source_record_id: "netquity:finreport.bank_insurance_excluded:00700" }]
      )
    ).toThrowError("available coverage must use the nb source record id");
  });
});

function createLiveFinancialFactsRow(): LiveFinancialFactsRow {
  return {
    data_version: "netquity-financial-facts-test.v1",
    entity_id: "hkex_security_00700",
    payload: {
      coverage: { status: "available" },
      facts: [
        {
          currency: "RMB",
          metricId: "revenue",
          periodEnd: "2025-12-31",
          periodType: "FY",
          publishedAt: "2026-03-18T00:00:00+08:00",
          qualityState: "PASS",
          scale: 1,
          sourceRecordId: "netquity:finreport.pla_nb.totalturnover:00700:2025-12-31:F",
          statementId: "netquity:finreport.stmt:00700:2025-12-31:F",
          statementType: "income_statement",
          unit: "unit",
          value: 751766000000
        },
        {
          currency: "RMB",
          metricId: "net_income",
          periodEnd: "2025-12-31",
          periodType: "FY",
          publishedAt: "2026-03-18T00:00:00+08:00",
          qualityState: "PASS",
          scale: 1,
          sourceRecordId: "netquity:finreport.pla_nb.net_prof:00700:2025-12-31:F",
          statementId: "netquity:finreport.stmt:00700:2025-12-31:F",
          statementType: "income_statement",
          unit: "unit",
          value: 224842000000
        }
      ]
    },
    source_record_id: "netquity:finreport.nb:00700"
  };
}

function createUnavailableFinancialFactsRow(): LiveFinancialFactsRow {
  return {
    data_version: "netquity-financial-facts-test.v1",
    entity_id: "hkex_security_00005",
    payload: {
      coverage: {
        reason:
          "reports under the bank/insurance statement schema (pla_b/pla_i/bal_b/bal_i), which is not rights-pinned by this promotion",
        status: "unavailable"
      },
      facts: []
    },
    source_record_id: "netquity:finreport.bank_insurance_excluded:00005"
  };
}
