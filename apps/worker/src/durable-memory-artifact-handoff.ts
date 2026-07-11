import type { Client } from "pg";

import {
  DURABLE_HANDOFF_CONTRACT_VERSION,
  type DurableHandoffClassification,
  type DurableHandoffEvidence,
  type DurableHandoffObject,
  type DurableHandoffObjectStore,
  type DurableHandoffProvenance,
  type DurableHandoffRecord,
  type DurableHandoffRecordStore,
  type DurableHandoffRetentionPolicy,
  type DurableHandoffScanResult
} from "@aiphabee/agent-runtime/durable-memory-artifact-handoff";

export interface DurableHandoffR2Object {
  arrayBuffer(): Promise<ArrayBuffer>;
  httpMetadata?: { contentType?: string };
}

export interface DurableHandoffR2Bucket {
  delete(key: string): Promise<void>;
  get(key: string): Promise<DurableHandoffR2Object | null>;
  put(
    key: string,
    value: Uint8Array,
    options: { httpMetadata: { contentType: string } }
  ): Promise<unknown>;
}

interface DurableHandoffPgRow {
  approval: unknown;
  byte_size: number | string;
  classification: string;
  content_hash_sha256: string;
  content_type: string;
  contract_version: string;
  created_at: Date | string;
  deleted_at: Date | string | null;
  evidence: unknown;
  expires_at: Date | string | null;
  handoff_id: string;
  kind: string;
  lease_id: string;
  owner_account_id: string;
  provenance: unknown;
  retention_policy: string;
  run_id: string;
  scan: unknown;
  storage_key: string;
  workspace_id: string;
}

const RECORD_SELECT = `
  select
    handoff_id,
    workspace_id,
    owner_account_id,
    run_id,
    lease_id,
    kind,
    storage_key,
    content_type,
    byte_size,
    content_hash_sha256,
    classification,
    retention_policy,
    expires_at,
    approval,
    scan,
    provenance,
    evidence,
    contract_version,
    deleted_at,
    created_at
  from aiphabee_core.durable_agent_handoff
`;

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function object(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`durable handoff ${name} metadata is malformed`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`durable handoff ${name} metadata is malformed`);
  }
  return value;
}

function stringArray(value: unknown, name: string, allowEmpty: boolean): string[] {
  if (
    !Array.isArray(value) ||
    (!allowEmpty && value.length === 0) ||
    value.some((item) => typeof item !== "string" || item.length === 0)
  ) {
    throw new Error(`durable handoff ${name} metadata is malformed`);
  }
  return value as string[];
}

function toRecord(row: DurableHandoffPgRow): DurableHandoffRecord {
  const approval = object(row.approval, "approval");
  const evidence = object(row.evidence, "evidence");
  const provenance = object(row.provenance, "provenance");
  const scan = object(row.scan, "scan");
  if (
    row.contract_version !== DURABLE_HANDOFF_CONTRACT_VERSION ||
    (row.kind !== "artifact" && row.kind !== "memory") ||
    (row.classification !== "public_derived" &&
      row.classification !== "tenant_confidential" &&
      row.classification !== "user_private") ||
    (row.retention_policy !== "temporary_30d" && row.retention_policy !== "user_managed") ||
    scan.status !== "clean" ||
    scan.classification !== row.classification ||
    provenance.source !== "sandbox" ||
    provenance.runner_id !== "fastclaw.personal-v0" ||
    provenance.source_run_id !== row.run_id
  ) {
    throw new Error("durable handoff row violates the v0 contract");
  }
  return {
    approval: {
      approved_at: string(approval.approved_at, "approval.approved_at"),
      approver: string(approval.approver, "approval.approver"),
      decision_id: string(approval.decision_id, "approval.decision_id")
    },
    byte_size: Number(row.byte_size),
    classification: row.classification as DurableHandoffClassification,
    content_hash_sha256: row.content_hash_sha256,
    content_type: row.content_type,
    contract_version: DURABLE_HANDOFF_CONTRACT_VERSION,
    created_at: iso(row.created_at),
    deleted_at: row.deleted_at === null ? null : iso(row.deleted_at),
    evidence: {
      evidence_ids: stringArray(evidence.evidence_ids, "evidence.evidence_ids", false) as [
        string,
        ...string[]
      ]
    } satisfies DurableHandoffEvidence,
    expires_at: row.expires_at === null ? null : iso(row.expires_at),
    id: row.handoff_id,
    kind: row.kind,
    lease_id: row.lease_id,
    owner_user_id: row.owner_account_id,
    provenance: {
      generated_at: string(provenance.generated_at, "provenance.generated_at"),
      runner_id: "fastclaw.personal-v0",
      source: "sandbox",
      source_run_id: row.run_id,
      tool_call_ids: stringArray(provenance.tool_call_ids, "provenance.tool_call_ids", true),
      workspace_path: string(provenance.workspace_path, "provenance.workspace_path")
    } satisfies DurableHandoffProvenance & { workspace_path: string },
    retention_policy: row.retention_policy as DurableHandoffRetentionPolicy,
    run_id: row.run_id,
    scan: {
      classification: row.classification as DurableHandoffClassification,
      engine: string(scan.engine, "scan.engine"),
      scanned_at: string(scan.scanned_at, "scan.scanned_at"),
      signature_version: string(scan.signature_version, "scan.signature_version"),
      status: "clean"
    } satisfies Extract<DurableHandoffScanResult, { status: "clean" }>,
    storage_key: row.storage_key,
    tenant_id: row.workspace_id
  };
}

