import { beforeEach, describe, expect, it, vi } from "vitest";

const SMOKE_TOKEN = "hk-ipo-public-held-db-smoke-token-000000";
const SMOKE_ROUTE = "/ingest/hk-ipo-public/held-db-apply-smoke";

const pgMock = vi.hoisted(() => {
  const clients = [] as Array<{
    connect: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
    queries: Array<{ text: string; values?: unknown[] }>;
    query: ReturnType<typeof vi.fn>;
  }>;
  const configs = [] as Array<{ connectionString?: string }>;
  const Client = vi.fn().mockImplementation(function MockPgClient(
    config: { connectionString?: string }
  ) {
    const queries: Array<{ text: string; values?: unknown[] }> = [];
    const client = {
      connect: vi.fn(async () => undefined),
      end: vi.fn(async () => undefined),
      queries,
      query: vi.fn(async (text: string, values?: unknown[]) => {
        queries.push({ text, values });
        const normalized = text.trim().replace(/\s+/gu, " ").toLowerCase();

        if (normalized === "begin" || normalized === "commit" || normalized === "rollback") {
          return { rowCount: null, rows: [] };
        }

        if (
          normalized.startsWith("insert into core.raw_source_batch") ||
          normalized.startsWith("insert into core.data_version_batch") ||
          normalized.startsWith("insert into core.raw_snapshot") ||
          normalized.startsWith("insert into core.hk_ipo_public_source_run") ||
          normalized.startsWith("insert into core.hk_ipo_public_observation") ||
          normalized.startsWith("insert into core.hk_ipo_public_reconciliation_row") ||
          normalized.startsWith("insert into core.hk_ipo_public_supplement_candidate")
        ) {
          return { rowCount: 1, rows: [] };
        }

        if (
          normalized.startsWith(
            "select (select count(*)::int from core.raw_source_batch"
          )
        ) {
          return {
            rowCount: 1,
            rows: [
              {
                data_version_batch_count: 1,
                observation_count: 1,
                raw_snapshot_count: 1,
                raw_source_batch_count: 1,
                reconciliation_row_count: 1,
                source_run_count: 1,
                supplement_candidate_count: 1
              }
            ]
          };
        }

        if (
          normalized.startsWith("delete from core.hk_ipo_public_supplement_candidate") ||
          normalized.startsWith("delete from core.hk_ipo_public_reconciliation_row") ||
          normalized.startsWith("delete from core.hk_ipo_public_observation") ||
          normalized.startsWith("delete from core.hk_ipo_public_source_run") ||
          normalized.startsWith("delete from core.raw_snapshot") ||
          normalized.startsWith("delete from core.data_version_batch") ||
          normalized.startsWith("delete from core.raw_source_batch")
        ) {
          return { rowCount: 1, rows: [] };
        }

        throw new Error(`unexpected pg query: ${normalized}`);
      })
    };

    clients.push(client);
    configs.push(config);

    return client;
  });

  return { Client, clients, configs };
});

vi.mock("pg", () => ({
  Client: pgMock.Client
}));

import app from "./index";

interface HeldDbApplySmokeBody {
  held_db_apply_result?: {
    binding_name?: string;
    cleanup_verified?: boolean;
    data_version_hash?: string;
    deleted_rows?: number;
    failure_code?: string;
    inserted_rows?: number;
    operation_count?: number;
    production_promotion_enabled?: boolean;
    raw_snapshot_id_hash?: string;
    readback_hash?: string;
    selected_rows?: number;
    source_run_id_hash?: string;
    status?: string;
    surface?: string;
    tables?: string[];
    writes_serving_tables?: boolean;
  };
  missing_bindings?: string[];
  missing_env?: string[];
  request_id?: string;
  required_authorization?: string;
  required_header?: string;
  response_hash?: string;
  route?: string;
  status?: string;
  version?: string;
}

