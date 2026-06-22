import { beforeEach, describe, expect, it, vi } from "vitest";

const SMOKE_TOKEN = "agent-run-state-persistence-smoke-token-000000";
const SMOKE_ROUTE = "/agent/runs/state-persistence-smoke";

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
          normalized.startsWith("insert into core.agent_run_state") ||
          normalized.startsWith("insert into core.agent_run_checkpoint")
        ) {
          return { rowCount: 1, rows: [] };
        }

        if (
          normalized.startsWith("select count(*)::int as row_count from core.agent_run_state") ||
          normalized.startsWith("select count(*)::int as row_count from core.agent_run_checkpoint")
        ) {
          return {
            rowCount: 1,
            rows: [{ row_count: 1 }]
          };
        }

        if (normalized.startsWith("update core.agent_run_state")) {
          return { rowCount: 1, rows: [] };
        }

        if (
          normalized.startsWith("delete from core.agent_run_checkpoint") ||
          normalized.startsWith("delete from core.agent_run_state")
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

interface AgentRunStatePersistenceSmokeBody {
  agent_run_state_persistence_result?: {
    binding_name?: string;
    checkpoint_id_hash?: string;
    cleanup_verified?: boolean;
    deleted_rows?: number;
    durable_run_state_smoke?: boolean;
    failure_code?: string;
    idempotency_key_hash?: string;
    inserted_rows?: number;
    operation_count?: number;
    production_persistence_enabled?: boolean;
    resume_token_hash?: string;
    run_state_id_hash?: string;
    selected_rows?: number;
    status?: string;
    surface?: string;
    tables?: string[];
    updated_rows?: number;
    user_facing_resume_enabled?: boolean;
  };
  missing_bindings?: string[];
  missing_env?: string[];
  request_id?: string;
  required_authorization?: string;
  required_header?: string;
  response_hash?: string;
  route?: string;
  status?: string;
}

describe("Agent run state persistence smoke", () => {
  beforeEach(() => {
    pgMock.clients.length = 0;
    pgMock.configs.length = 0;
    pgMock.Client.mockClear();
  });

  it("rejects the route without the smoke header", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-request-id": "req-agent-run-state-header-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentRunStatePersistenceSmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-agent-run-state-header-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /agent/runs/state-persistence-smoke",
      status: "forbidden"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("reports missing smoke token before opening Hyperdrive", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-aiphabee-smoke": "agent-run-state-persistence-v1",
        "x-request-id": "req-agent-run-state-missing-token"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentRunStatePersistenceSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("missing_env");
    expect(body.missing_env).toEqual(["AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN"]);
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("requires the smoke token before opening Hyperdrive", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          "x-aiphabee-smoke": "agent-run-state-persistence-v1",
          "x-request-id": "req-agent-run-state-auth-denied"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as AgentRunStatePersistenceSmokeBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_authorization: "Bearer AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN",
      route: "POST /agent/runs/state-persistence-smoke",
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
          "x-aiphabee-smoke": "agent-run-state-persistence-v1",
          "x-request-id": "req-agent-run-state-missing-binding"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as AgentRunStatePersistenceSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_HYPERDRIVE"]);
    expect(body.agent_run_state_persistence_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      durable_run_state_smoke: true,
      failure_code: "missing_hyperdrive_binding",
      production_persistence_enabled: false,
      status: "missing_binding",
      surface: "agent_run_state_checkpoint_insert_select_update_delete",
      user_facing_resume_enabled: false
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("writes, reads, updates, and deletes synthetic run state and checkpoint rows", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "agent-run-state-persistence-v1",
          "x-request-id": "req-agent-run-state-ok"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN: SMOKE_TOKEN,
        AIPHABEE_HYPERDRIVE: {
          connectionString: "mock-agent-run-state-persistence-connection"
        }
      }
    );
    const body = (await response.json()) as AgentRunStatePersistenceSmokeBody;
    const serialized = JSON.stringify(body);
    const client = pgMock.clients[0]!;
    const normalizedQueries = client.queries.map((query) =>
      query.text.trim().replace(/\s+/gu, " ").toLowerCase()
    );
    const stateInsert = client.queries.find((query) =>
      query.text.includes("insert into core.agent_run_state")
    );
    const checkpointInsert = client.queries.find((query) =>
      query.text.includes("insert into core.agent_run_checkpoint")
    );

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(pgMock.configs).toEqual([
      {
        connectionString: "mock-agent-run-state-persistence-connection"
      }
    ]);
    expect(body.agent_run_state_persistence_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      cleanup_verified: true,
      deleted_rows: 2,
      durable_run_state_smoke: true,
      inserted_rows: 2,
      operation_count: 10,
      production_persistence_enabled: false,
      selected_rows: 3,
      status: "passed",
      surface: "agent_run_state_checkpoint_insert_select_update_delete",
      tables: ["core.agent_run_state", "core.agent_run_checkpoint"],
      updated_rows: 1,
      user_facing_resume_enabled: false
    });
    expect(body.agent_run_state_persistence_result?.checkpoint_id_hash).toMatch(/^sha256:/u);
    expect(body.agent_run_state_persistence_result?.idempotency_key_hash).toMatch(/^sha256:/u);
    expect(body.agent_run_state_persistence_result?.resume_token_hash).toMatch(/^sha256:/u);
    expect(body.agent_run_state_persistence_result?.run_state_id_hash).toMatch(/^sha256:/u);
    expect(normalizedQueries).toHaveLength(10);
    expect(normalizedQueries[0]).toBe("begin");
    expect(normalizedQueries[1]).toContain("insert into core.agent_run_state");
    expect(normalizedQueries[2]).toContain("insert into core.agent_run_checkpoint");
    expect(normalizedQueries[3]).toContain("from core.agent_run_state");
    expect(normalizedQueries[4]).toContain("from core.agent_run_checkpoint");
    expect(normalizedQueries[5]).toContain("update core.agent_run_state");
    expect(normalizedQueries[6]).toContain("from core.agent_run_state");
    expect(normalizedQueries[7]).toContain("delete from core.agent_run_checkpoint");
    expect(normalizedQueries[8]).toContain("delete from core.agent_run_state");
    expect(normalizedQueries[9]).toBe("commit");
    expect(stateInsert?.values?.[5]).toBe("running");
    expect(checkpointInsert?.values?.[3]).toBe("completed");
    expect(serialized).not.toContain("mock-agent-run-state-persistence-connection");
    expect(serialized).not.toContain(SMOKE_TOKEN);
    expect(serialized).not.toContain(String(stateInsert?.values?.[0]));
    expect(serialized).not.toContain(String(checkpointInsert?.values?.[0]));
  });
});
