import { beforeEach, describe, expect, it, vi } from "vitest";

const pgState = vi.hoisted(() => ({
  cornerstones: [] as Record<string, unknown>[],
  dataVersions: [] as Record<string, unknown>[],
  narratives: [] as Record<string, unknown>[],
  offerings: [] as Record<string, unknown>[],
  queries: [] as Array<{ text: string; values: unknown[] }>,
  timetable: [] as Record<string, unknown>[]
}));

vi.mock("pg", () => ({
  Client: class MockPgClient {
    async connect() {
      return undefined;
    }

    async end() {
      return undefined;
    }

    async query(text: string, values: unknown[] = []) {
      pgState.queries.push({ text, values });

      if (text.includes("from core.data_version_batch batch")) {
        return {
          rowCount: pgState.dataVersions.length,
          rows: pgState.dataVersions
        };
      }

      if (text.includes("from core.ipo_offering offering")) {
        const requestedId = values[1];
        const requestedCode = values[2];
        const rows =
          typeof requestedId === "string" || typeof requestedCode === "string"
            ? pgState.offerings.filter(
                (row) =>
                  row.offering_id === requestedId ||
                  row.hkex_code === requestedCode ||
                  `${row.hkex_code}.HK`.toLowerCase() === String(values[3]).toLowerCase()
              )
            : pgState.offerings;

        return {
          rowCount: rows.length,
          rows: text.includes("limit 1") ? rows.slice(0, 1) : rows
        };
      }

      if (text.includes("from core.ipo_narrative")) {
        return {
          rowCount: pgState.narratives.length,
          rows: pgState.narratives
        };
      }

      if (text.includes("from core.ipo_timetable_event")) {
        return {
          rowCount: pgState.timetable.length,
          rows: pgState.timetable
        };
      }

      if (text.includes("from core.ipo_cornerstone")) {
        return {
          rowCount: pgState.cornerstones.length,
          rows: pgState.cornerstones
        };
      }

      throw new Error(`unhandled IPO Postgres query: ${text}`);
    }
  }
}));

const { default: app } = await import("./index");

const dbEnv = {
  AIPHABEE_HYPERDRIVE: {
    connectionString: "postgresql://unit-test"
  }
};

describe("IPO Postgres released read path", () => {
  beforeEach(() => {
    pgState.cornerstones = [];
    pgState.dataVersions = [];
    pgState.narratives = [];
    pgState.offerings = [];
    pgState.queries = [];
    pgState.timetable = [];
  });

  it("does not fall back to fixtures when Postgres has no released IPO data version", async () => {
    const response = await app.request(
      "/analytics/screen-ipos",
      {
        body: JSON.stringify({ has_cornerstone: true }),
        headers: {
          "content-type": "application/json",
          "x-request-id": "req-ipo-no-release"
        },
        method: "POST"
      },
      dbEnv
    );
    const body = (await response.json()) as {
      data: {
        dataVersion: string;
        liveDataAccess: boolean;
        status: string;
        totalRows: number;
      };
      ok: true;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      dataVersion: "ipo-no-released-data-version",
      liveDataAccess: true,
      status: "no_released_data",
      totalRows: 0
    });
    expect(pgState.queries[0]?.text).toContain("release_state = 'released'");
  });

  it("reads screen rows from latest released IPO serving tables", async () => {
    pgState.dataVersions = [{ data_version: "ipo-mdb-unit-released" }];
    pgState.offerings = [createOfferingRow()];

    const response = await app.request(
      "/analytics/screen-ipos",
      {
        body: JSON.stringify({ has_cornerstone: true, min_oversubscription: 20 }),
        headers: {
          "content-type": "application/json",
          "x-request-id": "req-ipo-released-screen"
        },
        method: "POST"
      },
      dbEnv
    );
    const body = (await response.json()) as {
      data: {
        dataVersion: string;
        liveDataAccess: boolean;
        rows: Array<{ hkexCode: string; id: string }>;
        status: string;
        totalRows: number;
      };
      ok: true;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      dataVersion: "ipo-mdb-unit-released",
      liveDataAccess: true,
      status: "released_serving",
      totalRows: 1
    });
    expect(body.data.rows[0]).toMatchObject({
      hkexCode: "2649",
      id: "2649|2026-03-09"
    });
  });

  it("reads snapshots from Postgres and keeps cornerstone amounts redacted by default", async () => {
    pgState.dataVersions = [{ data_version: "ipo-mdb-unit-released" }];
    pgState.offerings = [createOfferingRow()];
    pgState.narratives = [
      {
        content_html: "<p>Postgres narrative</p>",
        content_text: "Postgres narrative",
        lang: "zh_hant",
        section_key: "business_overview"
      }
    ];
    pgState.timetable = [
      {
        event_code: "ETDate00",
        event_date: "2026-02-27",
        event_type: "application_start",
        offering_id: "2649|2026-03-09",
        title_en: "Application starts",
        title_zh_hant: "開始招股"
      }
    ];
    pgState.cornerstones = [
      {
        invest_amount: "15000000",
        invest_currency_code: "USD",
        investor_name_en: "BlackRock, Inc.",
        investor_name_zh_hant: "BlackRock, Inc.",
        issued_share_pct: "0.7",
        lockup_period_text: "2026-10-28",
        offer_share_pct: "4.04"
      }
    ];

    const response = await app.request(
      "/workbench/ipo/snapshot",
      {
        body: JSON.stringify({ ipo_id: "2649" }),
        headers: {
          "content-type": "application/json",
          "x-request-id": "req-ipo-released-snapshot"
        },
        method: "POST"
      },
      dbEnv
    );
    const body = (await response.json()) as {
      data: {
        cornerstones: Array<{ amountText: null | string; redacted: boolean }>;
        dataVersion: string;
        liveDataAccess: boolean;
        offering: { hkexCode: string };
        provenance: Array<{ source: string }>;
        status: string;
      };
      ok: true;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      dataVersion: "ipo-mdb-unit-released",
      liveDataAccess: true,
      status: "released_serving"
    });
    expect(body.data.offering.hkexCode).toBe("2649");
    expect(body.data.cornerstones[0]).toMatchObject({
      amountText: null,
      redacted: true
    });
    expect(body.data.provenance.map((item) => item.source)).toContain(
      "postgres-ipo-serving"
    );
  });
});

function createOfferingRow() {
  return {
    board_lot: 500,
    business_overview_text: "Postgres serving business overview",
    clawback_type: "B",
    currency_code: "HKD",
    data_version: "ipo-mdb-unit-released",
    final_offer_price: "11",
    funds_raised_text_en: "HKD 223,696,000",
    funds_raised_text_zh_hans: "港元 223,696,000",
    funds_raised_text_zh_hant: "港元 223,696,000",
    has_cornerstone: true,
    hkex_code: "2649",
    ipo_status: "in_process",
    listing_board: "MAIN",
    listing_date: "2026-03-09",
    listing_type: "Normal",
    market_cap_text_en: "HKD 993,696,000",
    market_cap_text_zh_hans: "港元 993,696,000",
    market_cap_text_zh_hant: "港元 993,696,000",
    name_en: "Ule Shared",
    name_zh_hans: "优乐赛共享",
    name_zh_hant: "優樂賽共享",
    offer_price_max: "14",
    offer_price_min: "11",
    offering_id: "2649|2026-03-09",
    one_lot_success_rate: "0.04",
    over_subscription_multiple: "5297.23",
    quality_state: "HOLD",
    sector_code: "08",
    source_record_id: "2649|2026-03-09"
  };
}
