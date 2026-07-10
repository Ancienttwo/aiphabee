import { describe, expect, it, vi } from "vitest";

import {
  AGENT_RUNNER_SELECTION_VERSION,
  validateSandboxWorkspacePath,
  type SandboxBackendAccessGrant,
  type SandboxLease,
  type SandboxOwnership,
  type SandboxWorkspacePath
} from "@aiphabee/agent-runtime";

import {
  CloudflareSandboxBackend,
  type CloudflareSandboxHandle
} from "./cloudflare-sandbox-backend.js";
import {
  snapshotSandboxGrant,
  type SandboxLeaseAuthorization,
  type SandboxLeaseDestroyReservation,
  type SandboxLeaseKillReservation,
  type SandboxLeaseProcessReservation,
  type SandboxLeaseRecord,
  type SandboxLeaseRegistry
} from "./lease-registry.js";

function grant(input: {
  owner?: SandboxOwnership;
  tenant?: string;
  user?: string;
} = {}): SandboxBackendAccessGrant {
  return {
    layer: "research",
    owner: input.owner ?? { kind: "run", run_id: "run-adapter" },
    run_mode: "runner_remote",
    runner_family: "fastclaw",
    runner_id: "fastclaw.personal-v0",
    runner_selection_contract_version: AGENT_RUNNER_SELECTION_VERSION,
    source: "agent_runner_selection",
    tenant_id: input.tenant ?? "tenant-1",
    user_id: input.user ?? "user-1"
  } as unknown as SandboxBackendAccessGrant;
}

class MemoryLeaseRegistry implements SandboxLeaseRegistry {
  failBeginDestroy = false;
  failFinishDestroy = false;
  failRequestKill = false;
  record: SandboxLeaseRecord | undefined;

  private matches(lease: SandboxLease): boolean {
    return (
      this.record?.lease_id === lease.lease_id &&
      this.record.backend_id === lease.backend_id &&
      JSON.stringify(this.record.binding) === JSON.stringify(snapshotSandboxGrant(lease.access_grant))
    );
  }

  async reserve(record: SandboxLeaseRecord): Promise<void> {
    if (this.record !== undefined) throw new Error("duplicate lease");
    this.record = record;
  }

  async authorize(lease: SandboxLease): Promise<SandboxLeaseAuthorization> {
    return this.matches(lease) && this.record?.status === "ready"
      ? { record: this.record, status: "allowed" }
      : { status: "blocked" };
  }

  async markReady(lease: SandboxLease): Promise<void> {
    if (!this.matches(lease) || this.record === undefined) throw new Error("lease mismatch");
    this.record = { ...this.record, status: "ready" };
  }

  async beginProcess(
    lease: SandboxLease,
    processId: string
  ): Promise<SandboxLeaseProcessReservation | undefined> {
    if (
      !this.matches(lease) ||
      this.record === undefined ||
      this.record.status !== "ready" ||
      this.record.process_id !== undefined
    ) {
      return undefined;
    }
    this.record = {
      ...this.record,
      process_id: processId,
      process_state: "starting"
    };
    return { record: this.record, status: "reserved" };
  }

  async markProcessRunning(
    lease: SandboxLease,
    processId: string
  ): Promise<{ kill_requested: boolean }> {
    if (
      !this.matches(lease) ||
      this.record === undefined ||
      this.record.status !== "ready" ||
      this.record.process_id !== processId ||
      this.record.process_state !== "starting"
    ) {
      throw new Error("lease mismatch");
    }
    this.record = { ...this.record, process_state: "running" };
    return { kill_requested: this.record.kill_requested };
  }

  async clearProcess(lease: SandboxLease, processId: string): Promise<void> {
    if (!this.matches(lease) || this.record?.process_id !== processId) return;
    const { process_id: _processId, process_state: _processState, ...record } = this.record;
    this.record = {
      ...record,
      destroy_resume_status:
        this.record.status === "destroying" && this.record.kill_requested
          ? "killed"
          : record.destroy_resume_status,
      status:
        this.record.status === "ready" && this.record.kill_requested
          ? "killed"
          : this.record.status
    };
  }

