import type {
  SandboxBackend,
  SandboxDestroyResult,
  SandboxLease,
  SandboxWorkspacePath
} from "./index.js";

export const DURABLE_HANDOFF_CONTRACT_VERSION =
  "2026-07-11.durable-memory-artifact-handoff.v0" as const;
export const DURABLE_HANDOFF_MAX_CANDIDATES = 16;
export const DURABLE_HANDOFF_MEMORY_MAX_BYTES = 64 * 1024;
export const DURABLE_HANDOFF_ARTIFACT_MAX_BYTES = 10 * 1024 * 1024;
export const ARTIFACT_SCANNER_CONTRACT_VERSION =
  "2026-07-11.authoritative-clamav.v0" as const;

export type DurableHandoffKind = "artifact" | "memory";
export type DurableHandoffClassification =
  | "public_derived"
  | "tenant_confidential"
  | "user_private";
export type DurableHandoffRetentionPolicy = "temporary_30d" | "user_managed";

export interface DurableHandoffProvenance {
  generated_at: string;
  runner_id: "fastclaw.personal-v0";
  source: "sandbox";
  source_run_id: string;
  tool_call_ids: readonly string[];
}

export interface DurableHandoffEvidence {
  evidence_ids: readonly [string, ...string[]];
}

export interface DurableHandoffCandidate {
  candidate_id: string;
  classification: DurableHandoffClassification;
  content_type: string;
  evidence: DurableHandoffEvidence;
  kind: DurableHandoffKind;
  provenance: DurableHandoffProvenance;
  retention_policy: DurableHandoffRetentionPolicy;
  workspace_path: SandboxWorkspacePath;
}

export type DurableHandoffApprovalDecision =
  | {
      approved_at: string;
      approver: string;
      candidate_id: string;
      decision_id: string;
      status: "approved";
    }
  | {
      approved_at: string;
      approver: string;
      candidate_id: string;
      decision_id: string;
      reason_code: string;
      status: "rejected";
    };

export interface DurableHandoffApprovalSet {
  decisions: readonly DurableHandoffApprovalDecision[];
  run_id: string;
  tenant_id: string;
  user_id: string;
}

export interface DurableHandoffApprovalAuthority {
  authorize(input: {
    candidates: readonly DurableHandoffCandidate[];
    run_id: string;
    tenant_id: string;
    user_id: string;
  }): Promise<DurableHandoffApprovalSet>;
}

export type DurableHandoffScanResult =
  | {
      classification: DurableHandoffClassification;
      engine: string;
      scanned_at: string;
      signature_version: string;
      status: "clean";
    }
  | {
      engine: string;
      reason_code: string;
      scanned_at: string;
      signature_version: string;
      status: "error";
    }
  | {
      engine: string;
      reason_code: string;
      scanned_at: string;
      signature_version: string;
      status: "unsafe";
    };

export interface DurableHandoffSafetyScanner {
  scan(input: {
    bytes: Uint8Array;
    classification: DurableHandoffClassification;
    content_hash_sha256: string;
    content_type: string;
    kind: DurableHandoffKind;
  }): Promise<DurableHandoffScanResult>;
}

export interface DurableHandoffObject {
  arrayBuffer(): Promise<ArrayBuffer>;
  contentType?: string | null;
}

export interface DurableHandoffObjectStore {
  delete(key: string): Promise<void>;
  get(key: string): Promise<DurableHandoffObject | null>;
  put(key: string, bytes: Uint8Array, options: { contentType: string }): Promise<void>;
}

export interface DurableHandoffRecord {
  approval: {
    approved_at: string;
    approver: string;
    decision_id: string;
  };
  byte_size: number;
  classification: DurableHandoffClassification;
  content_hash_sha256: string;
  content_type: string;
  contract_version: typeof DURABLE_HANDOFF_CONTRACT_VERSION;
  created_at: string;
  deleted_at: string | null;
  evidence: DurableHandoffEvidence;
  expires_at: string | null;
  id: string;
  kind: DurableHandoffKind;
  lease_id: string;
  owner_user_id: string;
  provenance: DurableHandoffProvenance & { workspace_path: string };
  retention_policy: DurableHandoffRetentionPolicy;
  run_id: string;
  scan: Extract<DurableHandoffScanResult, { status: "clean" }>;
  storage_key: string;
  tenant_id: string;
}

export interface DurableHandoffRecordStore {
  findActiveById(input: { id: string; tenant_id: string }): Promise<DurableHandoffRecord | null>;
  insert(record: DurableHandoffRecord): Promise<void>;
}

