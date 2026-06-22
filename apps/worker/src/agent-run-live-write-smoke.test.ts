import { beforeEach, describe, expect, it, vi } from "vitest";

const SMOKE_TOKEN = "agent-run-live-write-smoke-token-000000";
const SMOKE_ROUTE = "/agent/runs/live-write-smoke";

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
          normalized.startsWith("insert into audit.agent_run_audit_event") ||
          normalized.startsWith("insert into core.evidence_record") ||
          normalized.startsWith("insert into core.evidence_source_ref") ||
          normalized.startsWith("insert into core.account") ||
          normalized.startsWith("insert into core.workspace") ||
          normalized.startsWith("insert into core.usage_meter_rule") ||
          normalized.startsWith("insert into core.usage_event") ||
          normalized.startsWith("insert into core.usage_ledger_entry")
        ) {
          return { rowCount: 1, rows: [] };
        }

        if (
          normalized.startsWith("select count(*)::int as row_count from audit.agent_run_audit_event") ||
          normalized.startsWith("select count(*)::int as row_count from core.evidence_record") ||
          normalized.startsWith("select count(*)::int as row_count from core.usage_event") ||
          normalized.startsWith("select count(*)::int as row_count from core.usage_ledger_entry")
        ) {
          return {
            rowCount: 1,
            rows: [{ row_count: 1 }]
          };
        }

        if (
          normalized.startsWith("delete from core.usage_ledger_entry") ||
          normalized.startsWith("delete from core.usage_event") ||
          normalized.startsWith("delete from core.usage_meter_rule") ||
          normalized.startsWith("delete from core.evidence_source_ref") ||
          normalized.startsWith("delete from core.evidence_record") ||
          normalized.startsWith("delete from core.workspace") ||
          normalized.startsWith("delete from core.account") ||
          normalized.startsWith("delete from audit.agent_run_audit_event")
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

interface AgentRunLiveWriteSmokeBody {
  agent_run_live_write_result?: {
    audit_event_hash?: string;
    binding_name?: string;
    cleanup_verified?: boolean;
    deleted_rows?: number;
    evidence_record_id_hash?: string;
    failure_code?: string;
    inserted_rows?: number;
    ledger_entry_id_hash?: string;
    operation_count?: number;
    production_persistence_enabled?: boolean;
    selected_rows?: number;
    status?: string;
    surface?: string;
    tables?: string[];
    usage_event_id_hash?: string;
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

describe("Agent run live write smoke", () => {
  beforeEach(() => {
    pgMock.clients.length = 0;
    pgMock.configs.length = 0;
    pgMock.Client.mockClear();
  });

  it("rejects the route without the smoke header", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-request-id": "req-agent-live-write-header-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentRunLiveWriteSmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-agent-live-write-header-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /agent/runs/live-write-smoke",
      status: "forbidden"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("reports missing smoke token before opening Hyperdrive", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-aiphabee-smoke": "agent-run-live-write-v1",
        "x-request-id": "req-agent-live-write-missing-token"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentRunLiveWriteSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("missing_env");
    expect(body.missing_env).toEqual(["AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN"]);
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("requires the smoke token before opening Hyperdrive", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          "x-aiphabee-smoke": "agent-run-live-write-v1",
          "x-request-id": "req-agent-live-write-auth-denied"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as AgentRunLiveWriteSmokeBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_authorization: "Bearer AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN",
      route: "POST /agent/runs/live-write-smoke",
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
          "x-aiphabee-smoke": "agent-run-live-write-v1",
          "x-request-id": "req-agent-live-write-missing-binding"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as AgentRunLiveWriteSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_HYPERDRIVE"]);
    expect(body.agent_run_live_write_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      failure_code: "missing_hyperdrive_binding",
      production_persistence_enabled: false,
      status: "missing_binding",
      surface: "agent_run_audit_evidence_usage_insert_select_delete"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("writes, reads, and deletes synthetic run audit, evidence, and usage rows", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "agent-run-live-write-v1",
          "x-request-id": "req-agent-live-write-ok"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN: SMOKE_TOKEN,
        AIPHABEE_HYPERDRIVE: {
          connectionString: "mock-agent-run-live-write-connection"
        }
      }
    );
    const body = (await response.json()) as AgentRunLiveWriteSmokeBody;
    const serialized = JSON.stringify(body);
    const client = pgMock.clients[0]!;
    const normalizedQueries = client.queries.map((query) =>
      query.text.trim().replace(/\s+/gu, " ").toLowerCase()
    );
    const auditInsert = client.queries.find((query) =>
      query.text.includes("insert into audit.agent_run_audit_event")
    );
    const evidenceInsert = client.queries.find((query) =>
      query.text.includes("insert into core.evidence_record")
    );
    const sourceRefInsert = client.queries.find((query) =>
      query.text.includes("insert into core.evidence_source_ref")
    );
    const accountInsert = client.queries.find((query) =>
      query.text.includes("insert into core.account")
    );
    const workspaceInsert = client.queries.find((query) =>
      query.text.includes("insert into core.workspace")
    );
    const usageEventInsert = client.queries.find((query) =>
      query.text.includes("insert into core.usage_event")
    );
    const ledgerInsert = client.queries.find((query) =>
      query.text.includes("insert into core.usage_ledger_entry")
    );

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(body.missing_bindings).toEqual([]);
    expect(body.agent_run_live_write_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      cleanup_verified: true,
      deleted_rows: 8,
      inserted_rows: 8,
      operation_count: 21,
      production_persistence_enabled: false,
      selected_rows: 4,
      status: "passed",
      surface: "agent_run_audit_evidence_usage_insert_select_delete"
    });
    expect(body.agent_run_live_write_result?.audit_event_hash).toMatch(/^sha256:/u);
    expect(body.agent_run_live_write_result?.evidence_record_id_hash).toMatch(/^sha256:/u);
    expect(body.agent_run_live_write_result?.usage_event_id_hash).toMatch(/^sha256:/u);
    expect(body.agent_run_live_write_result?.ledger_entry_id_hash).toMatch(/^sha256:/u);
    expect(body.agent_run_live_write_result?.tables).toEqual([
      "audit.agent_run_audit_event",
      "core.evidence_record",
      "core.evidence_source_ref",
      "core.account",
      "core.workspace",
      "core.usage_meter_rule",
      "core.usage_event",
      "core.usage_ledger_entry"
    ]);
    expect(pgMock.configs[0]?.connectionString).toBe("mock-agent-run-live-write-connection");
    expect(client.end).toHaveBeenCalledOnce();
    expect(normalizedQueries[0]).toBe("begin");
    expect(normalizedQueries[1]).toContain("insert into audit.agent_run_audit_event");
    expect(normalizedQueries[2]).toContain("insert into core.evidence_record");
    expect(normalizedQueries[3]).toContain("insert into core.evidence_source_ref");
    expect(normalizedQueries[4]).toContain("insert into core.account");
    expect(normalizedQueries[5]).toContain("insert into core.workspace");
    expect(normalizedQueries[6]).toContain("insert into core.usage_meter_rule");
    expect(normalizedQueries[7]).toContain("insert into core.usage_event");
    expect(normalizedQueries[8]).toContain("insert into core.usage_ledger_entry");
    expect(normalizedQueries[9]).toContain("from audit.agent_run_audit_event");
    expect(normalizedQueries[10]).toContain("from core.evidence_record");
    expect(normalizedQueries[11]).toContain("from core.usage_event");
    expect(normalizedQueries[12]).toContain("from core.usage_ledger_entry");
    expect(normalizedQueries[13]).toContain("delete from core.usage_ledger_entry");
    expect(normalizedQueries[14]).toContain("delete from core.usage_event");
    expect(normalizedQueries[15]).toContain("delete from core.usage_meter_rule");
    expect(normalizedQueries[16]).toContain("delete from core.evidence_source_ref");
    expect(normalizedQueries[17]).toContain("delete from core.evidence_record");
    expect(normalizedQueries[18]).toContain("delete from core.workspace");
    expect(normalizedQueries[19]).toContain("delete from core.account");
    expect(normalizedQueries[20]).toContain("delete from audit.agent_run_audit_event");
    expect(normalizedQueries[21]).toBe("commit");
    expect(serialized).not.toContain(String(auditInsert?.values?.[0]));
    expect(serialized).not.toContain(String(evidenceInsert?.values?.[0]));
    expect(serialized).not.toContain(String(sourceRefInsert?.values?.[3]));
    expect(serialized).not.toContain(String(accountInsert?.values?.[0]));
    expect(serialized).not.toContain(String(workspaceInsert?.values?.[0]));
    expect(serialized).not.toContain(String(usageEventInsert?.values?.[0]));
    expect(serialized).not.toContain(String(ledgerInsert?.values?.[0]));
    expect(serialized).not.toContain("mock-agent-run-live-write-connection");
    expect(serialized).not.toContain(SMOKE_TOKEN);
  });
});