  async requestKill(lease: SandboxLease): Promise<SandboxLeaseKillReservation | undefined> {
    if (this.failRequestKill) throw new Error("registry unavailable");
    if (!this.matches(lease) || this.record === undefined) return undefined;
    if (this.record.status === "destroyed" || this.record.status === "killed") {
      return { status: "already_terminal" };
    }
    if (
      this.record.status !== "ready" ||
      this.record.process_id === undefined ||
      this.record.process_state === undefined
    ) {
      return undefined;
    }
    const processId = this.record.process_id;
    const providerId = this.record.provider_id;
    this.record = { ...this.record, kill_requested: true };
    return {
      process_id: processId,
      provider_id: providerId,
      status: "reserved"
    };
  }

  async finishKill(lease: SandboxLease): Promise<void> {
    if (!this.matches(lease) || this.record?.status !== "ready") {
      throw new Error("lease mismatch");
    }
    const { process_id: _processId, process_state: _processState, ...record } = this.record;
    this.record = { ...record, status: "killed" };
  }

  async beginDestroy(lease: SandboxLease): Promise<SandboxLeaseDestroyReservation | undefined> {
    if (this.failBeginDestroy) throw new Error("registry unavailable");
    if (!this.matches(lease) || this.record === undefined) return undefined;
    if (this.record.status === "destroyed") return { status: "already_destroyed" };
    if (this.record.status === "destroying") {
      return {
        provider_id: this.record.provider_id,
        recovery: "unknown",
        status: "reserved"
      };
    }
    if (this.record.status !== "ready" && this.record.status !== "killed") return undefined;
    this.record = {
      ...this.record,
      destroy_resume_status: this.record.status,
      status: "destroying"
    };
    return {
      provider_id: this.record.provider_id,
      recovery: "fresh",
      status: "reserved"
    };
  }

  async finishDestroy(lease: SandboxLease): Promise<void> {
    if (this.failFinishDestroy) throw new Error("registry unavailable");
    if (!this.matches(lease) || this.record === undefined) throw new Error("lease mismatch");
    const {
      destroy_resume_status: _resumeStatus,
      process_id: _processId,
      process_state: _processState,
      ...record
    } = this.record;
    this.record = { ...record, status: "destroyed" };
  }

  async abortDestroy(lease: SandboxLease): Promise<void> {
    if (
      !this.matches(lease) ||
      this.record === undefined ||
      this.record.destroy_resume_status === undefined
    ) {
      throw new Error("lease mismatch");
    }
    const { destroy_resume_status, ...record } = this.record;
    this.record = { ...record, status: destroy_resume_status };
  }

  async remove(lease: SandboxLease): Promise<void> {
    if (!this.matches(lease) || this.record?.status !== "pending") {
      throw new Error("lease mismatch");
    }
    this.record = undefined;
  }
}

class FakeSandbox implements CloudflareSandboxHandle {
  readonly files = new Map<string, Uint8Array>();
  destroyed = false;
  destroyBarrier: Promise<void> | undefined;
  destroys = 0;
  failDestroy = false;
  failCreateSession = false;
  failProcessKill = false;
  failProcessWait = false;
  failProviderKill = false;
  failStart = false;
  emitStreamError = false;
  killed: string[] = [];
  outputChunks: Array<["stderr" | "stdout", string]> = [
    ["stdout", "out"],
    ["stderr", "err"]
  ];
  resolvedSessions: string[] = [];
  sessions: string[] = [];
  startBarrier: Promise<void> | undefined;
  private startObservedResolve: (() => void) | undefined;
  readonly startObserved = new Promise<void>((resolve) => {
    this.startObservedResolve = resolve;
  });
  starts = 0;

  async createSession(options: { id: string }): Promise<void> {
    if (this.failCreateSession) throw new Error("session create failed");
    this.sessions.push(options.id);
  }

  async destroy(): Promise<void> {
    this.destroys += 1;
    await this.destroyBarrier;
    if (this.failDestroy) throw new Error("destroy failed");
    this.destroyed = true;
  }

  async killProcess(processId: string): Promise<void> {
    if (this.failProviderKill) throw new Error("provider kill failed");
    this.killed.push(processId);
  }

  async getSession(sessionId: string) {
    this.resolvedSessions.push(sessionId);
    return { startProcess: this.startProcess.bind(this) };
  }

