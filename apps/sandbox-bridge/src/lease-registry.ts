import type {
  SandboxBackendAccessGrant,
  SandboxLease
} from "@aiphabee/agent-runtime";

export interface SandboxLeaseBinding {
  layer: "research";
  owner: SandboxBackendAccessGrant["owner"];
  run_mode: "runner_remote";
  runner_family: "fastclaw";
  runner_id: "fastclaw.personal-v0";
  runner_selection_contract_version: SandboxBackendAccessGrant["runner_selection_contract_version"];
  source: "agent_runner_selection";
  tenant_id: string;
  user_id: string;
}

export interface SandboxLeaseRecord {
  backend_id: string;
  binding: SandboxLeaseBinding;
  destroy_resume_status?: "killed" | "ready";
  kill_requested: boolean;
  lease_id: string;
  process_id?: string;
  process_state?: "running" | "starting";
  provider_id: string;
  session_id: string;
  status: "destroyed" | "destroying" | "killed" | "pending" | "ready";
}

export type SandboxLeaseAuthorization =
  | { record: SandboxLeaseRecord; status: "allowed" }
  | { status: "blocked" };

export type SandboxLeaseKillReservation =
  | { status: "already_terminal" }
  | { process_id: string; provider_id: string; status: "reserved" };

export type SandboxLeaseDestroyReservation =
  | { status: "already_destroyed" }
  | { provider_id: string; recovery: "fresh" | "unknown"; status: "reserved" };

export interface SandboxLeaseProcessReservation {
  record: SandboxLeaseRecord;
  status: "reserved";
}

export interface SandboxLeaseRegistry {
  abortDestroy(lease: SandboxLease): Promise<void>;
  authorize(lease: SandboxLease): Promise<SandboxLeaseAuthorization>;
  beginProcess(
    lease: SandboxLease,
    processId: string
  ): Promise<SandboxLeaseProcessReservation | undefined>;
  beginDestroy(
    lease: SandboxLease
  ): Promise<SandboxLeaseDestroyReservation | undefined>;
  clearProcess(lease: SandboxLease, processId: string): Promise<void>;
  finishDestroy(lease: SandboxLease): Promise<void>;
  finishKill(lease: SandboxLease): Promise<void>;
  markProcessRunning(
    lease: SandboxLease,
    processId: string
  ): Promise<{ kill_requested: boolean }>;
  markReady(lease: SandboxLease): Promise<void>;
  remove(lease: SandboxLease): Promise<void>;
  requestKill(lease: SandboxLease): Promise<SandboxLeaseKillReservation | undefined>;
  reserve(record: SandboxLeaseRecord): Promise<void>;
}

export interface SandboxLeaseRegistryTransaction {
  delete(key: string): Promise<boolean>;
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
}

export interface SandboxLeaseRegistryStorage extends SandboxLeaseRegistryTransaction {
  transaction<T>(
    closure: (transaction: SandboxLeaseRegistryTransaction) => Promise<T>
  ): Promise<T>;
}

const RECORD_KEY = "lease";

export function snapshotSandboxGrant(grant: SandboxBackendAccessGrant): SandboxLeaseBinding {
  return {
    layer: grant.layer,
    owner:
      grant.owner.kind === "run"
        ? { kind: "run", run_id: grant.owner.run_id }
        : { kind: "session", session_id: grant.owner.session_id },
    run_mode: grant.run_mode,
    runner_family: grant.runner_family,
    runner_id: grant.runner_id,
    runner_selection_contract_version: grant.runner_selection_contract_version,
    source: grant.source,
    tenant_id: grant.tenant_id,
    user_id: grant.user_id
  };
}

function bindingMatches(left: SandboxLeaseBinding, right: SandboxLeaseBinding): boolean {
  return (
    left.layer === right.layer &&
    left.run_mode === right.run_mode &&
    left.runner_family === right.runner_family &&
    left.runner_id === right.runner_id &&
    left.runner_selection_contract_version === right.runner_selection_contract_version &&
    left.source === right.source &&
    left.tenant_id === right.tenant_id &&
    left.user_id === right.user_id &&
    left.owner.kind === right.owner.kind &&
    (left.owner.kind === "run"
      ? right.owner.kind === "run" && left.owner.run_id === right.owner.run_id
      : right.owner.kind === "session" && left.owner.session_id === right.owner.session_id)
  );
}

