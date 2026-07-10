import { beforeEach, describe, expect, it, vi } from "vitest";

const pgState = vi.hoisted(() => ({
  candidateRows: [] as Record<string, unknown>[],
  connectCount: 0,
  constructorCount: 0,
  endCount: 0,
  failQuery: false,
  queries: [] as Array<{ text: string; values: unknown[] }>,
  snapshotRows: [] as Record<string, unknown>[]
}));

vi.mock("pg", () => ({
  Client: class MockPgClient {
    constructor() {
      pgState.constructorCount += 1;
    }

    async connect() {
      pgState.connectCount += 1;
    }

    async end() {
      pgState.endCount += 1;
    }

    async query(text: string, values: unknown[] = []) {
      pgState.queries.push({ text, values });
      const normalizedText = text.toLowerCase();

      if (pgState.failQuery) {
        throw new Error("forced database read failure");
      }

      if (normalizedText.includes("from aiphabee_core.serving_dataset dataset")) {
        return {
          rowCount: pgState.snapshotRows.length,
          rows: pgState.snapshotRows
        };
      }

      if (normalizedText.includes("from aiphabee_core.serving_record record")) {
        return {
          rowCount: pgState.candidateRows.length,
          rows: pgState.candidateRows
        };
      }

      throw new Error(`unhandled security Serving query: ${text}`);
    }
  }
}));

const { default: app } = await import("./index");

const route = "/tools/resolve-security/live-smoke";
const smokeToken = "unit-token";
const authorizedHeaders = {
  authorization: `Bearer ${smokeToken}`,
  "content-type": "application/json",
  "x-aiphabee-smoke": "netquity-security-resolution-v1"
};
const liveEnv = {
  APP_ENV: "staging",
  AIPHABEE_HYPERDRIVE: {
    connectionString: "unit-test-connection"
  },
  AIPHABEE_NETQUITY_SECURITY_RESOLUTION_SMOKE_TOKEN: smokeToken
};

