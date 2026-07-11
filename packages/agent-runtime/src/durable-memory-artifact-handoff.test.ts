import { describe, expect, it, vi } from "vitest";

import {
  AGENT_RUNNER_SELECTION_VERSION,
  SANDBOX_BACKEND_REQUIRED_CAPABILITIES,
  validateSandboxWorkspacePath,
  type SandboxBackend,
  type SandboxBackendAccessGrant,
  type SandboxExecutionHandle,
  type SandboxLease,
  type SandboxWorkspacePath
} from "./index.js";
import {
  DURABLE_HANDOFF_ARTIFACT_MAX_BYTES,
  DURABLE_HANDOFF_MEMORY_MAX_BYTES,
  DurableHandoffError,
  handoffAndDestroySandboxOutputs,
  readDurableHandoff,
  type DurableHandoffApprovalAuthority,
  type DurableHandoffCandidate,
  type DurableHandoffObjectStore,
  type DurableHandoffRecord,
  type DurableHandoffRecordStore,
  type DurableHandoffSafetyScanner
} from "./durable-memory-artifact-handoff.js";

const NOW = "2026-07-11T06:00:00.000Z";

function workspacePath(value: string): SandboxWorkspacePath {
  const decision = validateSandboxWorkspacePath(value);
  if (decision.status !== "allowed") throw new Error("invalid fixture path");
  return decision.workspace_path;
}

function grant(runId = "run-row8"): SandboxBackendAccessGrant {
  return {
    layer: "research",
    owner: { kind: "run", run_id: runId },
    run_mode: "runner_remote",
    runner_family: "fastclaw",
    runner_id: "fastclaw.personal-v0",
    runner_selection_contract_version: AGENT_RUNNER_SELECTION_VERSION,
    source: "agent_runner_selection",
    tenant_id: "tenant-row8",
    user_id: "user-row8"
  } as unknown as SandboxBackendAccessGrant;
}

class HandoffBackendFixture implements SandboxBackend {
  readonly backend_id = "fixture.handoff-v0";
  readonly capabilities = SANDBOX_BACKEND_REQUIRED_CAPABILITIES;
  destroyCalls = 0;
  destroyFails = false;
  destroyed = false;
  readonly files = new Map<string, Uint8Array>();
  readonly readPaths: string[] = [];
  readonly lease: SandboxLease = {
    access_grant: grant(),
    backend_id: this.backend_id,
    lease_id: "lease-row8",
    status: "ready"
  };

  async create(): Promise<Awaited<ReturnType<SandboxBackend["create"]>>> {
    return { lease: this.lease, status: "created" };
  }

  execute(): SandboxExecutionHandle {
    return {
      closed: Promise.resolve(),
      async *[Symbol.asyncIterator]() {
        yield { event: "exit", exit_code: 0, sequence: 0, terminal: true } as const;
      }
    };
  }

  async writeFile(
    input: Parameters<SandboxBackend["writeFile"]>[0]
  ): Promise<Awaited<ReturnType<SandboxBackend["writeFile"]>>> {
    this.files.set(input.workspace_path, input.bytes);
    return {
      receipt: {
        bytes_written: input.bytes.byteLength,
        lease_id: input.lease.lease_id,
        workspace_path: input.workspace_path
      },
      status: "written"
    };
  }

  async readFile(
    input: Parameters<SandboxBackend["readFile"]>[0]
  ): Promise<Awaited<ReturnType<SandboxBackend["readFile"]>>> {
    this.readPaths.push(input.workspace_path);
    const bytes = this.destroyed ? undefined : this.files.get(input.workspace_path);
    return bytes === undefined
      ? { error_code: "file_not_found", retryable: false, status: "failed" }
      : {
          result: {
            bytes,
            lease_id: input.lease.lease_id,
            workspace_path: input.workspace_path
          },
          status: "read"
        };
  }

  async kill(
    input: Parameters<SandboxBackend["kill"]>[0]
  ): Promise<Awaited<ReturnType<SandboxBackend["kill"]>>> {
    return {
      lease_id: input.lease.lease_id,
      reason: input.reason,
      status: "already_terminal",
      terminal: true
    };
  }

  async destroy(
    input: Parameters<SandboxBackend["destroy"]>[0]
  ): Promise<Awaited<ReturnType<SandboxBackend["destroy"]>>> {
    this.destroyCalls += 1;
    if (this.destroyFails) {
      return {
        error_code: "destroy_failed",
        lease_id: input.lease.lease_id,
        retryable: true,
        status: "failed",
        terminal: false
      };
    }
    const status = this.destroyed ? "already_destroyed" : "destroyed";
    this.destroyed = true;
    this.files.clear();
    return { lease_id: input.lease.lease_id, status, terminal: true };
  }
}

