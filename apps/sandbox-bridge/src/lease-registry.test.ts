import { describe, expect, it } from "vitest";

import {
  AGENT_RUNNER_SELECTION_VERSION,
  type SandboxBackendAccessGrant,
  type SandboxLease,
  type SandboxOwnership
} from "@aiphabee/agent-runtime";

import {
  handleSandboxLeaseRegistryRequest,
  snapshotSandboxGrant,
  type SandboxLeaseRecord,
  type SandboxLeaseRegistryStorage,
  type SandboxLeaseRegistryTransaction
} from "./lease-registry.js";

class MemoryStorage implements SandboxLeaseRegistryStorage {
  private transactionTail = Promise.resolve();
  private readonly values = new Map<string, unknown>();

  async delete(key: string): Promise<boolean> {
    return this.values.delete(key);
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.values.get(key) as T | undefined;
  }

  async put(key: string, value: unknown): Promise<void> {
    this.values.set(key, value);
  }

  async transaction<T>(
    closure: (transaction: SandboxLeaseRegistryTransaction) => Promise<T>
  ): Promise<T> {
    const previous = this.transactionTail;
    let release: (() => void) | undefined;
    this.transactionTail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await closure(this);
    } finally {
      release?.();
    }
  }
}

function grant(input: {
  owner?: SandboxOwnership;
  tenant?: string;
  user?: string;
} = {}): SandboxBackendAccessGrant {
  return {
    layer: "research",
    owner: input.owner ?? { kind: "run", run_id: "run-registry" },
    run_mode: "runner_remote",
    runner_family: "fastclaw",
    runner_id: "fastclaw.personal-v0",
    runner_selection_contract_version: AGENT_RUNNER_SELECTION_VERSION,
    source: "agent_runner_selection",
    tenant_id: input.tenant ?? "tenant-1",
    user_id: input.user ?? "user-1"
  } as unknown as SandboxBackendAccessGrant;
}

function lease(accessGrant = grant()): SandboxLease {
  return {
    access_grant: accessGrant,
    backend_id: "cloudflare.sandbox-v0",
    lease_id: "lease-registry",
    status: "ready"
  };
}

