import { beforeEach, describe, expect, it, vi } from "vitest";

const SMOKE_TOKEN = "agent-billing-posted-ledger-smoke-token-000000";
const SMOKE_ROUTE = "/agent/runs/billing-posted-ledger-smoke";

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
    let postedUpdateCount = 0;
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
          normalized.startsWith("insert into platform.account") ||
          normalized.startsWith("insert into platform.workspace") ||
          normalized.startsWith("insert into aiphabee_core.usage_meter_rule") ||
          normalized.startsWith("insert into aiphabee_core.usage_event") ||
          normalized.startsWith("insert into aiphabee_core.usage_ledger_entry")
        ) {
          return { rowCount: 1, rows: [] };
        }

        if (
          normalized.startsWith(
            "select count(*)::int as row_count from aiphabee_core.usage_ledger_entry"
          ) &&
          normalized.includes("billable_state = 'preview'")
        ) {
          return {
            rowCount: 1,
            rows: [{ row_count: 1 }]
          };
        }

        if (
          normalized.startsWith("update aiphabee_core.usage_ledger_entry") &&
          normalized.includes("billable_state = 'posted'") &&
          normalized.includes("billable_state = 'preview'")
        ) {
          postedUpdateCount += 1;
          return { rowCount: postedUpdateCount === 1 ? 1 : 0, rows: [] };
        }

        if (
          normalized.startsWith("select count(*)::int as row_count,") &&
          normalized.includes("coalesce(sum(credit_delta), 0)::numeric as credit_delta") &&
          normalized.includes("billable_state = 'posted'")
        ) {
          return {
            rowCount: 1,
            rows: [{ credit_delta: "2", row_count: 1 }]
          };
        }

        if (
          normalized.startsWith("delete from aiphabee_core.usage_ledger_entry") ||
          normalized.startsWith("delete from aiphabee_core.usage_event") ||
          normalized.startsWith("delete from aiphabee_core.usage_meter_rule") ||
          normalized.startsWith("delete from platform.workspace") ||
          normalized.startsWith("delete from platform.account")
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

interface AgentBillingPostedLedgerSmokeBody {
  agent_billing_posted_ledger_result?: {
    billing_provider_calls?: boolean;
    binding_name?: string;
    cleanup_verified?: boolean;
    deleted_rows?: number;
    failure_code?: string;
    idempotency_key_hash?: string;
    idempotent_skipped_rows?: number;
    inserted_rows?: number;
    ledger_entry_id_hash?: string;
    no_double_charge_verified?: boolean;
    operation_count?: number;
    posted_credit_delta?: number;
    posted_ledger_entry_hash?: string;
    posted_rows?: number;
    production_billing_posted?: boolean;
    selected_rows?: number;
    status?: string;
    surface?: string;
    synthetic_posted_transition?: boolean;
    tables?: string[];
    updated_rows?: number;
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

describe("Agent billing posted ledger smoke", () => {
  beforeEach(() => {
    pgMock.clients.length = 0;
    pgMock.configs.length = 0;
    pgMock.Client.mockClear();
  });

  it("rejects the route without the smoke header", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-request-id": "req-agent-billing-posted-header-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentBillingPostedLedgerSmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-agent-billing-posted-header-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /agent/runs/billing-posted-ledger-smoke",
      status: "forbidden"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("reports missing smoke token before opening Hyperdrive", async () => {
    const response = await app.request(SMOKE_ROUTE, {
      headers: {
        "x-aiphabee-smoke": "agent-billing-posted-ledger-v1",
        "x-request-id": "req-agent-billing-posted-missing-token"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentBillingPostedLedgerSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("missing_env");
    expect(body.missing_env).toEqual(["AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN"]);
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("requires the smoke token before opening Hyperdrive", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          "x-aiphabee-smoke": "agent-billing-posted-ledger-v1",
          "x-request-id": "req-agent-billing-posted-auth-denied"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as AgentBillingPostedLedgerSmokeBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_authorization: "Bearer AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN",
      route: "POST /agent/runs/billing-posted-ledger-smoke",
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
          "x-aiphabee-smoke": "agent-billing-posted-ledger-v1",
          "x-request-id": "req-agent-billing-posted-missing-binding"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as AgentBillingPostedLedgerSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_HYPERDRIVE"]);
    expect(body.agent_billing_posted_ledger_result).toMatchObject({
      billing_provider_calls: false,
      binding_name: "AIPHABEE_HYPERDRIVE",
      failure_code: "missing_hyperdrive_binding",
      production_billing_posted: false,
      status: "missing_binding",
      surface: "agent_billing_posted_ledger_preview_to_posted_idempotency",
      synthetic_posted_transition: true
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("posts a synthetic preview ledger row once and skips the idempotent retry", async () => {
    const response = await app.request(
      SMOKE_ROUTE,
      {
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "x-aiphabee-smoke": "agent-billing-posted-ledger-v1",
          "x-request-id": "req-agent-billing-posted-ok"
        },
        method: "POST"
      },
      {
        AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN: SMOKE_TOKEN,
        AIPHABEE_HYPERDRIVE: {
          connectionString: "mock-agent-billing-posted-ledger-connection"
        }
      }
    );
    const body = (await response.json()) as AgentBillingPostedLedgerSmokeBody;
    const serialized = JSON.stringify(body);
    const client = pgMock.clients[0]!;
    const normalizedQueries = client.queries.map((query) =>
      query.text.trim().replace(/\s+/gu, " ").toLowerCase()
    );
    const accountInsert = client.queries.find((query) =>
      query.text.includes("insert into platform.account")
    );
    const workspaceInsert = client.queries.find((query) =>
      query.text.includes("insert into platform.workspace")
    );
    const usageEventInsert = client.queries.find((query) =>
      query.text.includes("insert into aiphabee_core.usage_event")
    );
    const ledgerInsert = client.queries.find((query) =>
      query.text.includes("insert into aiphabee_core.usage_ledger_entry")
    );

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(body.missing_bindings).toEqual([]);
    expect(body.agent_billing_posted_ledger_result).toMatchObject({
      billing_provider_calls: false,
      binding_name: "AIPHABEE_HYPERDRIVE",
      cleanup_verified: true,
      deleted_rows: 5,
      idempotent_skipped_rows: 0,
      inserted_rows: 5,
      no_double_charge_verified: true,
      operation_count: 16,
      posted_credit_delta: 2,
      posted_rows: 1,
      production_billing_posted: false,
      selected_rows: 2,
      status: "passed",
      surface: "agent_billing_posted_ledger_preview_to_posted_idempotency",
      synthetic_posted_transition: true,
      updated_rows: 1
    });
    expect(body.agent_billing_posted_ledger_result?.idempotency_key_hash).toMatch(/^sha256:/u);
    expect(body.agent_billing_posted_ledger_result?.ledger_entry_id_hash).toMatch(/^sha256:/u);
    expect(body.agent_billing_posted_ledger_result?.posted_ledger_entry_hash).toMatch(
      /^sha256:/u
    );
    expect(body.agent_billing_posted_ledger_result?.usage_event_id_hash).toMatch(/^sha256:/u);
    expect(body.agent_billing_posted_ledger_result?.tables).toEqual([
      "platform.account",
      "platform.workspace",
      "aiphabee_core.usage_meter_rule",
      "aiphabee_core.usage_event",
      "aiphabee_core.usage_ledger_entry"
    ]);
    expect(pgMock.configs[0]?.connectionString).toBe(
      "mock-agent-billing-posted-ledger-connection"
    );
    expect(client.end).toHaveBeenCalledOnce();
    expect(normalizedQueries[0]).toBe("begin");
    expect(normalizedQueries[1]).toContain("insert into platform.account");
    expect(normalizedQueries[2]).toContain("insert into platform.workspace");
    expect(normalizedQueries[3]).toContain("insert into aiphabee_core.usage_meter_rule");
    expect(normalizedQueries[4]).toContain("insert into aiphabee_core.usage_event");
    expect(normalizedQueries[5]).toContain("insert into aiphabee_core.usage_ledger_entry");
    expect(normalizedQueries[6]).toContain("billable_state = 'preview'");
    expect(normalizedQueries[7]).toContain("update aiphabee_core.usage_ledger_entry");
    expect(normalizedQueries[7]).toContain("billable_state = 'posted'");
    expect(normalizedQueries[7]).toContain("billable_state = 'preview'");
    expect(normalizedQueries[8]).toContain("update aiphabee_core.usage_ledger_entry");
    expect(normalizedQueries[8]).toContain("billable_state = 'posted'");
    expect(normalizedQueries[8]).toContain("billable_state = 'preview'");
    expect(normalizedQueries[9]).toContain("billable_state = 'posted'");
    expect(normalizedQueries[10]).toContain("delete from aiphabee_core.usage_ledger_entry");
    expect(normalizedQueries[11]).toContain("delete from aiphabee_core.usage_event");
    expect(normalizedQueries[12]).toContain("delete from aiphabee_core.usage_meter_rule");
    expect(normalizedQueries[13]).toContain("delete from platform.workspace");
    expect(normalizedQueries[14]).toContain("delete from platform.account");
    expect(normalizedQueries[15]).toBe("commit");
    expect(serialized).not.toContain(String(accountInsert?.values?.[0]));
    expect(serialized).not.toContain(String(workspaceInsert?.values?.[0]));
    expect(serialized).not.toContain(String(usageEventInsert?.values?.[0]));
    expect(serialized).not.toContain(String(ledgerInsert?.values?.[0]));
    expect(serialized).not.toContain("idempotency_req_agent_billing_posted_ok_billing_posted");
    expect(serialized).not.toContain("mock-agent-billing-posted-ledger-connection");
    expect(serialized).not.toContain(SMOKE_TOKEN);
  });
});
