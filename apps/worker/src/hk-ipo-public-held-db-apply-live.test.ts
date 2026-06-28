import { beforeEach, describe, expect, it, vi } from "vitest";

const APPLY_TOKEN = "hk-ipo-public-held-db-apply-token-000000";
const APPLY_ROUTE = "/ingest/hk-ipo-public/held-db-apply";

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
          const rows = JSON.parse(String(values?.[0] ?? "[]")) as unknown[];
          return { rowCount: rows.length, rows: [] };
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

interface HeldDbApplyLiveBody {
  error_hash?: string;
  held_db_apply_result?: {
    binding_name?: string;
    data_version_hash?: string;
    inserted_or_updated_rows?: number;
    object_store_write_count?: number;
    production_promotion_enabled?: boolean;
    release_state?: string;
    selected_rows?: number;
    source_batch_id_hash?: string;
    source_run_id_hash?: string;
    status?: string;
    surface?: string;
    writes_serving_tables?: boolean;
  };
  required_header?: string;
  response_hash?: string;
  route?: string;
  status?: string;
}

describe("HK IPO public held DB live apply", () => {
  beforeEach(() => {
    pgMock.clients.length = 0;
    pgMock.configs.length = 0;
    pgMock.Client.mockClear();
  });

  it("rejects missing route header before opening Hyperdrive", async () => {
    const response = await app.request(APPLY_ROUTE, {
      method: "POST"
    });
    const body = (await response.json()) as HeldDbApplyLiveBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_header: "x-aiphabee-smoke",
      route: "POST /ingest/hk-ipo-public/held-db-apply",
      status: "forbidden"
    });
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("rejects invalid payload before opening Hyperdrive", async () => {
    const response = await app.request(
      APPLY_ROUTE,
      {
        body: JSON.stringify({ version: "bad" }),
        headers: {
          authorization: `Bearer ${APPLY_TOKEN}`,
          "content-type": "application/json",
          "x-aiphabee-smoke": "hk-ipo-public-held-db-apply-live-v1"
        },
        method: "POST"
      },
      {
        AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN: APPLY_TOKEN
      }
    );
    const body = (await response.json()) as HeldDbApplyLiveBody;

    expect(response.status).toBe(400);
    expect(body.status).toBe("invalid_payload");
    expect(body.error_hash).toMatch(/^sha256:/u);
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("rejects reconciliation rows missing required SQL fields before opening Hyperdrive", async () => {
    const payload = makePayload();
    const reconciliationRow = payload.row_groups.hk_ipo_public_reconciliation_row[0] as Record<
      string,
      unknown
    >;
    delete reconciliationRow.confidence;

    const response = await app.request(
      APPLY_ROUTE,
      {
        body: JSON.stringify(payload),
        headers: {
          authorization: `Bearer ${APPLY_TOKEN}`,
          "content-type": "application/json",
          "x-aiphabee-smoke": "hk-ipo-public-held-db-apply-live-v1"
        },
        method: "POST"
      },
      {
        AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN: APPLY_TOKEN
      }
    );
    const body = (await response.json()) as HeldDbApplyLiveBody;

    expect(response.status).toBe(400);
    expect(body.status).toBe("invalid_payload");
    expect(body.error_hash).toMatch(/^sha256:/u);
    expect(pgMock.Client).not.toHaveBeenCalled();
  });

  it("bulk upserts live held rows and returns only counts and hashes", async () => {
    const payload = makePayload();
    const response = await app.request(
      APPLY_ROUTE,
      {
        body: JSON.stringify(payload),
        headers: {
          authorization: `Bearer ${APPLY_TOKEN}`,
          "content-type": "application/json",
          "x-aiphabee-smoke": "hk-ipo-public-held-db-apply-live-v1",
          "x-request-id": "req-hk-ipo-public-held-live-ok"
        },
        method: "POST"
      },
      {
        AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN: APPLY_TOKEN,
        AIPHABEE_HYPERDRIVE: {
          connectionString: "mock-hk-ipo-held-live-connection"
        }
      }
    );
    const body = (await response.json()) as HeldDbApplyLiveBody;
    const serialized = JSON.stringify(body);
    const client = pgMock.clients[0]!;
    const normalizedQueries = client.queries.map((query) =>
      query.text.trim().replace(/\s+/gu, " ").toLowerCase()
    );

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.response_hash).toMatch(/^sha256:/u);
    expect(body.held_db_apply_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      inserted_or_updated_rows: 7,
      object_store_write_count: 1,
      production_promotion_enabled: false,
      release_state: "held",
      selected_rows: 7,
      status: "passed",
      surface: "hk_ipo_public_live_held_rows_upsert_readback",
      writes_serving_tables: false
    });
    expect(body.held_db_apply_result?.data_version_hash).toMatch(/^sha256:/u);
    expect(body.held_db_apply_result?.source_batch_id_hash).toMatch(/^sha256:/u);
    expect(body.held_db_apply_result?.source_run_id_hash).toMatch(/^sha256:/u);
    expect(normalizedQueries[0]).toBe("begin");
    expect(normalizedQueries[1]).toContain("insert into core.raw_source_batch");
    expect(normalizedQueries[2]).toContain("insert into core.data_version_batch");
    expect(normalizedQueries[3]).toContain("insert into core.hk_ipo_public_source_run");
    expect(normalizedQueries[4]).toContain("insert into core.raw_snapshot");
    expect(normalizedQueries[5]).toContain("insert into core.hk_ipo_public_observation");
    expect(normalizedQueries[6]).toContain("insert into core.hk_ipo_public_reconciliation_row");
    expect(normalizedQueries[7]).toContain("insert into core.hk_ipo_public_supplement_candidate");
    expect(normalizedQueries[8]).toContain("select (select count(*)::int from core.raw_source_batch");
    expect(normalizedQueries[9]).toBe("commit");
    expect(serialized).not.toContain("mock-hk-ipo-held-live-connection");
    expect(serialized).not.toContain("https://www.aastocks.com");
    expect(serialized).not.toContain("09999.HK");
  });
});