class StoreFixture implements DurableHandoffRecordStore, DurableHandoffObjectStore {
  deleteFails = false;
  insertCommitsThenFails = false;
  insertFails = false;
  objectGetCalls: string[] = [];
  putFails = false;
  readonly objects = new Map<string, { bytes: Uint8Array; contentType: string }>();
  readonly records = new Map<string, DurableHandoffRecord>();

  async delete(key: string): Promise<void> {
    if (this.deleteFails) throw new Error("delete failed");
    this.objects.delete(key);
  }

  async get(key: string) {
    this.objectGetCalls.push(key);
    const object = this.objects.get(key);
    return object === undefined
      ? null
      : {
          arrayBuffer: async () => object.bytes.slice().buffer,
          contentType: object.contentType
        };
  }

  async put(key: string, bytes: Uint8Array, options: { contentType: string }): Promise<void> {
    if (this.putFails) throw new Error("put failed");
    this.objects.set(key, { bytes: bytes.slice(), contentType: options.contentType });
  }

  async findActiveById(input: { id: string; tenant_id: string }) {
    const record = this.records.get(input.id);
    return record?.tenant_id === input.tenant_id && record.deleted_at === null ? record : null;
  }

  async insert(record: DurableHandoffRecord): Promise<void> {
    if (this.insertCommitsThenFails) {
      this.records.set(record.id, record);
      throw new Error("ambiguous insert result");
    }
    if (this.insertFails) throw new Error("insert failed");
    this.records.set(record.id, record);
  }
}

function candidate(
  candidateId: string,
  kind: "artifact" | "memory" = "artifact"
): DurableHandoffCandidate {
  return {
    candidate_id: candidateId,
    classification: kind === "memory" ? "user_private" : "tenant_confidential",
    content_type: kind === "memory" ? "text/plain" : "application/pdf",
    evidence: { evidence_ids: [`evidence-${candidateId}`] },
    kind,
    provenance: {
      generated_at: NOW,
      runner_id: "fastclaw.personal-v0",
      source: "sandbox",
      source_run_id: "run-row8",
      tool_call_ids: [`tool-${candidateId}`]
    },
    retention_policy: kind === "memory" ? "user_managed" : "temporary_30d",
    workspace_path: workspacePath(`outputs/${candidateId}.bin`)
  };
}

function approvalAuthority(
  candidates: readonly DurableHandoffCandidate[],
  rejected = new Set<string>()
): DurableHandoffApprovalAuthority {
  return {
    authorize: vi.fn(async () => ({
      decisions: candidates.map((item) =>
        rejected.has(item.candidate_id)
          ? {
              approved_at: NOW,
              approver: "policy:artifact-v1",
              candidate_id: item.candidate_id,
              decision_id: `decision-${item.candidate_id}`,
              reason_code: "not_selected",
              status: "rejected" as const
            }
          : {
              approved_at: NOW,
              approver: "policy:artifact-v1",
              candidate_id: item.candidate_id,
              decision_id: `decision-${item.candidate_id}`,
              status: "approved" as const
            }
      ),
      run_id: "run-row8",
      tenant_id: "tenant-row8",
      user_id: "user-row8"
    }))
  };
}

function cleanScanner(): DurableHandoffSafetyScanner {
  return {
    scan: vi.fn(async (input) => ({
      classification: input.classification,
      engine: "fixture-scanner",
      scanned_at: NOW,
      signature_version: "fixture-v1",
      status: "clean" as const
    }))
  };
}

function handoffInput(input?: {
  approval?: DurableHandoffApprovalAuthority;
  backend?: HandoffBackendFixture;
  candidates?: DurableHandoffCandidate[];
  scanner?: DurableHandoffSafetyScanner;
  store?: StoreFixture;
}) {
  const backend = input?.backend ?? new HandoffBackendFixture();
  const candidates = input?.candidates ?? [candidate("report"), candidate("memory", "memory")];
  const store = input?.store ?? new StoreFixture();
  for (const item of candidates) {
    backend.files.set(item.workspace_path, new TextEncoder().encode(`bytes:${item.candidate_id}`));
  }
  return {
    approval_authority: input?.approval ?? approvalAuthority(candidates),
    backend,
    candidates,
    lease: backend.lease,
    metadata_store: store,
    now: () => new Date(NOW),
    object_store: store,
    scanner: input?.scanner ?? cleanScanner(),
    store
  };
}