function request(path: string, body: unknown): Request {
  return new Request(`https://lease-registry.internal${path}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
}

describe("sandbox lease registry", () => {
  it("binds identity, latches kill during process start, and closes destroy idempotently", async () => {
    const storage = new MemoryStorage();
    const boundLease = lease();
    const record: SandboxLeaseRecord = {
      backend_id: boundLease.backend_id,
      binding: snapshotSandboxGrant(boundLease.access_grant),
      kill_requested: false,
      lease_id: boundLease.lease_id,
      provider_id: "provider-registry",
      session_id: "session-registry",
      status: "pending"
    };

    expect(
      (await handleSandboxLeaseRegistryRequest(storage, request("/reserve", { record }))).status
    ).toBe(204);
    expect(
      (await handleSandboxLeaseRegistryRequest(storage, request("/ready", { lease: boundLease })))
        .status
    ).toBe(204);
    const allowed = await handleSandboxLeaseRegistryRequest(
      storage,
      request("/authorize", { lease: boundLease })
    );
    expect(allowed.status).toBe(200);
    expect(await allowed.json()).toMatchObject({ status: "allowed" });

    const crossTenant = lease(grant({ tenant: "tenant-2" }));
    expect(
      (
        await handleSandboxLeaseRegistryRequest(
          storage,
          request("/authorize", { lease: crossTenant })
        )
      ).status
    ).toBe(409);
    for (const rejectedLease of [
      lease(grant({ user: "user-2" })),
      lease(grant({ owner: { kind: "run", run_id: "run-other" } })),
      { ...boundLease, backend_id: "other-backend" },
      { ...boundLease, lease_id: "lease-unknown" }
    ]) {
      expect(
        (
          await handleSandboxLeaseRegistryRequest(
            storage,
            request("/authorize", { lease: rejectedLease })
          )
        ).status
      ).toBe(409);
    }

    const idleKill = await handleSandboxLeaseRegistryRequest(
      storage,
      request("/kill", { lease: boundLease })
    );
    expect(idleKill.status).toBe(409);
    const process = await handleSandboxLeaseRegistryRequest(
      storage,
      request("/process/begin", { lease: boundLease, process_id: "process-1" })
    );
    expect(await process.json()).toMatchObject({
      record: { process_id: "process-1", process_state: "starting" },
      status: "reserved"
    });
    const kill = await handleSandboxLeaseRegistryRequest(
      storage,
      request("/kill", { lease: boundLease })
    );
    expect(await kill.json()).toEqual({
      process_id: "process-1",
      provider_id: "provider-registry",
      status: "reserved"
    });
    expect(
      (
        await handleSandboxLeaseRegistryRequest(
          storage,
          request("/process/begin", { lease: boundLease, process_id: "process-2" })
        )
      ).status
    ).toBe(409);
    const running = await handleSandboxLeaseRegistryRequest(
      storage,
      request("/process/running", { lease: boundLease, process_id: "process-1" })
    );
    expect(await running.json()).toEqual({ kill_requested: true });
    expect(
      (
        await handleSandboxLeaseRegistryRequest(
          storage,
          request("/kill/finish", { lease: boundLease })
        )
      ).status
    ).toBe(204);
    expect(
      (
        await handleSandboxLeaseRegistryRequest(
          storage,
          request("/authorize", { lease: boundLease })
        )
      ).status
    ).toBe(409);

    expect(
      (
        await handleSandboxLeaseRegistryRequest(
          storage,
          request("/destroy/begin", { lease: boundLease })
        )
      ).status
    ).toBe(200);
    expect(
      (
        await handleSandboxLeaseRegistryRequest(
          storage,
          request("/destroy/abort", { lease: boundLease })
        )
      ).status
    ).toBe(204);
    const repeatedKill = await handleSandboxLeaseRegistryRequest(
      storage,
      request("/kill", { lease: boundLease })
    );
    expect(await repeatedKill.json()).toEqual({ status: "already_terminal" });
    expect(
      (
        await handleSandboxLeaseRegistryRequest(
          storage,
          request("/destroy/begin", { lease: boundLease })
        )
      ).status
    ).toBe(200);
    expect(
      (
        await handleSandboxLeaseRegistryRequest(
          storage,
          request("/destroy/finish", { lease: boundLease })
        )
      ).status
    ).toBe(204);
    const repeated = await handleSandboxLeaseRegistryRequest(
      storage,
      request("/destroy/begin", { lease: boundLease })
    );
    expect(await repeated.json()).toEqual({ status: "already_destroyed" });
  });

  it("binds a session owner without accepting a run owner", async () => {
    const storage = new MemoryStorage();
    const sessionLease = lease(
      grant({ owner: { kind: "session", session_id: "session-owner" } })
    );
    const record: SandboxLeaseRecord = {
      backend_id: sessionLease.backend_id,
      binding: snapshotSandboxGrant(sessionLease.access_grant),
      kill_requested: false,
      lease_id: sessionLease.lease_id,
      provider_id: "provider-session",
      session_id: "session-provider",
      status: "pending"
    };
    await handleSandboxLeaseRegistryRequest(storage, request("/reserve", { record }));
    await handleSandboxLeaseRegistryRequest(storage, request("/ready", { lease: sessionLease }));
    expect(
      (
        await handleSandboxLeaseRegistryRequest(
          storage,
          request("/authorize", { lease: sessionLease })
        )
      ).status
    ).toBe(200);
    expect(
      (
        await handleSandboxLeaseRegistryRequest(
          storage,
          request("/authorize", { lease: lease() })
        )
      ).status
    ).toBe(409);
  });

  it("atomically admits only one concurrent process reservation", async () => {
    const storage = new MemoryStorage();
    const boundLease = lease();
    const record: SandboxLeaseRecord = {
      backend_id: boundLease.backend_id,
      binding: snapshotSandboxGrant(boundLease.access_grant),
      kill_requested: false,
      lease_id: boundLease.lease_id,
      provider_id: "provider-concurrent",
      session_id: "session-concurrent",
      status: "pending"
    };
    await handleSandboxLeaseRegistryRequest(storage, request("/reserve", { record }));
    await handleSandboxLeaseRegistryRequest(storage, request("/ready", { lease: boundLease }));

    const responses = await Promise.all([
      handleSandboxLeaseRegistryRequest(
        storage,
        request("/process/begin", { lease: boundLease, process_id: "process-a" })
      ),
      handleSandboxLeaseRegistryRequest(
        storage,
        request("/process/begin", { lease: boundLease, process_id: "process-b" })
      )
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
  });
});