function makePayload() {
  const ids = {
    dataVersion: "dv_hk_ipo_public_aaaaaaaaaaaaaaaaaaaaaaaa",
    observation: "obs_aaaaaaaaaaaaaaaaaaaaaaaa",
    rawSnapshot: "raw_hk_ipo_public_aaaaaaaaaaaaaaaaaaaaaaaa",
    request: "raw_snapshot_request_aaaaaaaaaaaaaaaaaaaaaaaa",
    sourceBatch: "rsb_hk_ipo_public_aaaaaaaaaaaaaaaaaaaaaaaa",
    sourceRecord: "aastocks_ipo_plus:current_ipos:09999.HK",
    sourceRun: "sr_hk_ipo_public_aaaaaaaaaaaaaaaaaaaaaaaa"
  };
  return {
    apply_plan_id: "hk_ipo_public_apply_plan_aaaaaaaaaaaaaaaaaaaaaaaa",
    data_version: ids.dataVersion,
    mode: "live",
    object_store_write_summary: {
      payload_body_output_count: 0,
      remote_object_store_write_count: 1,
      status: "ok",
      writes_database_count: 0
    },
    packet_hash: `packet:${"a".repeat(64)}`,
    packet_kind: "hk_ipo_public_held_db_apply_packet",
    row_groups: {
      data_version_batch: [
        {
          data_version: ids.dataVersion,
          methodology_version: "packet-v0",
          release_state: "held",
          rights_policy_version: "default_deny",
          source_batch_id: ids.sourceBatch
        }
      ],
      hk_ipo_public_observation: [
        {
          confidence: 0.8,
          conflict_status: "unreconciled",
          data_version: ids.dataVersion,
          field_name: "lot_size",
          field_value: 1000,
          field_value_type: "number",
          locator: "row=1;field=lot_size",
          locator_hash: "locator-hash",
          observation_id: ids.observation,
          observed_at: "2026-06-28T00:00:00.000Z",
          provider: "AASTOCKS",
          quality_state: "HOLD",
          raw_snapshot_id: ids.rawSnapshot,
          raw_snapshot_required: true,
          reconciled_with_hkex: false,
          security_code: "09999.HK",
          source_id: "aastocks_ipo_plus",
          source_record_id: ids.sourceRecord,
          source_run_id: ids.sourceRun,
          source_url: "https://www.aastocks.com/en/stocks/market/ipo/mainpage.aspx"
        }
      ],
      hk_ipo_public_reconciliation_row: [
        {
          canonical_candidate: 1000,
          confidence: "medium",
          conflict_requires_manual_review: false,
          data_version: ids.dataVersion,
          fact_name: "lot_size",
          hkex_evidence_ids: ["hkex_evidence_hash"],
          promotes_fact: false,
          quality_state: "HOLD",
          raw_snapshot_request_ids: [ids.request],
          raw_snapshot_required: true,
          reason: "single source held candidate",
          reconciliation_row_id: "ipo_public_reconciliation_aaaaaaaaaaaaaaaaaaaaaaaa",
          security_code: "09999.HK",
          source_ids: ["aastocks_ipo_plus"],
          source_observation_ids: [ids.observation],
          source_run_id: ids.sourceRun,
          status: "single_source"
        }
      ],
      hk_ipo_public_source_run: [
        {
          adapter_version: "adapter-v0",
          data_version: ids.dataVersion,
          live_network_writes: false,
          observation_count: 1,
          packet_version: "packet-v0",
          reconciliation_row_count: 1,
          security_count: 1,
          source_batch_id: ids.sourceBatch,
          source_ids: ["aastocks_ipo_plus"],
          source_mode: "live",
          source_run_id: ids.sourceRun,
          status: "held",
          supplement_candidate_count: 1,
          writes_serving_tables: false
        }
      ],
      hk_ipo_public_supplement_candidate: [
        {
          data_version: ids.dataVersion,
          field_name: "lot_size",
          field_value_type: "number",
          promotes_fact: false,
          quality_state: "HOLD",
          raw_snapshot_required: true,
          reason: "held candidate",
          security_code: "09999.HK",
          source_id: "aastocks_ipo_plus",
          source_observation_id: ids.observation,
          source_record_id: ids.sourceRecord,
          source_run_id: ids.sourceRun,
          status: "candidate",
          supplement_candidate_id: "ipo_public_supplement_aaaaaaaaaaaaaaaaaaaaaaaa"
        }
      ],
      raw_snapshot: [
        {
          data_version: ids.dataVersion,
          methodology_version: "packet-v0",
          payload: {
            object_key: "hk-ipo-public/raw-snapshots/aastocks/2026-06-28/hash.html",
            payload_body_included: false,
            payload_hash_sha256: `sha256:${"b".repeat(64)}`,
            raw_html_included: false,
            storage_target: "external_raw_snapshot_store"
          },
          payload_hash_sha256: `sha256:${"c".repeat(64)}`,
          quality_state: "HOLD",
          raw_snapshot_id: ids.rawSnapshot,
          received_at: "2026-06-28T00:00:00.000Z",
          record_kind: "hk_ipo_public_source_record",
          source_batch_id: ids.sourceBatch,
          source_record_id: ids.sourceRecord
        }
      ],
      raw_source_batch: [
        {
          checksum_sha256: `sha256:${"d".repeat(64)}`,
          received_at: "2026-06-28T00:00:00.000Z",
          row_count: 1,
          source_batch_id: ids.sourceBatch,
          source_dataset: "hk_ipo_public_observation",
          source_name: "hk_ipo_public_sources",
          source_rights_status: "default_deny"
        }
      ]
    },
    source_batch_id: ids.sourceBatch,
    source_run_id: ids.sourceRun,
    version: "2026-06-28.hk-ipo-public-held-db-apply-live.v0"
  };
}