export class PostgresDurableHandoffRecordStore implements DurableHandoffRecordStore {
  constructor(private readonly client: Client) {}

  async findActiveById(input: {
    id: string;
    tenant_id: string;
  }): Promise<DurableHandoffRecord | null> {
    const result = await this.client.query<DurableHandoffPgRow>(
      `${RECORD_SELECT}
       where workspace_id = $1
         and handoff_id = $2
         and deleted_at is null
         and (expires_at is null or expires_at > now())
       limit 1`,
      [input.tenant_id, input.id]
    );
    return result.rows[0] === undefined ? null : toRecord(result.rows[0]);
  }

  async insert(record: DurableHandoffRecord): Promise<void> {
    await this.client.query(
      `insert into aiphabee_core.durable_agent_handoff (
         handoff_id,
         workspace_id,
         owner_account_id,
         run_id,
         lease_id,
         kind,
         storage_key,
         content_type,
         byte_size,
         content_hash_sha256,
         classification,
         retention_policy,
         expires_at,
         approval,
         scan,
         provenance,
         evidence,
         contract_version,
         deleted_at,
         created_at
       ) values (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         $11, $12, $13, $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb,
         $18, $19, $20
       )`,
      [
        record.id,
        record.tenant_id,
        record.owner_user_id,
        record.run_id,
        record.lease_id,
        record.kind,
        record.storage_key,
        record.content_type,
        record.byte_size,
        record.content_hash_sha256,
        record.classification,
        record.retention_policy,
        record.expires_at,
        JSON.stringify(record.approval),
        JSON.stringify(record.scan),
        JSON.stringify(record.provenance),
        JSON.stringify(record.evidence),
        record.contract_version,
        record.deleted_at,
        record.created_at
      ]
    );
  }
}

export class R2DurableHandoffObjectStore implements DurableHandoffObjectStore {
  constructor(private readonly bucket: DurableHandoffR2Bucket) {}

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  async get(key: string): Promise<DurableHandoffObject | null> {
    const object = await this.bucket.get(key);
    if (object === null) return null;
    return {
      arrayBuffer: () => object.arrayBuffer(),
      contentType: object.httpMetadata?.contentType ?? null
    };
  }

  async put(key: string, bytes: Uint8Array, options: { contentType: string }): Promise<void> {
    await this.bucket.put(key, bytes, {
      httpMetadata: { contentType: options.contentType }
    });
  }
}

export function createWorkerDurableHandoffStores(input: {
  bucket: DurableHandoffR2Bucket;
  client: Client;
}): {
  metadata_store: DurableHandoffRecordStore;
  object_store: DurableHandoffObjectStore;
} {
  return {
    metadata_store: new PostgresDurableHandoffRecordStore(input.client),
    object_store: new R2DurableHandoffObjectStore(input.bucket)
  };
}