  async startProcess(
    _command: string,
    options: {
      onError(error: Error): void;
      onExit(code: number | null): void;
      onOutput(stream: "stderr" | "stdout", data: string): void;
      processId: string;
    }
  ) {
    this.starts += 1;
    this.startObservedResolve?.();
    await this.startBarrier;
    if (this.failStart) throw new Error("start failed");
    for (const [stream, data] of this.outputChunks) options.onOutput(stream, data);
    if (this.emitStreamError) options.onError(new Error("stream failed"));
    options.onExit(0);
    return {
      id: options.processId,
      kill: async () => {
        if (this.failProcessKill) throw new Error("process kill failed");
        this.killed.push(options.processId);
      },
      waitForExit: async () => {
        if (this.failProcessWait) throw new Error("process wait failed");
        return 0;
      }
    };
  }

  async writeFile(
    path: string,
    content: ReadableStream<Uint8Array>
  ): Promise<{ success: boolean }> {
    const reader = content.getReader();
    const chunks: number[] = [];
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      chunks.push(...result.value);
    }
    this.files.set(path, Uint8Array.from(chunks));
    return { success: true };
  }

  async readFile(path: string): Promise<{ content: ReadableStream<Uint8Array>; success: true }> {
    const bytes = this.files.get(path);
    if (bytes === undefined) throw new Error("not found");
    return {
      content: new ReadableStream({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        }
      }),
      success: true
    };
  }
}