export type DurableHandoffItemResult =
  | {
      candidate_id: string;
      record: DurableHandoffRecord;
      status: "persisted";
    }
  | {
      candidate_id: string;
      reason_code:
        | "approval_rejected"
        | "artifact_too_large"
        | "empty_payload"
        | "file_read_failed"
        | "memory_too_large"
        | "object_write_failed"
        | "record_write_failed"
        | "scan_classification_mismatch"
        | "scan_failed"
        | "unsafe_payload";
      status: "rejected";
    }
  | {
      candidate_id: string;
      reason_code: "object_compensation_failed";
      status: "cleanup_required";
      storage_key: string;
    };

export interface DurableHandoffCleanupResult {
  lease_id: string;
  release_safe: boolean;
  status: "already_destroyed" | "destroy_failed" | "destroyed";
}

export interface DurableHandoffResult {
  cleanup: DurableHandoffCleanupResult;
  contract_version: typeof DURABLE_HANDOFF_CONTRACT_VERSION;
  items: readonly DurableHandoffItemResult[];
  release_safe: boolean;
  run_id: string;
  tenant_id: string;
  user_id: string;
}

export interface HandoffAndDestroySandboxOutputsInput {
  approval_authority: DurableHandoffApprovalAuthority;
  backend: SandboxBackend;
  candidates: readonly DurableHandoffCandidate[];
  lease: SandboxLease;
  metadata_store: DurableHandoffRecordStore;
  now: () => Date;
  object_store: DurableHandoffObjectStore;
  scanner: DurableHandoffSafetyScanner;
}

export type DurableHandoffErrorCode =
  | "APPROVAL_AUTHORITY_FAILED"
  | "APPROVAL_CONTRACT_INVALID"
  | "HANDOFF_PROCESSING_FAILED"
  | "INVALID_INPUT";

export class DurableHandoffError extends Error {
  readonly cleanup: DurableHandoffCleanupResult;
  readonly code: DurableHandoffErrorCode;

  constructor(
    code: DurableHandoffErrorCode,
    message: string,
    cleanup: DurableHandoffCleanupResult,
    options?: { cause?: unknown }
  ) {
    super(message, { cause: options?.cause });
    this.name = "DurableHandoffError";
    this.code = code;
    this.cleanup = cleanup;
  }
}

const SAFE_SEGMENT = /^[A-Za-z0-9._-]{1,128}$/u;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u;
const CONTENT_TYPE = /^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$/u;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/u;

function isSafeSegment(value: string): boolean {
  return SAFE_SEGMENT.test(value) && value !== "." && value !== "..";
}

function isOpaqueText(value: string, maxLength = 256): boolean {
  return (
    value.length > 0 &&
    value.length <= maxLength &&
    value.trim() === value &&
    !CONTROL_CHARACTER.test(value)
  );
}

function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value) && Number.isFinite(Date.parse(value));
}

function validateCandidate(candidate: DurableHandoffCandidate, runId: string): void {
  if (!isSafeSegment(candidate.candidate_id)) {
    throw new Error("candidate_id must be a safe opaque segment");
  }
  if (!CONTENT_TYPE.test(candidate.content_type) || candidate.content_type.length > 255) {
    throw new Error("content_type must be an explicit normalized media type");
  }
  if (
    candidate.kind !== "artifact" &&
    candidate.kind !== "memory"
  ) {
    throw new Error("kind is not allowed");
  }
  if (
    candidate.classification !== "public_derived" &&
    candidate.classification !== "tenant_confidential" &&
    candidate.classification !== "user_private"
  ) {
    throw new Error("classification is not allowed");
  }
  if (
    candidate.retention_policy !== "temporary_30d" &&
    candidate.retention_policy !== "user_managed"
  ) {
    throw new Error("retention policy is not allowed");
  }
  if (
    candidate.provenance.source !== "sandbox" ||
    candidate.provenance.runner_id !== "fastclaw.personal-v0" ||
    candidate.provenance.source_run_id !== runId ||
    !isIsoDate(candidate.provenance.generated_at)
  ) {
    throw new Error("provenance must match the run-owned FastClaw sandbox");
  }
  if (
    candidate.provenance.tool_call_ids.some((value) => !isOpaqueText(value)) ||
    candidate.evidence.evidence_ids.length === 0 ||
    candidate.evidence.evidence_ids.some((value) => !isOpaqueText(value))
  ) {
    throw new Error("evidence and tool references must be explicit opaque identifiers");
  }
}

