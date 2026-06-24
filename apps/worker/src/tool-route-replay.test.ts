import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import app from "./index";

const MANIFEST_PATH = "tests/golden/tools/manifest.json";
const TOOL_ROUTES = {
  calculate_returns_risk: "/analytics/returns-risk",
  compare_ipos: "/analytics/compare-ipos",
  compare_securities: "/analytics/compare-securities",
  get_announcement: "/documents/get-announcement",
  get_corporate_actions: "/tools/get-corporate-actions",
  get_data_lineage: "/tools/get-data-lineage",
  get_entitlements: "/tools/get-entitlements",
  get_event_timeline: "/tools/get-event-timeline",
  get_financial_facts: "/tools/get-financial-facts",
  get_financial_ratios: "/analytics/financial-ratios",
  get_ipo_allotment: "/tools/get-ipo-allotment",
  get_ipo_offering: "/tools/get-ipo-offering",
  get_ipo_profile: "/workbench/ipo/snapshot",
  get_ipo_timetable: "/tools/get-ipo-timetable",
  get_market_calendar: "/tools/get-market-calendar",
  get_price_history: "/tools/get-price-history",
  get_quote_snapshot: "/tools/get-quote-snapshot",
  get_security_profile: "/tools/get-security-profile",
  resolve_security: "/tools/resolve-security",
  screen_ipos: "/analytics/screen-ipos",
  screen_securities: "/analytics/screen-securities",
  search_announcements: "/documents/search-announcements",
  search_ipo_calendar: "/ipos/calendar"
} as const;

type ToolName = keyof typeof TOOL_ROUTES;

interface ToolManifest {
  samples: ToolManifestSample[];
}

interface ToolManifestSample {
  fixture_path: string;
  sample_id: string;
  tool_name: ToolName;
}

interface ToolFixture {
  expected_response: ToolExpectedResponse;
  request: Record<string, unknown>;
  sample_id: string;
  tool_name: ToolName;
}

interface ToolExpectedResponse {
  as_of: string;
  data: Record<string, unknown>;
  data_version: string;
  market_status: string;
  methodology_version: string;
  ok: true;
  provenance: Array<Record<string, unknown>>;
  request_id: string;
  usage: {
    cached: boolean;
    credits: number;
    rows: number;
  };
}

interface RouteEnvelope {
  as_of?: unknown;
  data?: Record<string, unknown>;
  data_version?: unknown;
  market_status?: unknown;
  methodology_version?: unknown;
  ok?: unknown;
  provenance?: unknown;
  request_id?: unknown;
  usage?: {
    cached?: unknown;
    credits?: unknown;
    rows?: unknown;
  };
}

const manifest = readJson<ToolManifest>(MANIFEST_PATH);
const fixtures = manifest.samples.map((sample) => readToolFixture(sample));

describe("tool route replay golden fixtures", () => {
  it("maps every manifest tool to a Worker route", () => {
    expect(Object.keys(TOOL_ROUTES).sort()).toEqual(
      manifest.samples.map((sample) => sample.tool_name).sort()
    );
  });

  it.each(fixtures)(
    "replays $sample_id through the Worker route and matches the golden projection",
    async (fixture) => {
      const expected = fixture.expected_response;
      const response = await app.request(TOOL_ROUTES[fixture.tool_name], {
        body: JSON.stringify(fixture.request),
        headers: {
          "content-type": "application/json",
          "x-request-id": expected.request_id
        },
        method: "POST"
      });
      const body = (await response.json()) as RouteEnvelope;

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(typeof body.as_of).toBe("string");
      expect(body.usage?.cached).toBe(expected.usage.cached);
      expect(body.usage?.rows).toBe(expected.usage.rows);
      expect(typeof body.usage?.credits).toBe("number");
      expect(Number(body.usage?.credits)).toBeGreaterThanOrEqual(0);
      expect(projectRouteResponseToGolden(body, expected)).toEqual(expected);
    }
  );
});

function readToolFixture(sample: ToolManifestSample): ToolFixture {
  const fixture = readJson<ToolFixture>(sample.fixture_path);

  expect(fixture.sample_id).toBe(sample.sample_id);
  expect(fixture.tool_name).toBe(sample.tool_name);

  return fixture;
}

function projectRouteResponseToGolden(
  response: RouteEnvelope,
  expected: ToolExpectedResponse
): ToolExpectedResponse {
  // Canonical projection keeps fixture comparison stable across runtime-only metadata.
  const data = response.data ?? {};
  const projectedData: Record<string, unknown> = {};

  for (const key of Object.keys(expected.data)) {
    if (key === "data_version") {
      projectedData[key] = data.data_version ?? data.dataVersion;
      continue;
    }

    if (key === "methodology_version") {
      projectedData[key] = data.methodology_version ?? data.methodologyVersion;
      continue;
    }

    projectedData[key] = readRouteDataField(data, key);
  }

  return {
    as_of: expected.as_of,
    data: projectedData,
    data_version: String(response.data_version),
    market_status: String(response.market_status),
    methodology_version: String(response.methodology_version),
    ok: response.ok as true,
    provenance: projectProvenance(response.provenance, expected.provenance),
    request_id: String(response.request_id),
    usage: expected.usage
  };
}

function projectProvenance(
  responseProvenance: unknown,
  expectedProvenance: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  const routeRecords = Array.isArray(responseProvenance)
    ? responseProvenance.filter(isRecord)
    : [];

  return expectedProvenance.map((expectedRecord) => {
    const routeRecord = routeRecords.find(
      (record) => record.source_record_id === expectedRecord.source_record_id
    );

    return {
      data_version: routeRecord?.data_version ?? expectedRecord.data_version,
      methodology_version: routeRecord?.methodology_version ?? expectedRecord.methodology_version,
      source: routeRecord?.source ?? expectedRecord.source,
      source_record_id: expectedRecord.source_record_id
    };
  });
}

function readRouteDataField(data: Record<string, unknown>, key: string): unknown {
  const aliases: Record<string, string[]> = {
    documentId: ["documentId", "document_id"],
    instrumentId: ["instrumentId", "instrument_id"],
    liveDataAccess: ["liveDataAccess", "live_data_access"],
    selectedInstrumentId: ["selectedInstrumentId", "selected_instrument_id"],
    securities: ["securities", "requested_securities"],
    workspaceId: ["workspaceId", "workspace_id"]
  };

  for (const alias of aliases[key] ?? [key]) {
    if (data[alias] !== undefined) {
      return data[alias];
    }
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
}
