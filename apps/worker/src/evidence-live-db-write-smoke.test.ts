import { beforeEach, describe, expect, it, vi } from "vitest";

const SMOKE_TOKEN = "evidence-live-db-smoke-token-0000000000";

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

        if (normalized.startsWith("insert into core.evidence_record")) {
          return { rowCount: 1, rows: [] };
        }

        if (normalized.startsWith("insert into core.evidence_source_ref")) {
          return { rowCount: 1, rows: [] };
        }

        if (normalized.startsWith("select evidence_record_id")) {
          return {
            rowCount: 1,
            rows: [
              {
                evidence_record_id: values?.[0],
                live_write_state: "planned_no_write",
                source_record_count: 1
              }
            ]
          };
        }

        if (normalized.startsWith("select count(*)::int as source_ref_count")) {
          return {
            rowCount: 1,
            rows: [{ source_ref_count: 1 }]
          };
        }

        if (normalized.startsWith("delete from core.evidence_source_ref")) {
          return { rowCount: 1, rows: [] };
        }

        if (normalized.startsWith("delete from core.evidence_record")) {
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

interface EvidenceLiveDbWriteSmokeBody {
  evidence_live_db_write_result?: {
    binding_name?: string;
    deleted_rows?: number;
    evidence_record_id_hash?: string;
    failure_code?: string;
    inserted_rows?: number;
    live_write_state?: string;
    operation_count?: number;
    selected_rows?: number;
    source_ref_count?: number;
    source_ref_hashes?: string[];
    status?: string;
    surface?: string;
  };
  missing_bindings?: string[];
  missing_env?: string[];
  request_id?: string;
  required_authorization?: string;
  required_header?: string;
  route?: string;
  status?: string;
}

describe("Evidence live DB write smoke", () => {
  beforeEach(() => {
    pgMock.clients.length = 0;
    pgMock.configs.length = 0;
    pgMock.Client.mockClear();
  });

  it("rejects the route without the smoke header", async () => {
    const response = await app.request("/evidence/records/live-db-smoke", {
      headers: {
        "x-request-id": "req-evidence-live-db-header-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as EvidenceLiveDbWriteSmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-evidence-live-db-header-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /evidence/records/live-db-smoke",
      status: "forbidden"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("reports missing smoke token before opening Hyperdrive", async () => {
    const response = await app.request("/evidence/records/live-db-smoke", {
      headers: {
        "x-aiphabee-smoke": "evidence-lineage-live-db-v1",
        "x-request-id": "req-evidence-live-db-missing-token"
      },
      method: "POST"
    });
    const body = (await response.json()) as EvidenceLiveDbWriteSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("missing_env");
    expect(body.missing_env).toEqual(["AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN"]);
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("requires the smoke token before opening Hyperdrive", async () => {
    const response = await app.request(
      "/evidence/records/live-db-smoke",
      {
        headers: {
          "x-aiphabee-smoke": "evidence-lineage-live-db-v1",
          "x-request-id": "req-evidence-live-db-auth-denied"
        },
        method: "POST"
      },
      {
        AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as EvidenceLiveDbWriteSmokeBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_authorization: "Bearer AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN",
      route: "POST /evidence/records/live-db-smoke",
      status: "forbidden"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("reports missing Hyperdrive binding after auth passes", async () => {
    const response = await app.request(
      "/evidence/records/live-db-smoke",
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "evidence-lineage-live-db-v1",
          "x-request-id": "req-evidence-live-db-missing-binding"
        },
        method: "POST"
      },
      {
        AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as EvidenceLiveDbWriteSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_HYPERDRIVE"]);
    expect(body.evidence_live_db_write_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      failure_code: "missing_hyperdrive_binding",
      status: "missing_binding",
      surface: "evidence_record_source_ref_insert_select_delete"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("writes, reads, and deletes synthetic evidence rows through Hyperdrive", async () => {
    const response = await app.request(
      "/evidence/records/live-db-smoke",
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "evidence-lineage-live-db-v1",
          "x-request-id": "req-evidence-live-db-ok"
        },
        method: "POST"
      },
      {
        AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN: SMOKE_TOKEN,
        AIPHABEE_HYPERDRIVE: {
          connectionString: "mock-hyperdrive-connection-string"
        }
      }
    );
    const body = (await response.json()) as EvidenceLiveDbWriteSmokeBody;
    const serialized = JSON.stringify(body);
    const client = pgMock.clients[0]!;
    const normalizedQueries = client.queries.map((query) =>
      query.text.trim().replace(/\s+/gu, " ").toLowerCase()
    );
    const recordInsert = client.queries.find((query) =>
      query.text.includes("insert into core.evidence_record")
    );
    const sourceRefInsert = client.queries.find((query) =>
      query.text.includes("insert into core.evidence_source_ref")
    );
    const rawEvidenceRecordId = String(recordInsert?.values?.[0]);
    const rawSourceRecordId = String(sourceRefInsert?.values?.[3]);

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.missing_bindings).toEqual([]);
    expect(body.evidence_live_db_write_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      deleted_rows: 2,
      inserted_rows: 2,
      live_write_state: "planned_no_write",
      operation_count: 9,
      selected_rows: 1,
      source_ref_count: 1,
      status: "passed",
      surface: "evidence_record_source_ref_insert_select_delete"
    });
    expect(body.evidence_live_db_write_result?.evidence_record_id_hash).toMatch(/^sha256:/u);
    expect(body.evidence_live_db_write_result?.source_ref_hashes?.[0]).toMatch(/^sha256:/u);
    expect(pgMock.configs[0]?.connectionString).toBe("mock-hyperdrive-connection-string");
    expect(client.end).toHaveBeenCalledOnce();
    expect(normalizedQueries[0]).toBe("begin");
    expect(normalizedQueries[1]).toContain("insert into core.evidence_record");
    expect(normalizedQueries[2]).toContain("insert into core.evidence_source_ref");
    expect(normalizedQueries[3]).toContain("select evidence_record_id, live_write_state");
    expect(normalizedQueries[4]).toContain("select count(*)::int as source_ref_count");
    expect(normalizedQueries[5]).toContain("delete from core.evidence_source_ref");
    expect(normalizedQueries[6]).toContain("delete from core.evidence_record");
    expect(normalizedQueries[7]).toBe("commit");
    expect(serialized).not.toContain(rawEvidenceRecordId);
    expect(serialized).not.toContain(rawSourceRecordId);
    expect(serialized).not.toContain("mock-hyperdrive-connection-string");
  });
});