describe("durable memory and artifact handoff", () => {
  it("persists only approved clean payloads with complete ownership and evidence, then destroys residual state", async () => {
    const input = handoffInput();
    const result = await handoffAndDestroySandboxOutputs(input);

    expect(result.release_safe).toBe(true);
    expect(result.items.map((item) => item.status)).toEqual(["persisted", "persisted"]);
    expect(input.store.records.size).toBe(2);
    expect(input.store.objects.size).toBe(2);
    for (const record of input.store.records.values()) {
      expect(record).toMatchObject({
        approval: { approver: "policy:artifact-v1" },
        byte_size: expect.any(Number),
        content_hash_sha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        contract_version: "2026-07-11.durable-memory-artifact-handoff.v0",
        evidence: { evidence_ids: [expect.stringMatching(/^evidence-/u)] },
        lease_id: "lease-row8",
        owner_user_id: "user-row8",
        provenance: { source: "sandbox", source_run_id: "run-row8" },
        run_id: "run-row8",
        scan: { engine: "fixture-scanner", status: "clean" },
        tenant_id: "tenant-row8"
      });
    }
    expect(input.backend.destroyCalls).toBe(1);
    expect(input.backend.destroyed).toBe(true);
    expect(input.backend.files.size).toBe(0);
    await expect(
      input.backend.readFile({
        lease: input.backend.lease,
        workspace_path: candidate("report").workspace_path
      })
    ).resolves.toMatchObject({ error_code: "file_not_found", status: "failed" });
  });

  it("does not read or persist an explicitly rejected candidate", async () => {
    const candidates = [candidate("approved"), candidate("rejected")];
    const input = handoffInput({
      approval: approvalAuthority(candidates, new Set(["rejected"])),
      candidates
    });
    const result = await handoffAndDestroySandboxOutputs(input);

    expect(result.items).toEqual([
      expect.objectContaining({ candidate_id: "approved", status: "persisted" }),
      {
        candidate_id: "rejected",
        reason_code: "approval_rejected",
        status: "rejected"
      }
    ]);
    expect(input.backend.readPaths).toEqual(["outputs/approved.bin"]);
    expect(input.store.records.size).toBe(1);
    expect(input.backend.destroyed).toBe(true);
  });

  it.each([
    ["memory", DURABLE_HANDOFF_MEMORY_MAX_BYTES + 1, "memory_too_large"],
    ["artifact", DURABLE_HANDOFF_ARTIFACT_MAX_BYTES + 1, "artifact_too_large"]
  ] as const)("rejects over-limit %s bytes before scanning or persistence", async (kind, size, reason) => {
    const item = candidate(`large-${kind}`, kind);
    const scanner = cleanScanner();
    const input = handoffInput({ candidates: [item], scanner });
    input.backend.files.set(item.workspace_path, new Uint8Array(size));

    const result = await handoffAndDestroySandboxOutputs(input);
    expect(result.items).toEqual([
      { candidate_id: item.candidate_id, reason_code: reason, status: "rejected" }
    ]);
    expect(scanner.scan).not.toHaveBeenCalled();
    expect(input.store.objects.size).toBe(0);
    expect(input.store.records.size).toBe(0);
    expect(input.backend.destroyed).toBe(true);
  });

  it("blocks unsafe and failed scans without durable writes", async () => {
    const candidates = [candidate("unsafe"), candidate("scan-error")];
    const scanner: DurableHandoffSafetyScanner = {
      scan: vi.fn(async (input) =>
        input.content_type === "application/pdf"
          ? {
              engine: "fixture-scanner",
              reason_code: "malware",
              scanned_at: NOW,
              signature_version: "fixture-v1",
              status: "unsafe" as const
            }
          : {
              engine: "fixture-scanner",
              reason_code: "unavailable",
              scanned_at: NOW,
              signature_version: "fixture-v1",
              status: "error" as const
            }
      )
    };
    candidates[1] = { ...candidates[1]!, content_type: "text/plain" };
    const input = handoffInput({ candidates, scanner });

    const result = await handoffAndDestroySandboxOutputs(input);
    expect(result.items).toEqual([
      { candidate_id: "unsafe", reason_code: "unsafe_payload", status: "rejected" },
      { candidate_id: "scan-error", reason_code: "scan_failed", status: "rejected" }
    ]);
    expect(input.store.objects.size).toBe(0);
    expect(input.store.records.size).toBe(0);
    expect(input.backend.destroyed).toBe(true);
  });

  it("fails a malformed approval contract before sandbox reads and still destroys", async () => {
    const candidates = [candidate("report")];
    const input = handoffInput({
      approval: {
        authorize: async () => ({
          decisions: [],
          run_id: "run-row8",
          tenant_id: "tenant-row8",
          user_id: "user-row8"
        })
      },
      candidates
    });

    await expect(handoffAndDestroySandboxOutputs(input)).rejects.toMatchObject({
      cleanup: { lease_id: "lease-row8", release_safe: true, status: "destroyed" },
      code: "APPROVAL_CONTRACT_INVALID"
    } satisfies Partial<DurableHandoffError>);
    expect(input.backend.readPaths).toEqual([]);
    expect(input.store.objects.size).toBe(0);
    expect(input.backend.destroyed).toBe(true);
  });

  it("compensates an object when metadata insert fails and reports failed compensation", async () => {
    const item = candidate("report");
    const compensated = new StoreFixture();
    compensated.insertFails = true;
    const first = handoffInput({ candidates: [item], store: compensated });
    const firstResult = await handoffAndDestroySandboxOutputs(first);
    expect(firstResult.items).toEqual([
      { candidate_id: "report", reason_code: "record_write_failed", status: "rejected" }
    ]);
    expect(compensated.objects.size).toBe(0);

    const cleanupRequired = new StoreFixture();
    cleanupRequired.insertFails = true;
    cleanupRequired.deleteFails = true;
    const second = handoffInput({
      backend: new HandoffBackendFixture(),
      candidates: [item],
      store: cleanupRequired
    });
    const secondResult = await handoffAndDestroySandboxOutputs(second);
    expect(secondResult.items).toEqual([
      expect.objectContaining({
        candidate_id: "report",
        reason_code: "object_compensation_failed",
        status: "cleanup_required"
      })
    ]);
    expect(secondResult.release_safe).toBe(false);
    expect(cleanupRequired.records.size).toBe(0);
    expect(cleanupRequired.objects.size).toBe(1);
    expect(second.backend.destroyed).toBe(true);
  });

  it("preserves a committed record/object when the metadata response is ambiguous", async () => {
    const store = new StoreFixture();
    store.insertCommitsThenFails = true;
    const input = handoffInput({ candidates: [candidate("report")], store });

    const result = await handoffAndDestroySandboxOutputs(input);
    expect(result.items).toEqual([
      expect.objectContaining({ candidate_id: "report", status: "persisted" })
    ]);
    expect(store.records.size).toBe(1);
    expect(store.objects.size).toBe(1);
    expect(input.backend.destroyed).toBe(true);
  });

  it("fails wrong-tenant and mismatched-prefix reads before object access", async () => {
    const input = handoffInput({ candidates: [candidate("report")] });
    const result = await handoffAndDestroySandboxOutputs(input);
    const persisted = result.items[0];
    if (persisted?.status !== "persisted") throw new Error("fixture did not persist");

    await expect(
      readDurableHandoff({
        id: persisted.record.id,
        metadata_store: input.store,
        object_store: input.store,
        tenant_id: "tenant-other"
      })
    ).resolves.toEqual({ status: "not_found" });
    expect(input.store.objectGetCalls).toEqual([]);

    input.store.records.set(persisted.record.id, {
      ...persisted.record,
      storage_key: "agent-handoff/v0/tenant-other/user/run/artifact/hash"
    });
    await expect(
      readDurableHandoff({
        id: persisted.record.id,
        metadata_store: input.store,
        object_store: input.store,
        tenant_id: "tenant-row8"
      })
    ).resolves.toEqual({ status: "not_found" });
    expect(input.store.objectGetCalls).toEqual([]);
  });

  it("reports destroy failure as not release-safe after handoff", async () => {
    const backend = new HandoffBackendFixture();
    backend.destroyFails = true;
    const input = handoffInput({ backend, candidates: [candidate("report")] });
    const result = await handoffAndDestroySandboxOutputs(input);

    expect(result.cleanup).toEqual({
      lease_id: "lease-row8",
      release_safe: false,
      status: "destroy_failed"
    });
    expect(result.release_safe).toBe(false);
    expect(backend.files.size).toBe(1);
  });
});