function recordMatchesLease(record: SandboxLeaseRecord, lease: SandboxLease): boolean {
  return (
    record.backend_id === lease.backend_id &&
    record.lease_id === lease.lease_id &&
    bindingMatches(record.binding, snapshotSandboxGrant(lease.access_grant))
  );
}

function blocked(): Response {
  return Response.json({ status: "blocked" }, { status: 409 });
}

export async function handleSandboxLeaseRegistryRequest(
  storage: SandboxLeaseRegistryStorage,
  request: Request
): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const path = new URL(request.url).pathname;
  const body = (await request.json()) as {
    lease?: SandboxLease;
    process_id?: string;
    record?: SandboxLeaseRecord;
  };
  return storage.transaction(async (storage) => {
    const current = await storage.get<SandboxLeaseRecord>(RECORD_KEY);

    if (path === "/reserve") {
      if (current !== undefined || body.record === undefined) return blocked();
      await storage.put(RECORD_KEY, body.record);
      return new Response(null, { status: 204 });
    }
    if (
      body.lease === undefined ||
      current === undefined ||
      !recordMatchesLease(current, body.lease)
    ) {
      return blocked();
    }
    if (path === "/authorize") {
      return current.status === "ready"
        ? Response.json({ record: current, status: "allowed" })
        : blocked();
    }
    if (path === "/ready" && current.status === "pending") {
      await storage.put(RECORD_KEY, { ...current, status: "ready" });
      return new Response(null, { status: 204 });
    }
    if (
      path === "/process/begin" &&
      current.status === "ready" &&
      current.process_id === undefined &&
      body.process_id !== undefined
    ) {
      const record: SandboxLeaseRecord = {
        ...current,
        process_id: body.process_id,
        process_state: "starting"
      };
      await storage.put(RECORD_KEY, record);
      return Response.json({ record, status: "reserved" });
    }
    if (
      path === "/process/running" &&
      current.status === "ready" &&
      current.process_id === body.process_id &&
      current.process_state === "starting"
    ) {
      await storage.put(RECORD_KEY, { ...current, process_state: "running" });
      return Response.json({ kill_requested: current.kill_requested });
    }
    if (path === "/process/clear" && current.process_id === body.process_id) {
      const { process_id: _processId, process_state: _processState, ...record } = current;
      await storage.put(RECORD_KEY, {
        ...record,
        destroy_resume_status:
          current.status === "destroying" && current.kill_requested
            ? "killed"
            : record.destroy_resume_status,
        status:
          current.status === "ready" && current.kill_requested
            ? "killed"
            : current.status
      });
      return new Response(null, { status: 204 });
    }
    if (path === "/kill") {
      if (current.status === "destroyed" || current.status === "killed") {
        return Response.json({ status: "already_terminal" });
      }
      if (
        current.status !== "ready" ||
        current.process_id === undefined ||
        current.process_state === undefined
      ) {
        return blocked();
      }
      await storage.put(RECORD_KEY, { ...current, kill_requested: true });
      return Response.json({
        process_id: current.process_id,
        provider_id: current.provider_id,
        status: "reserved"
      });
    }
    if (path === "/kill/finish" && current.status === "ready" && current.kill_requested) {
      const { process_id: _processId, process_state: _processState, ...record } = current;
      await storage.put(RECORD_KEY, {
        ...record,
        status: "killed"
      });
      return new Response(null, { status: 204 });
    }
    if (path === "/destroy/begin") {
      if (current.status === "destroyed") {
        return Response.json({ status: "already_destroyed" });
      }
      if (current.status === "destroying") {
        return Response.json({
          provider_id: current.provider_id,
          recovery: "unknown",
          status: "reserved"
        });
      }
      if (current.status !== "ready" && current.status !== "killed") return blocked();
      await storage.put(RECORD_KEY, {
        ...current,
        destroy_resume_status: current.status,
        status: "destroying"
      });
      return Response.json({
        provider_id: current.provider_id,
        recovery: "fresh",
        status: "reserved"
      });
    }
    if (path === "/destroy/finish" && current.status === "destroying") {
      const {
        destroy_resume_status: _resumeStatus,
        process_id: _processId,
        process_state: _processState,
        ...record
      } = current;
      await storage.put(RECORD_KEY, {
        ...record,
        kill_requested: true,
        status: "destroyed"
      });
      return new Response(null, { status: 204 });
    }
    if (
      path === "/destroy/abort" &&
      current.status === "destroying" &&
      current.destroy_resume_status !== undefined
    ) {
      const { destroy_resume_status, ...record } = current;
      await storage.put(RECORD_KEY, { ...record, status: destroy_resume_status });
      return new Response(null, { status: 204 });
    }
    if (path === "/remove" && current.status === "pending") {
      await storage.delete(RECORD_KEY);
      return new Response(null, { status: 204 });
    }
    return blocked();
  });
}

