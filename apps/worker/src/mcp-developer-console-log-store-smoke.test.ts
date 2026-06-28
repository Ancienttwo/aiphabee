import { beforeEach, describe, expect, it, vi } from "vitest";

const SMOKE_TOKEN = "mcp-developer-console-log-smoke-token-000000";
const SMOKE_ROUTE = "/mcp/developer-console/log-store-smoke";

const pgMock = vi.hoisted(() => {
  const clients = [] as Array<{
    connect: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
    queries: Array<{ text: string; values?: unknown[] }>;
    query: ReturnType<typeof vi.fn>;
  }>;
  const configs = [] as Array<{ connectionString?: string }>;
  const requestLogs = new Map<string, Record<string, unknown>>();
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

        if (normalized.startsWith("insert into aiphabee_core.mcp_developer_console_request_log")) {
          requestLogs.set(String(values?.[0]), {
            credits: values?.[12],
            credits_remaining: values?.[13],
            developer_console_live: false,
            live_api_key_generation_enabled: false,
            live_console_log_store_enabled: false,
            live_oauth_provider_enabled: false,
            live_tool_execution_enabled: false,
            live_usage_ledger_reads_enabled: false,
            request_log_id: values?.[0],
            standard_error_code: values?.[11],
            status: values?.[10]
          });

          return { rowCount: 1, rows: [] };
        }

        if (normalized.startsWith("select request_log_id, status, standard_error_code")) {
          const row = requestLogs.get(String(values?.[0]));

          return {
            rowCount: row === undefined ? 0 : 1,
            rows: row === undefined ? [] : [row]
          };
        }

        if (normalized.startsWith("delete from aiphabee_core.mcp_developer_console_request_log")) {
          const key = String(values?.[0]);
          const existed = requestLogs.delete(key);

          return { rowCount: existed ? 1 : 0, rows: [] };
        }

        throw new Error(`unexpected pg query: ${normalized}`);
      })
    };

    clients.push(client);
    configs.push(config);

    return client;
  });

  return { Client, clients, configs, requestLogs };
});

vi.mock("pg", () => ({
  Client: pgMock.Client
}));

import app from "./index";

