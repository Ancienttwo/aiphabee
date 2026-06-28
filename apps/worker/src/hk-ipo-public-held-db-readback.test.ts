import { beforeEach, describe, expect, it, vi } from "vitest";

const APPLY_TOKEN = "hk-ipo-public-held-db-apply-token-000000";
const READBACK_ROUTE = "/ingest/hk-ipo-public/held-db-readback";

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

        if (normalized.startsWith("select source_run_id, source_batch_id, data_version")) {
          return {
            rowCount: 1,
            rows: [
              {
                data_version: "dv_hk_ipo_public_aaaaaaaaaaaaaaaaaaaaaaaa",
                observation_count: 1,
                reconciliation_row_count: 1,
                security_count: 1,
                source_batch_id: "rsb_hk_ipo_public_aaaaaaaaaaaaaaaaaaaaaaaa",
                source_run_id: "sr_hk_ipo_public_aaaaaaaaaaaaaaaaaaaaaaaa",
                supplement_candidate_count: 1
              }
            ]
          };
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
                object_key_count: 1,
                observation_count: 1,
                payload_envelope_count: 1,
                raw_snapshot_count: 1,
                raw_snapshot_payload_leak_count: 0,
                raw_source_batch_count: 1,
                reconciliation_row_count: 1,
                source_run_count: 1,
                supplement_candidate_count: 1
              }
            ]
          };
        }

        if (normalized.startsWith("select distinct payload->>'object_key' as object_key")) {
          return {
            rowCount: 1,
            rows: [
              {
                object_key:
                  "hk-ipo-public/raw-snapshots/aastocks_ipo_plus/2026-06-28/hash.html"
              }
            ]
          };
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

interface HeldDbReadbackBody {
  error_hash?: string;
  held_db_readback_result?: {
    binding_name?: string;
    object_key_count?: number;
    object_store_missing_count?: number;
    object_store_readback_count?: number;
    payload_envelope_count?: number;
    production_promotion_enabled?: boolean;
    raw_snapshot_payload_leak_count?: number;
    release_state?: string;
    selected_rows?: number;
    status?: string;
    surface?: string;
    table_counts?: Record<string, number>;
    writes_serving_tables?: boolean;
  };
  required_header?: string;
  response_hash?: string;
  route?: string;
  status?: string;
}

describe("HK IPO public held DB readback", () => {
  beforeEach(() => {
    pgMock.clients.length = 0;
    pgMock.configs.length = 0;
    pgMock.Client.mockClear();
  });

  it("rejects missing route header before opening Hyperdrive", async () => {
    const response = await app.request(READBACK_ROUTE, {
      method: "POST"
    });
    const body = (await response.json()) as HeldDbReadbackBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_header: "x-aiphabee-smoke",
      route: "POST /ingest/hk-ipo-public/held-db-readback",
      status: "forbidden"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("rejects invalid specific payload before opening Hyperdrive", async () => {
    const response = await app.request(
      READBACK_ROUTE,
      {
        body: JSON.stringify({ mode: "specific", source_run_id: "bad" }),
        headers: {
          authorization: `Bearer ${APPLY_TOKEN}`,
          "content-type": "application/json",
          "x-aiphabee-smoke": "hk-ipo-public-held-db-readback-v1"
        },
        method: "POST"
      },
      {
        AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN: APPLY_TOKEN
      }
    );
    const body = (await response.json()) as HeldDbReadbackBody;

    expect(response.status).toBe(400);
    expect(body.status).toBe("invalid_payload");
    expect(body.error_hash).toMatch(/^sha256:/u);
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("reads back latest live held rows and R2 object presence without leaking identifiers", async () => {
    const r2Head = vi.fn(async () => ({ found: true }));
    const response = await app.request(
      READBACK_ROUTE,
      {
        body: JSON.stringify({ mode: "latest" }),
        headers: {
          authorization: `Bearer ${APPLY_TOKEN}`,
          "content-type": "application/json",
          "x-aiphabee-smoke": "hk-ipo-public-held-db-readback-v1",
          "x-request-id": "req-hk-ipo-public-held-readback-ok"
        },
        method: "POST"
      },
      {
        AIPHABEE_ARTIFACTS: {
          delete: vi.fn(),
          get: vi.fn(),
          head: r2Head,
          put: vi.fn()
        },
        AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN: APPLY_TOKEN,
        AIPHABEE_HYPERDRIVE: {
          connectionString: "mock-hk-ipo-held-readback-connection"
        }
      }
    );
    const body = (await response.json()) as HeldDbReadbackBody;
    const serialized = JSON.stringify(body);
    const client = pgMock.clients[0]!;
    const normalizedQueries = client.queries.map((query) =>
      query.text.trim().replace(/\s+/gu, " ").toLowerCase()
    );

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(body.held_db_readback_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      object_key_count: 1,
      object_store_missing_count: 0,
      object_store_readback_count: 1,
      payload_envelope_count: 1,
      production_promotion_enabled: false,
      raw_snapshot_payload_leak_count: 0,
      release_state: "held",
      selected_rows: 7,
      status: "passed",
      surface: "hk_ipo_public_live_held_rows_readback",
      writes_serving_tables: false
    });
    expect(normalizedQueries[0]).toContain("from core.hk_ipo_public_source_run");
    expect(normalizedQueries[1]).toContain("from core.raw_source_batch");
    expect(normalizedQueries[2]).toContain("select distinct payload->>'object_key'");
    expect(r2Head).toHaveBeenCalledWith(
      "hk-ipo-public/raw-snapshots/aastocks_ipo_plus/2026-06-28/hash.html"
    );
    expect(serialized).not.toContain("mock-hk-ipo-held-readback-connection");
    expect(serialized).not.toContain("hk-ipo-public/raw-snapshots");
    expect(serialized).not.toContain("09999.HK");
  });
});