describe("guarded Netquity security-resolution staging route", () => {
  beforeEach(() => {
    pgState.candidateRows = [];
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.endCount = 0;
    pgState.failQuery = false;
    pgState.queries = [];
    pgState.snapshotRows = [createSnapshotRow()];
  });

  it("rejects authorization before reading the Hyperdrive binding", async () => {
    let hyperdriveReads = 0;
    const env = {
      APP_ENV: "staging",
      AIPHABEE_NETQUITY_SECURITY_RESOLUTION_SMOKE_TOKEN: smokeToken,
      get AIPHABEE_HYPERDRIVE() {
        hyperdriveReads += 1;
        throw new Error("Hyperdrive binding must not be read");
      }
    };
    const response = await app.request(
      route,
      {
        body: JSON.stringify({ query: "00001.HK" }),
        headers: {
          ...authorizedHeaders,
          authorization: "Bearer invalid"
        },
        method: "POST"
      },
      env
    );

    expect(response.status).toBe(403);
    expect(hyperdriveReads).toBe(0);
    expect(pgState.constructorCount).toBe(0);
  });

  it("rejects an oversized bearer before hashing can amplify work or touch Hyperdrive", async () => {
    let hyperdriveReads = 0;
    const response = await app.request(
      route,
      {
        body: JSON.stringify({ query: "00001.HK" }),
        headers: {
          ...authorizedHeaders,
          authorization: `Bearer ${"x".repeat(513)}`
        },
        method: "POST"
      },
      {
        APP_ENV: "staging",
        AIPHABEE_NETQUITY_SECURITY_RESOLUTION_SMOKE_TOKEN: smokeToken,
        get AIPHABEE_HYPERDRIVE() {
          hyperdriveReads += 1;
          throw new Error("Hyperdrive binding must not be read");
        }
      }
    );

    expect(response.status).toBe(403);
    expect(hyperdriveReads).toBe(0);
    expect(pgState.constructorCount).toBe(0);
  });

  it("rejects an oversized query before touching Hyperdrive", async () => {
    let hyperdriveReads = 0;
    const response = await requestLive(
      { query: "x".repeat(513) },
      {
        APP_ENV: "staging",
        AIPHABEE_NETQUITY_SECURITY_RESOLUTION_SMOKE_TOKEN: smokeToken,
        get AIPHABEE_HYPERDRIVE() {
          hyperdriveReads += 1;
          throw new Error("Hyperdrive binding must not be read");
        }
      }
    );

    expect(response.status).toBe(400);
    expect(hyperdriveReads).toBe(0);
    expect(pgState.constructorCount).toBe(0);
  });

  it("keeps the smoke route unavailable outside staging before binding access", async () => {
    let hyperdriveReads = 0;
    const response = await requestLive(
      { query: "00001.HK" },
      {
        APP_ENV: "prod",
        AIPHABEE_NETQUITY_SECURITY_RESOLUTION_SMOKE_TOKEN: smokeToken,
        get AIPHABEE_HYPERDRIVE() {
          hyperdriveReads += 1;
          throw new Error("production must not read the staging binding");
        }
      }
    );

    expect(response.status).toBe(404);
    expect(hyperdriveReads).toBe(0);
    expect(pgState.constructorCount).toBe(0);
  });

  it("returns 424 for a missing runtime binding after authorization", async () => {
    const response = await requestLive(
      { query: "00001.HK" },
      {
        APP_ENV: "staging",
        AIPHABEE_NETQUITY_SECURITY_RESOLUTION_SMOKE_TOKEN: smokeToken
      }
    );

    expect(response.status).toBe(424);
    expect(pgState.constructorCount).toBe(0);
  });

  it("returns 409 and never falls back to synthetic records when no release exists", async () => {
    pgState.snapshotRows = [];
    const response = await requestLive({ query: "700" });
    const body = (await response.json()) as {
      error: { code: string };
      ok: false;
    };

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("DATA_QUALITY_HOLD");
    expect(pgState.queries).toHaveLength(1);
  });

  it.each([
    ["00001.HK", "canonical_symbol"],
    ["Alpha Holdings Limited", "name"],
    ["阿爾法控股有限公司", "name"],
    ["阿尔法控股有限公司", "name"]
  ])("resolves exact released alias %s with live provenance", async (query, reason) => {
    pgState.candidateRows = [createCandidateRow({ query, reason })];
    const response = await requestLive({ query });
    const body = (await response.json()) as {
      data: {
        candidates: Array<{ matchReason: string }>;
        dataVersion: string;
        liveDataAccess: boolean;
        selectedInstrumentId: string;
      };
      ok: true;
      provenance: Array<{ source: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      dataVersion: "netquity-basicdata-test.v1",
      liveDataAccess: true,
      selectedInstrumentId: "hkex_security_00001"
    });
    expect(body.data.candidates[0]?.matchReason).toBe(reason);
    expect(body.provenance).toEqual([
      expect.objectContaining({ source: "netquity-basicdata" })
    ]);
    expect(pgState.queries[1]?.values[1]).toBe(query.toLocaleLowerCase("en-US"));
  });

  it("returns 404 when the released snapshot has no exact alias", async () => {
    const response = await requestLive({ query: "missing" });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("rejects 26 exact candidates rather than truncating", async () => {
    pgState.candidateRows = Array.from({ length: 26 }, (_, index) =>
      createCandidateRow({
        code: String(index + 1).padStart(5, "0"),
        query: "shared",
        reason: "name"
      })
    );
    const response = await requestLive({ query: "shared" });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("TOO_MANY_ROWS");
  });

  it("returns 502 for a database failure", async () => {
    pgState.failQuery = true;
    const response = await requestLive({ query: "00001.HK" });

    expect(response.status).toBe(502);
    expect(pgState.endCount).toBe(1);
  });

  it("returns 502 for malformed released-row authority", async () => {
    pgState.candidateRows = [
      {
        ...createCandidateRow({ query: "00001.HK", reason: "canonical_symbol" }),
        data_version: "wrong-version"
      }
    ];
    const response = await requestLive({ query: "00001.HK" });

    expect(response.status).toBe(502);
  });
});

async function requestLive(
  body: Record<string, unknown>,
  env: Record<string, unknown> = liveEnv
): Promise<Response> {
  return app.request(
    route,
    {
      body: JSON.stringify(body),
      headers: authorizedHeaders,
      method: "POST"
    },
    env
  );
}

function createSnapshotRow(): Record<string, unknown> {
  return {
    as_of: "2026-07-10T16:00:00.000Z",
    data_version: "netquity-basicdata-test.v1",
    serving_snapshot_id: "serving-netquity-basicdata-test-v1"
  };
}

function createCandidateRow(input: {
  code?: string;
  query: string;
  reason: string;
}): Record<string, unknown> {
  const code = input.code ?? "00001";
  const normalizedQuery = input.query.toLocaleLowerCase("en-US");

  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: `hkex_security_${code}`,
    match_reason: input.reason,
    payload: {
      aliases: [{ reason: input.reason, value: normalizedQuery }],
      code,
      currency: "HKD",
      exchange: "HKEX",
      listingStatus: "listed",
      market: "HK",
      name: {
        en: "Alpha Holdings Limited",
        zhHans: "阿尔法控股有限公司",
        zhHant: "阿爾法控股有限公司"
      },
      symbol: `${code}.HK`
    },
    source_record_id: `netquity:basicdata.stock:${code}`
  };
}