interface McpDeveloperConsoleLogStoreSmokeBody {
  mcp_developer_console_log_store_result?: {
    binding_name?: string;
    cleanup_verified?: boolean;
    deleted_rows?: number;
    developer_console_live?: boolean;
    failure_code?: string;
    frontend_rendering?: boolean;
    inserted_rows?: number;
    live_api_key_generation?: boolean;
    live_console_log_store?: boolean;
    live_console_log_store_smoke?: boolean;
    live_oauth_provider?: boolean;
    live_tool_execution?: boolean;
    live_usage_ledger_reads?: boolean;
    operation_count?: number;
    production_console_log_store?: boolean;
    query_hash?: string;
    request_log_id_hash?: string;
    selected_rows?: number;
    source_record_hash?: string;
    status?: string;
    surface?: string;
    tables?: string[];
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

describe("MCP Developer Console log-store smoke", () => {
  beforeEach(() => {
    pgMock.clients.length = 0;
    pgMock.configs.length = 0;
    pgMock.requestLogs.clear();
    pgMock.Client.mockClear();
  });

  it("rejects the route without the smoke header", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-request-id": "req-mcp-console-log-header-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpDeveloperConsoleLogStoreSmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-mcp-console-log-header-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /mcp/developer-console/log-store-smoke",
      status: "forbidden",
      version: "2026-06-22.phase2.mcp-developer-console-log-store-smoke.v0"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("reports missing smoke token before opening Hyperdrive", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-aiphabee-smoke": "mcp-developer-console-log-store-v1",
        "x-request-id": "req-mcp-console-log-missing-token"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpDeveloperConsoleLogStoreSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("missing_env");
    expect(body.missing_env).toEqual(["AIPHABEE_MCP_DEVELOPER_CONSOLE_LOG_SMOKE_TOKEN"]);
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("requires the smoke token before opening Hyperdrive", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          "x-aiphabee-smoke": "mcp-developer-console-log-store-v1",
          "x-request-id": "req-mcp-console-log-auth-denied"
        },
        method: "POST"
      },
      {
        AIPHABEE_MCP_DEVELOPER_CONSOLE_LOG_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as McpDeveloperConsoleLogStoreSmokeBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_authorization: "Bearer AIPHABEE_MCP_DEVELOPER_CONSOLE_LOG_SMOKE_TOKEN",
      route: "POST /mcp/developer-console/log-store-smoke",
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
          "x-aiphabee-smoke": "mcp-developer-console-log-store-v1",
          "x-request-id": "req-mcp-console-log-missing-binding"
        },
        method: "POST"
      },
      {
        AIPHABEE_MCP_DEVELOPER_CONSOLE_LOG_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as McpDeveloperConsoleLogStoreSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_HYPERDRIVE"]);
    expect(body.mcp_developer_console_log_store_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      developer_console_live: false,
      failure_code: "missing_hyperdrive_binding",
      live_console_log_store: false,
      live_console_log_store_smoke: true,
      production_console_log_store: false,
      status: "missing_binding",
      surface: "mcp_developer_console_request_log_insert_select_delete"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("writes, reads, and deletes a synthetic Developer Console request log", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "mcp-developer-console-log-store-v1",
          "x-request-id": "req-mcp-console-log-ok"
        },
        method: "POST"
      },
      {
        AIPHABEE_HYPERDRIVE: {
          connectionString: "mock-mcp-developer-console-log-store-connection"
        },
        AIPHABEE_MCP_DEVELOPER_CONSOLE_LOG_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as McpDeveloperConsoleLogStoreSmokeBody;
    const serialized = JSON.stringify(body);
    const client = pgMock.clients[0]!;
    const normalizedQueries = client.queries.map((query) =>
      query.text.trim().replace(/\s+/gu, " ").toLowerCase()
    );
    const requestLogInsert = client.queries.find((query) =>
      query.text.includes("insert into aiphabee_core.mcp_developer_console_request_log")
    );
    const rawRequestLogId = String(requestLogInsert?.values?.[0]);
    const rawSourceRecordId = String(requestLogInsert?.values?.[17]);

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(body.missing_bindings).toEqual([]);
    expect(body.mcp_developer_console_log_store_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      cleanup_verified: true,
      deleted_rows: 1,
      developer_console_live: false,
      frontend_rendering: false,
      inserted_rows: 1,
      live_api_key_generation: false,
      live_console_log_store: false,
      live_console_log_store_smoke: true,
      live_oauth_provider: false,
      live_tool_execution: false,
      live_usage_ledger_reads: false,
      operation_count: 4,
      production_console_log_store: false,
      selected_rows: 1,
      status: "passed",
      surface: "mcp_developer_console_request_log_insert_select_delete",
      tables: ["aiphabee_core.mcp_developer_console_request_log"]
    });
    expect(body.mcp_developer_console_log_store_result?.query_hash).toMatch(/^sha256:/u);
    expect(body.mcp_developer_console_log_store_result?.request_log_id_hash).toMatch(
      /^sha256:/u
    );
    expect(body.mcp_developer_console_log_store_result?.source_record_hash).toMatch(
      /^sha256:/u
    );
    expect(pgMock.configs[0]?.connectionString).toBe(
      "mock-mcp-developer-console-log-store-connection"
    );
    expect(client.end).toHaveBeenCalledOnce();
    expect(normalizedQueries[0]).toBe("begin");
    expect(normalizedQueries[1]).toContain(
      "insert into aiphabee_core.mcp_developer_console_request_log"
    );
    expect(normalizedQueries[2]).toContain("select request_log_id, status");
    expect(normalizedQueries[3]).toContain(
      "delete from aiphabee_core.mcp_developer_console_request_log"
    );
    expect(normalizedQueries[4]).toBe("commit");
    expect(serialized).not.toContain(rawRequestLogId);
    expect(serialized).not.toContain(rawSourceRecordId);
    expect(serialized).not.toContain("mock-mcp-developer-console-log-store-connection");
    expect(serialized).not.toContain(SMOKE_TOKEN);
  });
});