describe("HK IPO public held DB apply smoke", () => {
  beforeEach(() => {
    pgMock.clients.length = 0;
    pgMock.configs.length = 0;
    pgMock.Client.mockClear();
  });

  it("rejects the route without the smoke header", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-request-id": "req-hk-ipo-held-db-header-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as HeldDbApplySmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-hk-ipo-held-db-header-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /ingest/hk-ipo-public/held-db-apply-smoke",
      status: "forbidden"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("reports missing smoke token before opening Hyperdrive", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-aiphabee-smoke": "hk-ipo-public-held-db-apply-v1",
        "x-request-id": "req-hk-ipo-held-db-missing-token"
      },
      method: "POST"
    });
    const body = (await response.json()) as HeldDbApplySmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("missing_env");
    expect(body.missing_env).toEqual(["AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN"]);
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("requires the smoke token before opening Hyperdrive", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          "x-aiphabee-smoke": "hk-ipo-public-held-db-apply-v1",
          "x-request-id": "req-hk-ipo-held-db-auth-denied"
        },
        method: "POST"
      },
      {
        AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as HeldDbApplySmokeBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_authorization: "Bearer AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN",
      route: "POST /ingest/hk-ipo-public/held-db-apply-smoke",
      status: "forbidden"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("reports missing Hyperdrive binding after auth passes", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "hk-ipo-public-held-db-apply-v1",
          "x-request-id": "req-hk-ipo-held-db-missing-binding"
        },
        method: "POST"
      },
      {
        AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as HeldDbApplySmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_HYPERDRIVE"]);
    expect(body.held_db_apply_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      failure_code: "missing_hyperdrive_binding",
      production_promotion_enabled: false,
      status: "missing_binding",
      surface: "hk_ipo_public_held_rows_insert_select_delete",
      writes_serving_tables: false
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("writes, reads, and deletes synthetic HK IPO held rows through Hyperdrive", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "hk-ipo-public-held-db-apply-v1",
          "x-request-id": "req-hk-ipo-held-db-ok"
        },
        method: "POST"
      },
      {
        AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN: SMOKE_TOKEN,
        AIPHABEE_HYPERDRIVE: {
          connectionString: "mock-hk-ipo-held-db-connection"
        }
      }
    );
    const body = (await response.json()) as HeldDbApplySmokeBody;
    const serialized = JSON.stringify(body);
    const client = pgMock.clients[0]!;
    const normalizedQueries = client.queries.map((query) =>
      query.text.trim().replace(/\s+/gu, " ").toLowerCase()
    );
    const sourceRunInsert = client.queries.find((query) =>
      query.text.includes("insert into core.hk_ipo_public_source_run")
    );
    const rawSnapshotInsert = client.queries.find((query) =>
      query.text.includes("insert into core.raw_snapshot")
    );
    const observationInsert = client.queries.find((query) =>
      query.text.includes("insert into core.hk_ipo_public_observation")
    );
    const rawSourceBatchId = String(client.queries[1]?.values?.[0]);
    const rawSourceRecordId = String(rawSnapshotInsert?.values?.[2]);
    const rawSourceRunId = String(sourceRunInsert?.values?.[0]);
    const rawObservationId = String(observationInsert?.values?.[0]);

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.missing_bindings).toEqual([]);
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(body.held_db_apply_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      cleanup_verified: true,
      deleted_rows: 7,
      inserted_rows: 7,
      operation_count: 17,
      production_promotion_enabled: false,
      selected_rows: 7,
      status: "passed",
      surface: "hk_ipo_public_held_rows_insert_select_delete",
      writes_serving_tables: false
    });
    expect(body.held_db_apply_result?.data_version_hash).toMatch(/^sha256:/u);
    expect(body.held_db_apply_result?.raw_snapshot_id_hash).toMatch(/^sha256:/u);
    expect(body.held_db_apply_result?.readback_hash).toMatch(/^sha256:/u);
    expect(body.held_db_apply_result?.source_run_id_hash).toMatch(/^sha256:/u);
    expect(body.held_db_apply_result?.tables).toEqual([
      "core.raw_source_batch",
      "core.data_version_batch",
      "core.raw_snapshot",
      "core.hk_ipo_public_source_run",
      "core.hk_ipo_public_observation",
      "core.hk_ipo_public_reconciliation_row",
      "core.hk_ipo_public_supplement_candidate"
    ]);
    expect(body.held_db_apply_result?.tables?.some((table) => table.startsWith("core.ipo_"))).toBe(
      false
    );
    expect(pgMock.configs[0]?.connectionString).toBe("mock-hk-ipo-held-db-connection");
    expect(client.end).toHaveBeenCalledOnce();
    expect(normalizedQueries[0]).toBe("begin");
    expect(normalizedQueries[1]).toContain("insert into core.raw_source_batch");
    expect(normalizedQueries[2]).toContain("insert into core.data_version_batch");
    expect(normalizedQueries[3]).toContain("insert into core.raw_snapshot");
    expect(normalizedQueries[4]).toContain("insert into core.hk_ipo_public_source_run");
    expect(normalizedQueries[5]).toContain("insert into core.hk_ipo_public_observation");
    expect(normalizedQueries[6]).toContain("insert into core.hk_ipo_public_reconciliation_row");
    expect(normalizedQueries[7]).toContain("insert into core.hk_ipo_public_supplement_candidate");
    expect(normalizedQueries[8]).toContain("select (select count(*)::int from core.raw_source_batch");
    expect(normalizedQueries[9]).toContain("delete from core.hk_ipo_public_supplement_candidate");
    expect(normalizedQueries[10]).toContain("delete from core.hk_ipo_public_reconciliation_row");
    expect(normalizedQueries[11]).toContain("delete from core.hk_ipo_public_observation");
    expect(normalizedQueries[12]).toContain("delete from core.hk_ipo_public_source_run");
    expect(normalizedQueries[13]).toContain("delete from core.raw_snapshot");
    expect(normalizedQueries[14]).toContain("delete from core.data_version_batch");
    expect(normalizedQueries[15]).toContain("delete from core.raw_source_batch");
    expect(normalizedQueries[16]).toBe("commit");
    expect(serialized).not.toContain(rawSourceBatchId);
    expect(serialized).not.toContain(rawSourceRecordId);
    expect(serialized).not.toContain(rawSourceRunId);
    expect(serialized).not.toContain(rawObservationId);
    expect(serialized).not.toContain("mock-hk-ipo-held-db-connection");
    expect(serialized).not.toContain("https://www.aastocks.com");
    expect(serialized).not.toContain("09999.HK");
  });
});