function validateInput(input: HandoffAndDestroySandboxOutputsInput): {
  runId: string;
  tenantId: string;
  userId: string;
} {
  const grant = input.lease.access_grant;
  if (grant.owner.kind !== "run") {
    throw new Error("durable handoff requires a run-owned sandbox lease");
  }
  const runId = grant.owner.run_id;
  if (
    !isSafeSegment(runId) ||
    !isSafeSegment(grant.tenant_id) ||
    !isSafeSegment(grant.user_id) ||
    !isSafeSegment(input.lease.lease_id)
  ) {
    throw new Error("handoff ownership identifiers must be safe opaque segments");
  }
  if (
    input.candidates.length === 0 ||
    input.candidates.length > DURABLE_HANDOFF_MAX_CANDIDATES
  ) {
    throw new Error("handoff candidate count is outside the accepted bounds");
  }
  const seen = new Set<string>();
  for (const candidate of input.candidates) {
    validateCandidate(candidate, runId);
    if (seen.has(candidate.candidate_id)) {
      throw new Error("handoff candidate IDs must be unique");
    }
    seen.add(candidate.candidate_id);
  }
  return { runId, tenantId: grant.tenant_id, userId: grant.user_id };
}

function validateApprovalSet(
  approval: DurableHandoffApprovalSet,
  identity: { runId: string; tenantId: string; userId: string },
  candidates: readonly DurableHandoffCandidate[]
): Map<string, DurableHandoffApprovalDecision> {
  if (
    approval.run_id !== identity.runId ||
    approval.tenant_id !== identity.tenantId ||
    approval.user_id !== identity.userId ||
    approval.decisions.length !== candidates.length
  ) {
    throw new Error("approval identity or decision count does not match the handoff");
  }
  const expected = new Set(candidates.map((candidate) => candidate.candidate_id));
  const decisions = new Map<string, DurableHandoffApprovalDecision>();
  for (const decision of approval.decisions) {
    if (
      !expected.has(decision.candidate_id) ||
      decisions.has(decision.candidate_id) ||
      !isOpaqueText(decision.approver) ||
      !isOpaqueText(decision.decision_id) ||
      !isIsoDate(decision.approved_at) ||
      (decision.status === "rejected" && !isOpaqueText(decision.reason_code))
    ) {
      throw new Error("approval decision set is incomplete, duplicated or malformed");
    }
    decisions.set(decision.candidate_id, decision);
  }
  return decisions;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const cryptoRuntime = globalThis as unknown as {
    crypto: { subtle: { digest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer> } };
  };
  const digest = await cryptoRuntime.crypto.subtle.digest("SHA-256", Uint8Array.from(bytes));
  return `sha256:${Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0")
  ).join("")}`;
}

function storageKey(input: {
  hash: string;
  id: string;
  kind: DurableHandoffKind;
  runId: string;
  tenantId: string;
  userId: string;
}): string {
  return `agent-handoff/v0/${input.tenantId}/${input.userId}/${input.runId}/${input.kind}/${input.id}-${input.hash.slice("sha256:".length)}`;
}

function encodeUtf8(value: string): Uint8Array {
  const encoderRuntime = globalThis as unknown as {
    TextEncoder: new () => { encode(input: string): Uint8Array };
  };
  return new encoderRuntime.TextEncoder().encode(value);
}

function expiresAt(policy: DurableHandoffRetentionPolicy, createdAt: Date): string | null {
  return policy === "temporary_30d"
    ? new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1_000).toISOString()
    : null;
}

function maxBytes(kind: DurableHandoffKind): number {
  return kind === "memory"
    ? DURABLE_HANDOFF_MEMORY_MAX_BYTES
    : DURABLE_HANDOFF_ARTIFACT_MAX_BYTES;
}

async function cleanupSandbox(
  backend: SandboxBackend,
  lease: SandboxLease
): Promise<DurableHandoffCleanupResult> {
  let result: SandboxDestroyResult;
  try {
    result = await backend.destroy({ lease });
  } catch {
    return { lease_id: lease.lease_id, release_safe: false, status: "destroy_failed" };
  }
  if (result.status === "destroyed" || result.status === "already_destroyed") {
    return { lease_id: lease.lease_id, release_safe: true, status: result.status };
  }
  return { lease_id: lease.lease_id, release_safe: false, status: "destroy_failed" };
}