export class DurableObjectSandboxLeaseRegistry implements SandboxLeaseRegistry {
  constructor(private readonly namespace: DurableObjectNamespace) {}

  private stub(leaseId: string): DurableObjectStub {
    return this.namespace.get(this.namespace.idFromName(leaseId));
  }

  private async post<T>(leaseId: string, path: string, body: unknown): Promise<T | undefined> {
    const response = await this.stub(leaseId).fetch(`https://lease-registry.internal${path}`, {
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    if (!response.ok) return undefined;
    return response.status === 204 ? undefined : response.json<T>();
  }

  async reserve(record: SandboxLeaseRecord): Promise<void> {
    const response = await this.stub(record.lease_id).fetch(
      "https://lease-registry.internal/reserve",
      {
        body: JSON.stringify({ record }),
        headers: { "content-type": "application/json" },
        method: "POST"
      }
    );
    if (!response.ok) throw new Error("sandbox lease reservation failed");
  }

  async authorize(lease: SandboxLease): Promise<SandboxLeaseAuthorization> {
    return (
      (await this.post<SandboxLeaseAuthorization>(lease.lease_id, "/authorize", { lease })) ?? {
        status: "blocked"
      }
    );
  }

  async markReady(lease: SandboxLease): Promise<void> {
    await this.requireNoContent(lease, "/ready");
  }

  async beginProcess(
    lease: SandboxLease,
    processId: string
  ): Promise<SandboxLeaseProcessReservation | undefined> {
    return this.post(lease.lease_id, "/process/begin", {
      lease,
      process_id: processId
    });
  }

  async markProcessRunning(
    lease: SandboxLease,
    processId: string
  ): Promise<{ kill_requested: boolean }> {
    const result = await this.post<{ kill_requested: boolean }>(
      lease.lease_id,
      "/process/running",
      { lease, process_id: processId }
    );
    if (result === undefined) throw new Error("sandbox lease process binding failed");
    return result;
  }

  async clearProcess(lease: SandboxLease, processId: string): Promise<void> {
    await this.requireNoContent(lease, "/process/clear", { process_id: processId });
  }

  async requestKill(lease: SandboxLease): Promise<SandboxLeaseKillReservation | undefined> {
    return this.post(lease.lease_id, "/kill", { lease });
  }

  async finishKill(lease: SandboxLease): Promise<void> {
    await this.requireNoContent(lease, "/kill/finish");
  }

  async beginDestroy(lease: SandboxLease): Promise<SandboxLeaseDestroyReservation | undefined> {
    return this.post(lease.lease_id, "/destroy/begin", { lease });
  }

  async finishDestroy(lease: SandboxLease): Promise<void> {
    await this.requireNoContent(lease, "/destroy/finish");
  }

  async abortDestroy(lease: SandboxLease): Promise<void> {
    await this.requireNoContent(lease, "/destroy/abort");
  }

  async remove(lease: SandboxLease): Promise<void> {
    await this.requireNoContent(lease, "/remove");
  }

  private async requireNoContent(
    lease: SandboxLease,
    path: string,
    extra: Record<string, unknown> = {}
  ): Promise<void> {
    const response = await this.stub(lease.lease_id).fetch(`https://lease-registry.internal${path}`, {
      body: JSON.stringify({ lease, ...extra }),
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    if (!response.ok) throw new Error("sandbox lease registry transition failed");
  }
}