describe("CloudflareSandboxBackend", () => {
  it("runs an isolated create/stream/file/kill/destroy lifecycle", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const ids = ["lease-adapter", "process-adapter"];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => `'${value}'`
    });

    const created = await backend.create({ access_grant: grant() });
    expect(created.status).toBe("created");
    if (created.status !== "created") throw new Error("adapter fixture create failed");
    const lease = created.lease;
    expect(registry.record).toMatchObject({
      binding: { tenant_id: "tenant-1", user_id: "user-1" },
      status: "ready"
    });

    const events = [];
    for await (const event of backend.execute({ argv: ["printf", "ok"], lease })) {
      events.push(event);
    }
    expect(events.map((event) => event.event)).toEqual(["output", "output", "exit"]);
    expect(sandbox.resolvedSessions).toEqual(["session-lease-adapter"]);
    expect(events.slice(0, 2).map((event) => "classification" in event && event.classification)).toEqual([
      "untrusted_process_output",
      "untrusted_process_output"
    ]);

    const path = validateSandboxWorkspacePath("artifacts/result.bin");
    if (path.status !== "allowed") throw new Error("fixture path rejected");
    const bytes = Uint8Array.from([0, 1, 2, 255]);
    await expect(
      backend.writeFile({
        bytes,
        lease,
        workspace_path: "../../etc/passwd" as unknown as SandboxWorkspacePath
      })
    ).resolves.toMatchObject({
      error_code: "file_write_failed",
      retryable: false,
      status: "failed"
    });
    expect(sandbox.files).toEqual(new Map());
    await expect(
      backend.writeFile({ bytes, lease, workspace_path: path.workspace_path })
    ).resolves.toMatchObject({ status: "written" });
    await expect(
      backend.readFile({ lease, workspace_path: path.workspace_path })
    ).resolves.toMatchObject({ result: { bytes }, status: "read" });

    registry.record = {
      ...registry.record!,
      process_id: "process-active",
      process_state: "running"
    };
    await expect(backend.kill({ lease, reason: "kill_switch" })).resolves.toMatchObject({
      status: "killed",
      terminal: true
    });
    expect(sandbox.killed).toContain("process-active");
    await expect(backend.destroy({ lease })).resolves.toMatchObject({ status: "destroyed" });
    await expect(backend.destroy({ lease })).resolves.toMatchObject({
      status: "already_destroyed"
    });
  });

  it("blocks a cross-tenant lease before any provider operation", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => "lease-isolation",
      shellQuote: (value) => value
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");
    const foreignLease = {
      ...created.lease,
      access_grant: grant({ tenant: "tenant-2" })
    };
    const events = [];
    for await (const event of backend.execute({ argv: ["true"], lease: foreignLease })) {
      events.push(event);
    }
    expect(events).toEqual([
      expect.objectContaining({
        error_code: "execute_failed",
        event: "failed",
        retryable: false
      })
    ]);
    expect(sandbox.starts).toBe(0);
    expect(sandbox.killed).toEqual([]);
  });

  it("latches kill while the provider process is starting", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const ids = ["lease-kill-race", "process-kill-race"];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => value
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");

    await expect(
      backend.kill({ lease: created.lease, reason: "client_cancelled" })
    ).resolves.toMatchObject({ error_code: "kill_failed", retryable: false, terminal: false });
    expect(registry.record?.kill_requested).toBe(false);

    let releaseStart: (() => void) | undefined;
    sandbox.startBarrier = new Promise<void>((resolve) => {
      releaseStart = resolve;
    });
    sandbox.failProviderKill = true;
    const eventsPromise = (async () => {
      const events = [];
      for await (const event of backend.execute({
        argv: ["sleep", "10"],
        lease: created.lease
      })) {
        events.push(event);
      }
      return events;
    })();
    await sandbox.startObserved;
    await expect(
      backend.kill({ lease: created.lease, reason: "client_cancelled" })
    ).resolves.toMatchObject({ error_code: "kill_failed", retryable: true, terminal: false });
    expect(registry.record).toMatchObject({
      kill_requested: true,
      process_state: "starting"
    });
    releaseStart?.();
    const events = await eventsPromise;
    expect(sandbox.killed).toContain("process-kill-race");
    expect(registry.record?.status).toBe("killed");
    expect(events.at(-1)).toMatchObject({ event: "exit", terminal: true });
  });

  it("keeps provider and destroy failures explicit without terminal fabrication", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const ids = [
      "lease-provider-failure",
      "process-start-failure",
      "process-stream-failure"
    ];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => value
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");

    sandbox.failStart = true;
    const events = [];
    for await (const event of backend.execute({ argv: ["false"], lease: created.lease })) {
      events.push(event);
    }
    expect(events).toEqual([
      expect.objectContaining({
        error_code: "execute_failed",
        event: "failed",
        retryable: true,
        terminal: true
      })
    ]);

    sandbox.failStart = false;
    sandbox.emitStreamError = true;
    const streamEvents = [];
    for await (const event of backend.execute({ argv: ["true"], lease: created.lease })) {
      streamEvents.push(event);
    }
    expect(streamEvents.at(-1)).toMatchObject({
      error_code: "execute_failed",
      event: "failed",
      terminal: true
    });
    expect(streamEvents.filter((event) => event.terminal)).toHaveLength(1);

    registry.record = {
      ...registry.record!,
      process_id: "process-kill-failure",
      process_state: "running"
    };
    sandbox.failProviderKill = true;
    await expect(backend.kill({ lease: created.lease, reason: "kill_switch" })).resolves.toMatchObject(
      { error_code: "kill_failed", retryable: true, terminal: false }
    );
    expect(registry.record).toMatchObject({ kill_requested: true, status: "ready" });

    sandbox.failDestroy = true;
    await expect(backend.destroy({ lease: created.lease })).resolves.toMatchObject({
      error_code: "destroy_failed",
      retryable: true,
      terminal: false
    });
    expect(registry.record?.status).toBe("ready");
    sandbox.failDestroy = false;
    await expect(backend.destroy({ lease: created.lease })).resolves.toMatchObject({
      status: "destroyed",
      terminal: true
    });
  });

  it("does not destroy an existing provider when lease reservation collides", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => "lease-collision",
      shellQuote: (value) => value
    });
    await expect(backend.create({ access_grant: grant() })).resolves.toMatchObject({
      status: "created"
    });
    await expect(backend.create({ access_grant: grant() })).resolves.toMatchObject({
      error_code: "create_failed",
      status: "failed"
    });
    expect(sandbox.destroyed).toBe(false);
    expect(sandbox.sessions).toHaveLength(1);
  });

  it("retains the pending lease record when failed create cleanup is unconfirmed", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    sandbox.failCreateSession = true;
    sandbox.failDestroy = true;
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => "lease-create-cleanup",
      shellQuote: (value) => value
    });

    await expect(backend.create({ access_grant: grant() })).resolves.toMatchObject({
      error_code: "create_failed",
      status: "failed"
    });
    expect(registry.record).toMatchObject({
      lease_id: "lease-create-cleanup",
      status: "pending"
    });
    expect(sandbox.destroys).toBe(1);
  });

  it("retains the process binding when provider termination cannot be confirmed", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    sandbox.emitStreamError = true;
    sandbox.failProcessKill = true;
    sandbox.failProcessWait = true;
    const ids = ["lease-uncertain-process", "process-uncertain"];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => value
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");

    const events = [];
    for await (const event of backend.execute({ argv: ["sleep", "10"], lease: created.lease })) {
      events.push(event);
    }
    expect(events.at(-1)).toMatchObject({
      error_code: "execute_failed",
      event: "failed",
      terminal: true
    });
    expect(registry.record?.process_id).toBe("process-uncertain");
  });

  it("rejects a second execution before starting another provider process", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const ids = ["lease-single-process", "process-second"];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => value
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");
    await registry.beginProcess(created.lease, "process-first");
    await registry.markProcessRunning(created.lease, "process-first");

    const events = [];
    for await (const event of backend.execute({ argv: ["true"], lease: created.lease })) {
      events.push(event);
    }
    expect(events).toEqual([
      expect.objectContaining({
        error_code: "execute_failed",
        event: "failed",
        retryable: false
      })
    ]);
    expect(registry.record?.process_id).toBe("process-first");
    expect(sandbox.starts).toBe(0);
  });

  it("bounds untrusted output backlog and terminates the provider process", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    sandbox.outputChunks = [["stdout", "x".repeat(1_048_577)]];
    const ids = ["lease-output-bound", "process-output-bound"];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => value
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");

    const events = [];
    for await (const event of backend.execute({ argv: ["yes"], lease: created.lease })) {
      events.push(event);
    }
    expect(events).toEqual([
      expect.objectContaining({
        error_code: "execute_failed",
        event: "failed",
        retryable: false,
        terminal: true
      })
    ]);
    expect(sandbox.killed).toContain("process-output-bound");
    expect(registry.record?.process_id).toBeUndefined();
    expect(registry.record?.status).toBe("ready");
  });

  it("maps registry transport failures and recovers an uncertain destroy", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => "lease-registry-failure",
      shellQuote: (value) => value
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");

    registry.failRequestKill = true;
    await expect(backend.kill({ lease: created.lease, reason: "kill_switch" })).resolves.toMatchObject(
      { error_code: "kill_failed", retryable: true, terminal: false }
    );
    registry.failRequestKill = false;
    registry.failBeginDestroy = true;
    await expect(backend.destroy({ lease: created.lease })).resolves.toMatchObject({
      error_code: "destroy_failed",
      retryable: true,
      terminal: false
    });
    expect(registry.record?.status).toBe("ready");

    registry.failBeginDestroy = false;
    registry.failFinishDestroy = true;
    await expect(backend.destroy({ lease: created.lease })).resolves.toMatchObject({
      error_code: "destroy_failed",
      retryable: true,
      terminal: false
    });
    expect(registry.record?.status).toBe("destroying");
    registry.failFinishDestroy = false;
    await expect(backend.destroy({ lease: created.lease })).resolves.toMatchObject({
      status: "destroyed",
      terminal: true
    });
    expect(sandbox.destroys).toBe(2);
  });

  it("keeps a timed-out destroy closed and recovers it idempotently", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    sandbox.destroyBarrier = new Promise<void>(() => undefined);
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => "lease-destroy-timeout",
      shellQuote: (value) => value
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");

    vi.useFakeTimers();
    try {
      const firstDestroy = backend.destroy({ lease: created.lease });
      await vi.advanceTimersByTimeAsync(15_000);
      await expect(firstDestroy).resolves.toMatchObject({
        error_code: "destroy_failed",
        retryable: true,
        terminal: false
      });
      expect(registry.record?.status).toBe("destroying");
      sandbox.destroyBarrier = undefined;
      await expect(backend.destroy({ lease: created.lease })).resolves.toMatchObject({
        status: "destroyed",
        terminal: true
      });
      expect(sandbox.destroys).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