async function processApprovedCandidate(input: {
  approval: Extract<DurableHandoffApprovalDecision, { status: "approved" }>;
  candidate: DurableHandoffCandidate;
  handoff: HandoffAndDestroySandboxOutputsInput;
  identity: { runId: string; tenantId: string; userId: string };
}): Promise<DurableHandoffItemResult> {
  const read = await input.handoff.backend
    .readFile({ lease: input.handoff.lease, workspace_path: input.candidate.workspace_path })
    .catch(() => null);
  if (read === null || read.status !== "read") {
    return {
      candidate_id: input.candidate.candidate_id,
      reason_code: "file_read_failed",
      status: "rejected"
    };
  }
  const bytes = read.result.bytes;
  if (bytes.byteLength === 0) {
    return {
      candidate_id: input.candidate.candidate_id,
      reason_code: "empty_payload",
      status: "rejected"
    };
  }
  if (bytes.byteLength > maxBytes(input.candidate.kind)) {
    return {
      candidate_id: input.candidate.candidate_id,
      reason_code:
        input.candidate.kind === "memory" ? "memory_too_large" : "artifact_too_large",
      status: "rejected"
    };
  }
  const contentHash = await sha256(bytes);
  const scan = await input.handoff.scanner
    .scan({
      bytes,
      classification: input.candidate.classification,
      content_hash_sha256: contentHash,
      content_type: input.candidate.content_type,
      kind: input.candidate.kind
    })
    .catch(() => null);
  if (scan === null || scan.status === "error") {
    return {
      candidate_id: input.candidate.candidate_id,
      reason_code: "scan_failed",
      status: "rejected"
    };
  }
  if (scan.status === "unsafe") {
    return {
      candidate_id: input.candidate.candidate_id,
      reason_code: "unsafe_payload",
      status: "rejected"
    };
  }
  if (
    scan.classification !== input.candidate.classification ||
    !isOpaqueText(scan.engine) ||
    !isOpaqueText(scan.signature_version) ||
    !isIsoDate(scan.scanned_at)
  ) {
    return {
      candidate_id: input.candidate.candidate_id,
      reason_code: "scan_classification_mismatch",
      status: "rejected"
    };
  }

  const createdAt = input.handoff.now();
  const recordIdentityHash = await sha256(
    encodeUtf8(
      [
        input.identity.tenantId,
        input.identity.userId,
        input.identity.runId,
        input.candidate.candidate_id,
        input.candidate.kind,
        input.candidate.classification,
        input.candidate.content_type,
        input.candidate.retention_policy,
        input.approval.decision_id,
        createdAt.toISOString(),
        contentHash
      ].join("\u0000")
    )
  );
  const recordId = `handoff_${recordIdentityHash.slice("sha256:".length)}`;
  const key = storageKey({
    hash: contentHash,
    id: recordId,
    kind: input.candidate.kind,
    runId: input.identity.runId,
    tenantId: input.identity.tenantId,
    userId: input.identity.userId
  });
  const record: DurableHandoffRecord = {
    approval: {
      approved_at: input.approval.approved_at,
      approver: input.approval.approver,
      decision_id: input.approval.decision_id
    },
    byte_size: bytes.byteLength,
    classification: input.candidate.classification,
    content_hash_sha256: contentHash,
    content_type: input.candidate.content_type,
    contract_version: DURABLE_HANDOFF_CONTRACT_VERSION,
    created_at: createdAt.toISOString(),
    deleted_at: null,
    evidence: input.candidate.evidence,
    expires_at: expiresAt(input.candidate.retention_policy, createdAt),
    id: recordId,
    kind: input.candidate.kind,
    lease_id: input.handoff.lease.lease_id,
    owner_user_id: input.identity.userId,
    provenance: {
      ...input.candidate.provenance,
      workspace_path: input.candidate.workspace_path
    },
    retention_policy: input.candidate.retention_policy,
    run_id: input.identity.runId,
    scan,
    storage_key: key,
    tenant_id: input.identity.tenantId
  };

  try {
    await input.handoff.object_store.put(key, bytes, {
      contentType: input.candidate.content_type
    });
  } catch {
    try {
      await input.handoff.object_store.delete(key);
    } catch {
      return {
        candidate_id: input.candidate.candidate_id,
        reason_code: "object_compensation_failed",
        status: "cleanup_required",
        storage_key: key
      };
    }
    return {
      candidate_id: input.candidate.candidate_id,
      reason_code: "object_write_failed",
      status: "rejected"
    };
  }
  try {
    await input.handoff.metadata_store.insert(record);
  } catch {
    let existing: DurableHandoffRecord | null;
    try {
      existing = await input.handoff.metadata_store.findActiveById({
        id: record.id,
        tenant_id: record.tenant_id
      });
    } catch {
      return {
        candidate_id: input.candidate.candidate_id,
        reason_code: "object_compensation_failed",
        status: "cleanup_required",
        storage_key: key
      };
    }
    if (
      existing !== null &&
      existing.storage_key === record.storage_key &&
      existing.content_hash_sha256 === record.content_hash_sha256 &&
      existing.owner_user_id === record.owner_user_id &&
      existing.run_id === record.run_id
    ) {
      return {
        candidate_id: input.candidate.candidate_id,
        record: existing,
        status: "persisted"
      };
    }
    if (existing !== null) {
      return {
        candidate_id: input.candidate.candidate_id,
        reason_code: "object_compensation_failed",
        status: "cleanup_required",
        storage_key: key
      };
    }
    try {
      await input.handoff.object_store.delete(key);
    } catch {
      return {
        candidate_id: input.candidate.candidate_id,
        reason_code: "object_compensation_failed",
        status: "cleanup_required",
        storage_key: key
      };
    }
    return {
      candidate_id: input.candidate.candidate_id,
      reason_code: "record_write_failed",
      status: "rejected"
    };
  }
  return { candidate_id: input.candidate.candidate_id, record, status: "persisted" };
}

