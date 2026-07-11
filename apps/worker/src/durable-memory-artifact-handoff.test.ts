import { describe, expect, it, vi } from "vitest";
import type { Client } from "pg";

import {
  PostgresDurableHandoffRecordStore,
  R2DurableHandoffObjectStore,
  createWorkerDurableHandoffStores,
  type DurableHandoffR2Bucket
} from "./durable-memory-artifact-handoff.js";
import type { DurableHandoffRecord } from "@aiphabee/agent-runtime/durable-memory-artifact-handoff";

const NOW = "2026-07-11T06:00:00.000Z";

function record(): DurableHandoffRecord {
  return {
    approval: {
      approved_at: NOW,
      approver: "policy:artifact-v1",
      decision_id: "decision-report"
    },
    byte_size: 4,
    classification: "tenant_confidential",
    content_hash_sha256:
      "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    content_type: "application/pdf",
    contract_version: "2026-07-11.durable-memory-artifact-handoff.v0",
    created_at: NOW,
    deleted_at: null,
    evidence: { evidence_ids: ["evidence-report"] },
    expires_at: "2026-08-10T06:00:00.000Z",
    id: "handoff_report_aaaaaaaaaaaaaaaa",
    kind: "artifact",
    lease_id: "lease-row8",
    owner_user_id: "user-row8",
    provenance: {
      generated_at: NOW,
      runner_id: "fastclaw.personal-v0",
      source: "sandbox",
      source_run_id: "run-row8",
      tool_call_ids: ["tool-report"],
      workspace_path: "outputs/report.pdf"
    },
    retention_policy: "temporary_30d",
    run_id: "run-row8",
    scan: {
      classification: "tenant_confidential",
      engine: "scanner-vendor",
      scanned_at: NOW,
      signature_version: "signatures-v1",
      status: "clean"
    },
    storage_key:
      "agent-handoff/v0/tenant-row8/user-row8/run-row8/artifact/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    tenant_id: "tenant-row8"
  };
}

function pgRow(source = record()) {
  return {
    approval: source.approval,
    byte_size: String(source.byte_size),
    classification: source.classification,
    content_hash_sha256: source.content_hash_sha256,
    content_type: source.content_type,
    contract_version: source.contract_version,
    created_at: new Date(source.created_at),
    deleted_at: source.deleted_at,
    evidence: source.evidence,
    expires_at: source.expires_at === null ? null : new Date(source.expires_at),
    handoff_id: source.id,
    kind: source.kind,
    lease_id: source.lease_id,
    owner_account_id: source.owner_user_id,
    provenance: source.provenance,
    retention_policy: source.retention_policy,
    run_id: source.run_id,
    scan: source.scan,
    storage_key: source.storage_key,
    workspace_id: source.tenant_id
  };
}

describe("Worker durable handoff stores", () => {
  it("inserts every required field and reads through an exact tenant predicate", async () => {
    const queries: Array<{ text: string; values: unknown[] | undefined }> = [];
    const client = {
      query: vi.fn(async (text: string, values?: unknown[]) => {
        queries.push({ text, values });
        return text.includes("select") ? { rows: [pgRow()] } : { rows: [] };
      })
    } as unknown as Client;
    const store = new PostgresDurableHandoffRecordStore(client);
    const expected = record();

    await store.insert(expected);
    await expect(
      store.findActiveById({ id: expected.id, tenant_id: expected.tenant_id })
    ).resolves.toEqual(expected);

    expect(queries).toHaveLength(2);
    expect(queries[0]?.text).toContain("insert into aiphabee_core.durable_agent_handoff");
    expect(queries[0]?.values).toHaveLength(20);
    expect(queries[0]?.values?.[1]).toBe("tenant-row8");
    expect(queries[0]?.values?.[2]).toBe("user-row8");
    expect(queries[0]?.values?.[13]).toBe(JSON.stringify(expected.approval));
    expect(queries[0]?.values?.[14]).toBe(JSON.stringify(expected.scan));
    expect(queries[0]?.values?.[15]).toBe(JSON.stringify(expected.provenance));
    expect(queries[0]?.values?.[16]).toBe(JSON.stringify(expected.evidence));
    expect(queries[1]?.text).toMatch(/where workspace_id = \$1[\s\S]*handoff_id = \$2/u);
    expect(queries[1]?.text).toContain("deleted_at is null");
    expect(queries[1]?.text).toContain("expires_at > now()");
    expect(queries[1]?.values).toEqual(["tenant-row8", expected.id]);
  });

  it("rejects malformed or classification-mismatched PostgreSQL metadata", async () => {
    const malformed = pgRow();
    malformed.scan = { ...malformed.scan, classification: "user_private" };
    const client = {
      query: vi.fn(async () => ({ rows: [malformed] }))
    } as unknown as Client;
    const store = new PostgresDurableHandoffRecordStore(client);

    await expect(
      store.findActiveById({ id: record().id, tenant_id: "tenant-row8" })
    ).rejects.toThrow("violates the v0 contract");
  });

  it("round-trips exact bytes and content type through the existing R2 contract", async () => {
    const objects = new Map<string, { bytes: Uint8Array; contentType: string }>();
    const bucket: DurableHandoffR2Bucket = {
      delete: vi.fn(async (key) => {
        objects.delete(key);
      }),
      get: vi.fn(async (key) => {
        const found = objects.get(key);
        return found === undefined
          ? null
          : {
              arrayBuffer: async () => found.bytes.slice().buffer,
              httpMetadata: { contentType: found.contentType }
            };
      }),
      put: vi.fn(async (key, value, options) => {
        objects.set(key, {
          bytes: value.slice(),
          contentType: options.httpMetadata.contentType
        });
      })
    };
    const store = new R2DurableHandoffObjectStore(bucket);
    const bytes = Uint8Array.from([1, 2, 3, 4]);

    await store.put("key", bytes, { contentType: "application/pdf" });
    const object = await store.get("key");
    expect(object?.contentType).toBe("application/pdf");
    expect(new Uint8Array(await object!.arrayBuffer())).toEqual(bytes);
    await store.delete("key");
    await expect(store.get("key")).resolves.toBeNull();
  });

  it("composes PostgreSQL metadata and R2 bytes without another storage service", () => {
    const client = { query: vi.fn() } as unknown as Client;
    const bucket = {
      delete: vi.fn(),
      get: vi.fn(),
      put: vi.fn()
    } as unknown as DurableHandoffR2Bucket;

    const stores = createWorkerDurableHandoffStores({ bucket, client });
    expect(stores.metadata_store).toBeInstanceOf(PostgresDurableHandoffRecordStore);
    expect(stores.object_store).toBeInstanceOf(R2DurableHandoffObjectStore);
  });
});