export async function handoffAndDestroySandboxOutputs(
  input: HandoffAndDestroySandboxOutputsInput
): Promise<DurableHandoffResult> {
  let identity: { runId: string; tenantId: string; userId: string };
  try {
    identity = validateInput(input);
  } catch (cause) {
    const cleanup = await cleanupSandbox(input.backend, input.lease);
    throw new DurableHandoffError("INVALID_INPUT", "durable handoff input is invalid", cleanup, {
      cause
    });
  }

  let approval: DurableHandoffApprovalSet;
  try {
    approval = await input.approval_authority.authorize({
      candidates: input.candidates,
      run_id: identity.runId,
      tenant_id: identity.tenantId,
      user_id: identity.userId
    });
  } catch (cause) {
    const cleanup = await cleanupSandbox(input.backend, input.lease);
    throw new DurableHandoffError(
      "APPROVAL_AUTHORITY_FAILED",
      "durable handoff approval authority failed",
      cleanup,
      { cause }
    );
  }

  let decisions: Map<string, DurableHandoffApprovalDecision>;
  try {
    decisions = validateApprovalSet(approval, identity, input.candidates);
  } catch (cause) {
    const cleanup = await cleanupSandbox(input.backend, input.lease);
    throw new DurableHandoffError(
      "APPROVAL_CONTRACT_INVALID",
      "durable handoff approval contract is invalid",
      cleanup,
      { cause }
    );
  }

  const items: DurableHandoffItemResult[] = [];
  let processingCause: unknown;
  try {
    for (const candidate of input.candidates) {
      const decision = decisions.get(candidate.candidate_id)!;
      if (decision.status === "rejected") {
        items.push({
          candidate_id: candidate.candidate_id,
          reason_code: "approval_rejected",
          status: "rejected"
        });
        continue;
      }
      items.push(
        await processApprovedCandidate({ approval: decision, candidate, handoff: input, identity })
      );
    }
  } catch (cause) {
    processingCause = cause;
  }

  const cleanup = await cleanupSandbox(input.backend, input.lease);
  if (processingCause !== undefined) {
    throw new DurableHandoffError(
      "HANDOFF_PROCESSING_FAILED",
      "durable handoff processing failed",
      cleanup,
      { cause: processingCause }
    );
  }
  return {
    cleanup,
    contract_version: DURABLE_HANDOFF_CONTRACT_VERSION,
    items,
    release_safe:
      cleanup.release_safe && items.every((item) => item.status !== "cleanup_required"),
    run_id: identity.runId,
    tenant_id: identity.tenantId,
    user_id: identity.userId
  };
}

export async function readDurableHandoff(input: {
  id: string;
  metadata_store: DurableHandoffRecordStore;
  object_store: DurableHandoffObjectStore;
  tenant_id: string;
}): Promise<
  | { bytes: Uint8Array; record: DurableHandoffRecord; status: "found" }
  | { status: "not_found" }
> {
  if (!isSafeSegment(input.id) || !isSafeSegment(input.tenant_id)) {
    return { status: "not_found" };
  }
  const record = await input.metadata_store.findActiveById({
    id: input.id,
    tenant_id: input.tenant_id
  });
  if (
    record === null ||
    record.tenant_id !== input.tenant_id ||
    !record.storage_key.startsWith(`agent-handoff/v0/${input.tenant_id}/`)
  ) {
    return { status: "not_found" };
  }
  const object = await input.object_store.get(record.storage_key);
  if (object === null) return { status: "not_found" };
  return {
    bytes: new Uint8Array(await object.arrayBuffer()),
    record,
    status: "found"
  };
}
