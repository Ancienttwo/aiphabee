import { describe, expect, it, vi } from "vitest";

import {
  AGENT_RUNNER_SELECTION_VERSION,
  SANDBOX_TOOL_GATEWAY_URL,
  runSandboxTerminalLifecycle,
  validateSandboxWorkspacePath,
  type SandboxBackendAccessGrant,
  type SandboxLease,
  type SandboxOwnership,
  type SandboxTerminalLifecycleRecord,
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
import type { SandboxToolGatewayEgressParams } from "./tool-gateway-egress.js";

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
  private removedResolve: (() => void) | undefined;
  readonly removed = new Promise<void>((resolve) => {
    this.removedResolve = resolve;
  });

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
    this.removedResolve?.();
  }
}

class FakeSandbox implements CloudflareSandboxHandle {
  readonly files = new Map<string, Uint8Array>();
  createSessionBarrier: Promise<void> | undefined;
  destroyed = false;
  destroyBarrier: Promise<void> | undefined;
  destroys = 0;
  failDestroy = false;
  failCreateSession = false;
  failProcessKill = false;
  failProcessWait = false;
  failProviderKill = false;
  failStart = false;
  failSetOutbound = false;
  failSetOutboundAfterMutation = false;
  failRemoveOutbound = false;
  failRemoveOutboundOnCalls = new Set<number>();
  applySetOutboundAfterBarrier = false;
  emitStreamError = false;
  killed: string[] = [];
  lastProcessEnv: Record<string, string> | undefined;
  outboundConfigurations: Array<{
    hostname: string;
    methodName: string;
    params: SandboxToolGatewayEgressParams;
  }> = [];
  outboundMappedAtProcessStart: boolean[] = [];
  removeOutboundCalls = 0;
  removedOutboundHosts: string[] = [];
  toolGatewayMapped = false;
  outputChunks: Array<["stderr" | "stdout", string]> = [
    ["stdout", "out"],
    ["stderr", "err"]
  ];
  resolvedSessions: string[] = [];
  sessions: string[] = [];
  setOutboundBarrier: Promise<void> | undefined;
  startBarrier: Promise<void> | undefined;
  private startObservedResolve: (() => void) | undefined;
  readonly startObserved = new Promise<void>((resolve) => {
    this.startObservedResolve = resolve;
  });
  starts = 0;
  startCompletions = 0;

  async createSession(options: { id: string }): Promise<void> {
    if (this.failCreateSession) throw new Error("session create failed");
    await this.createSessionBarrier;
    this.sessions.push(options.id);
  }

  async destroy(): Promise<void> {
    this.destroys += 1;
    await this.destroyBarrier;
    if (this.failDestroy) throw new Error("destroy failed");
    this.destroyed = true;
    this.sessions.length = 0;
  }

  async killProcess(processId: string): Promise<void> {
    if (this.failProviderKill) throw new Error("provider kill failed");
    this.killed.push(processId);
  }

  async setOutboundByHost(
    hostname: string,
    methodName: string,
    params: SandboxToolGatewayEgressParams
  ): Promise<void> {
    if (this.failSetOutbound) throw new Error("outbound configuration failed");
    this.outboundConfigurations.push({ hostname, methodName, params });
    if (!this.applySetOutboundAfterBarrier) this.toolGatewayMapped = true;
    await this.setOutboundBarrier;
    if (this.applySetOutboundAfterBarrier) this.toolGatewayMapped = true;
    if (this.failSetOutboundAfterMutation) {
      throw new Error("outbound configuration failed after mutation");
    }
  }

  async removeOutboundByHost(hostname: string): Promise<void> {
    this.removeOutboundCalls += 1;
    if (
      this.failRemoveOutbound ||
      this.failRemoveOutboundOnCalls.has(this.removeOutboundCalls)
    ) {
      throw new Error("outbound cleanup failed");
    }
    this.removedOutboundHosts.push(hostname);
    this.toolGatewayMapped = false;
  }

  async getSession(sessionId: string) {
    this.resolvedSessions.push(sessionId);
    return { startProcess: this.startProcess.bind(this) };
  }

  async startProcess(
    _command: string,
    options: {
      env?: Record<string, string>;
      onError(error: Error): void;
      onExit(code: number | null): void;
      onOutput(stream: "stderr" | "stdout", data: string): void;
      processId: string;
    }
  ) {
    this.starts += 1;
    this.outboundMappedAtProcessStart.push(this.toolGatewayMapped);
    this.lastProcessEnv = options.env;
    this.startObservedResolve?.();
    await this.startBarrier;
    if (this.failStart) throw new Error("start failed");
    for (const [stream, data] of this.outputChunks) options.onOutput(stream, data);
    if (this.emitStreamError) options.onError(new Error("stream failed"));
    options.onExit(0);
    this.startCompletions += 1;
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
  it("runs the terminal lifecycle through the concrete adapter and releases the lease once", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const ids = ["lease-lifecycle-adapter", "process-lifecycle-adapter"];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => `'${value}'`
    });
    const records: SandboxTerminalLifecycleRecord[] = [];

    const result = await runSandboxTerminalLifecycle({
      access_grant: grant({ owner: { kind: "run", run_id: "run-lifecycle-adapter" } }),
      argv: ["printf", "ok"],
      backend,
      egress_access: { kind: "deny_all" },
      record_terminal: async (record) => {
        records.push(record);
      },
      run_id: "run-lifecycle-adapter"
    });

    expect(result).toMatchObject({
      cleanup: { release_safe: true, status: "destroyed" },
      terminal_state: "completed",
      usage: { estimated: false, measurement: "observed" }
    });
    expect(records).toEqual([result]);
    expect(sandbox.destroys).toBe(1);
    expect(registry.record?.status).toBe("destroyed");

    const path = validateSandboxWorkspacePath("artifacts/result.bin");
    if (path.status !== "allowed") throw new Error("fixture path rejected");
    const lease = {
      access_grant: grant({ owner: { kind: "run", run_id: "run-lifecycle-adapter" } }),
      backend_id: backend.backend_id,
      lease_id: "lease-lifecycle-adapter",
      status: "ready"
    } as const satisfies SandboxLease;
    await expect(backend.readFile({ lease, workspace_path: path.workspace_path })).resolves.toMatchObject({
      error_code: "file_read_failed",
      retryable: false,
      status: "failed"
    });
    await expect(backend.destroy({ lease })).resolves.toMatchObject({
      status: "already_destroyed",
      terminal: true
    });
    expect(sandbox.destroys).toBe(1);
  });

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
    for await (const event of backend.execute({
      argv: ["printf", "ok"],
      egress_access: { kind: "deny_all" },
      lease
    })) {
      events.push(event);
    }
    expect(events.map((event) => event.event)).toEqual(["output", "output", "exit"]);
    expect(sandbox.outboundConfigurations).toEqual([]);
    expect(sandbox.lastProcessEnv).toBeUndefined();
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

  it("keeps the short Tool Gateway token outside the process and removes exact-host egress", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const ids = ["lease-tool-egress", "process-tool-egress"];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => `'${value}'`
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");
    const jobToken = "signed-job-token.signature";
    const events = [];
    for await (const event of backend.execute({
      argv: ["python", "tool.py"],
      egress_access: {
        endpoint: SANDBOX_TOOL_GATEWAY_URL,
        kind: "tool_gateway",
        run_id: "run-adapter",
        token: jobToken
      },
      lease: created.lease
    })) {
      events.push(event);
    }

    expect(events.at(-1)).toMatchObject({ event: "exit", terminal: true });
    expect(sandbox.outboundConfigurations).toEqual([
      {
        hostname: "tool-gateway.internal",
        methodName: "toolGateway",
        params: {
          lease_id: "lease-tool-egress",
          run_id: "run-adapter",
          tenant_id: "tenant-1",
          token: jobToken,
          user_id: "user-1"
        }
      }
    ]);
    expect(sandbox.removedOutboundHosts).toEqual([
      "tool-gateway.internal",
      "tool-gateway.internal"
    ]);
    expect(sandbox.lastProcessEnv).toEqual({
      AIPHABEE_TOOL_GATEWAY_URL: SANDBOX_TOOL_GATEWAY_URL
    });
    expect(JSON.stringify(sandbox.lastProcessEnv)).not.toContain(jobToken);
    expect(JSON.stringify(events)).not.toContain(jobToken);
  });

  it("starts no process when Tool Gateway configuration or access validation fails", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const ids = ["lease-tool-denied", "process-config-failed", "process-invalid-access"];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => value
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");

    sandbox.failSetOutbound = true;
    const configFailure = [];
    for await (const event of backend.execute({
      argv: ["true"],
      egress_access: {
        endpoint: SANDBOX_TOOL_GATEWAY_URL,
        kind: "tool_gateway",
        run_id: "run-adapter",
        token: "signed-job-token.signature"
      },
      lease: created.lease
    })) {
      configFailure.push(event);
    }
    expect(configFailure.at(-1)).toMatchObject({ event: "failed", terminal: true });
    expect(sandbox.starts).toBe(0);
    expect(registry.record).toMatchObject({
      process_id: "process-config-failed",
      process_state: "starting",
      status: "ready"
    });

    sandbox.failSetOutbound = false;
    const invalidAccess = [];
    for await (const event of backend.execute({
      argv: ["true"],
      egress_access: {
        endpoint: "https://example.com/tools" as typeof SANDBOX_TOOL_GATEWAY_URL,
        kind: "tool_gateway",
        run_id: "run-adapter",
        token: "signed-job-token.signature"
      },
      lease: created.lease
    })) {
      invalidAccess.push(event);
    }
    expect(invalidAccess.at(-1)).toMatchObject({
      event: "failed",
      retryable: false,
      terminal: true
    });
    const mismatchedRun = [];
    for await (const event of backend.execute({
      argv: ["true"],
      egress_access: {
        endpoint: SANDBOX_TOOL_GATEWAY_URL,
        kind: "tool_gateway",
        run_id: "run-other",
        token: "signed-job-token.signature"
      },
      lease: created.lease
    })) {
      mismatchedRun.push(event);
    }
    expect(mismatchedRun.at(-1)).toMatchObject({
      event: "failed",
      retryable: false,
      terminal: true
    });
    expect(sandbox.starts).toBe(0);
    expect(sandbox.outboundConfigurations).toEqual([]);
  });

  it("poisons the lease when Tool Gateway configuration or cleanup is unconfirmed", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const ids = ["lease-stale-egress", "process-partial-set", "process-deny-all"];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => value
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");

    sandbox.failSetOutboundAfterMutation = true;
    sandbox.failRemoveOutboundOnCalls.add(2);
    const partialSetFailure = [];
    for await (const event of backend.execute({
      argv: ["true"],
      egress_access: {
        endpoint: SANDBOX_TOOL_GATEWAY_URL,
        kind: "tool_gateway",
        run_id: "run-adapter",
        token: "signed-job-token.signature"
      },
      lease: created.lease
    })) {
      partialSetFailure.push(event);
    }
    expect(partialSetFailure.at(-1)).toMatchObject({ event: "failed", terminal: true });
    expect(sandbox.starts).toBe(0);
    expect(sandbox.toolGatewayMapped).toBe(true);
    expect(sandbox.removeOutboundCalls).toBe(2);

    sandbox.failSetOutboundAfterMutation = false;
    const removeCallsBeforeRetry = sandbox.removeOutboundCalls;
    const denyAllEvents = [];
    for await (const event of backend.execute({
      argv: ["true"],
      egress_access: { kind: "deny_all" },
      lease: created.lease
    })) {
      denyAllEvents.push(event);
    }
    expect(denyAllEvents.at(-1)).toMatchObject({
      event: "failed",
      retryable: false,
      terminal: true
    });
    expect(sandbox.starts).toBe(0);
    expect(sandbox.removeOutboundCalls).toBe(removeCallsBeforeRetry);
    expect(registry.record).toMatchObject({
      process_id: "process-partial-set",
      process_state: "starting",
      status: "ready"
    });
    await expect(backend.destroy({ lease: created.lease })).resolves.toMatchObject({
      status: "destroyed",
      terminal: true
    });
  });

  it("does not reopen a lease after confirmed configuration has unconfirmed cleanup", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const ids = ["lease-cleanup-poison", "process-cleanup-poison", "process-denied"];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => value
    });
    const created = await backend.create({ access_grant: grant() });
    if (created.status !== "created") throw new Error("adapter fixture create failed");

    sandbox.failRemoveOutboundOnCalls.add(2);
    const configuredEvents = [];
    for await (const event of backend.execute({
      argv: ["true"],
      egress_access: {
        endpoint: SANDBOX_TOOL_GATEWAY_URL,
        kind: "tool_gateway",
        run_id: "run-adapter",
        token: "signed-job-token.signature"
      },
      lease: created.lease
    })) {
      configuredEvents.push(event);
    }
    expect(configuredEvents.at(-1)).toMatchObject({ event: "exit", terminal: true });
    expect(sandbox.toolGatewayMapped).toBe(true);
    expect(registry.record).toMatchObject({
      process_id: "process-cleanup-poison",
      status: "ready"
    });

    const removeCallsBeforeRetry = sandbox.removeOutboundCalls;
    const deniedEvents = [];
    for await (const event of backend.execute({
      argv: ["true"],
      egress_access: { kind: "deny_all" },
      lease: created.lease
    })) {
      deniedEvents.push(event);
    }
    expect(deniedEvents.at(-1)).toMatchObject({ event: "failed", retryable: false });
    expect(sandbox.removeOutboundCalls).toBe(removeCallsBeforeRetry);
    expect(sandbox.starts).toBe(1);
  });

  it("bounds a hanging Tool Gateway configuration before any process starts", async () => {
    vi.useFakeTimers();
    try {
      const registry = new MemoryLeaseRegistry();
      const sandbox = new FakeSandbox();
      const ids = ["lease-egress-timeout", "process-egress-timeout", "process-after-timeout"];
      const backend = new CloudflareSandboxBackend({
        getSandbox: () => sandbox,
        leaseRegistry: registry,
        newId: () => ids.shift() ?? "unexpected-id",
        shellQuote: (value) => value
      });
      const created = await backend.create({ access_grant: grant() });
      if (created.status !== "created") throw new Error("adapter fixture create failed");

      let releaseSetOutbound: (() => void) | undefined;
      sandbox.applySetOutboundAfterBarrier = true;
      sandbox.setOutboundBarrier = new Promise<void>((resolve) => {
        releaseSetOutbound = resolve;
      });
      const timedOutEventsPromise = (async () => {
        const events = [];
        for await (const event of backend.execute({
          argv: ["true"],
          egress_access: {
            endpoint: SANDBOX_TOOL_GATEWAY_URL,
            kind: "tool_gateway",
            run_id: "run-adapter",
            token: "signed-job-token.signature"
          },
          lease: created.lease
        })) {
          events.push(event);
        }
        return events;
      })();
      await vi.advanceTimersByTimeAsync(15_000);
      const timedOutEvents = await timedOutEventsPromise;
      expect(timedOutEvents.at(-1)).toMatchObject({
        event: "failed",
        reason: "hard_timeout",
        terminal: true
      });
      expect(sandbox.starts).toBe(0);
      expect(sandbox.toolGatewayMapped).toBe(false);
      expect(registry.record).toMatchObject({
        process_id: "process-egress-timeout",
        process_state: "starting",
        status: "ready"
      });

      releaseSetOutbound?.();
      await Promise.resolve();
      expect(sandbox.toolGatewayMapped).toBe(true);

      sandbox.setOutboundBarrier = undefined;
      const removeCallsBeforeRetry = sandbox.removeOutboundCalls;
      const denyAllEvents = [];
      for await (const event of backend.execute({
        argv: ["true"],
        egress_access: { kind: "deny_all" },
        lease: created.lease
      })) {
        denyAllEvents.push(event);
      }
      expect(denyAllEvents.at(-1)).toMatchObject({
        event: "failed",
        retryable: false,
        terminal: true
      });
      expect(sandbox.removeOutboundCalls).toBe(removeCallsBeforeRetry);
      expect(sandbox.outboundMappedAtProcessStart).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("poisons the lease when process start does not confirm before the provider bound", async () => {
    vi.useFakeTimers();
    try {
      const registry = new MemoryLeaseRegistry();
      const sandbox = new FakeSandbox();
      const ids = ["lease-start-timeout", "process-start-timeout", "process-denied"];
      const backend = new CloudflareSandboxBackend({
        getSandbox: () => sandbox,
        leaseRegistry: registry,
        newId: () => ids.shift() ?? "unexpected-id",
        shellQuote: (value) => value
      });
      const created = await backend.create({ access_grant: grant() });
      if (created.status !== "created") throw new Error("adapter fixture create failed");

      let releaseStart: (() => void) | undefined;
      sandbox.startBarrier = new Promise<void>((resolve) => {
        releaseStart = resolve;
      });
      const timedOutEventsPromise = (async () => {
        const events = [];
        for await (const event of backend.execute({
          argv: ["true"],
          egress_access: { kind: "deny_all" },
          lease: created.lease
        })) {
          events.push(event);
        }
        return events;
      })();
      await vi.advanceTimersByTimeAsync(15_000);
      const timedOutEvents = await timedOutEventsPromise;
      expect(timedOutEvents.at(-1)).toMatchObject({
        event: "failed",
        reason: "hard_timeout",
        terminal: true
      });
      expect(registry.record).toMatchObject({
        process_id: "process-start-timeout",
        process_state: "starting",
        status: "ready"
      });

      releaseStart?.();
      await Promise.resolve();
      expect(sandbox.startCompletions).toBe(1);
      const removeCallsBeforeRetry = sandbox.removeOutboundCalls;
      const deniedEvents = [];
      for await (const event of backend.execute({
        argv: ["true"],
        egress_access: { kind: "deny_all" },
        lease: created.lease
      })) {
        deniedEvents.push(event);
      }
      expect(deniedEvents.at(-1)).toMatchObject({ event: "failed", retryable: false });
      expect(sandbox.removeOutboundCalls).toBe(removeCallsBeforeRetry);
      expect(sandbox.starts).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("binds a session-owned lease to the explicit current run without inventing identity", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    const ids = ["lease-session-egress", "process-session-egress"];
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => ids.shift() ?? "unexpected-id",
      shellQuote: (value) => value
    });
    const created = await backend.create({
      access_grant: grant({ owner: { kind: "session", session_id: "session-row4" } })
    });
    if (created.status !== "created") throw new Error("adapter fixture create failed");
    const events = [];
    for await (const event of backend.execute({
      argv: ["true"],
      egress_access: {
        endpoint: SANDBOX_TOOL_GATEWAY_URL,
        kind: "tool_gateway",
        run_id: "run-session-job",
        token: "signed-job-token.signature"
      },
      lease: created.lease
    })) {
      events.push(event);
    }

    expect(events.at(-1)).toMatchObject({ event: "exit", terminal: true });
    expect(sandbox.starts).toBe(1);
    expect(sandbox.outboundConfigurations).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({
          lease_id: "lease-session-egress",
          run_id: "run-session-job"
        })
      })
    ]);
    expect(registry.record?.process_id).toBeUndefined();
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
    for await (const event of backend.execute({
      argv: ["true"],
      egress_access: { kind: "deny_all" },
      lease: foreignLease
    })) {
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
        egress_access: { kind: "deny_all" },
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
    for await (const event of backend.execute({
      argv: ["false"],
      egress_access: { kind: "deny_all" },
      lease: created.lease
    })) {
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
    for await (const event of backend.execute({
      argv: ["true"],
      egress_access: { kind: "deny_all" },
      lease: created.lease
    })) {
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

  it("bounds stalled provider creation and destroys the pending provider", async () => {
    const registry = new MemoryLeaseRegistry();
    const sandbox = new FakeSandbox();
    let releaseCreate: (() => void) | undefined;
    sandbox.createSessionBarrier = new Promise<void>((resolve) => {
      releaseCreate = resolve;
    });
    const backend = new CloudflareSandboxBackend({
      getSandbox: () => sandbox,
      leaseRegistry: registry,
      newId: () => "lease-create-timeout",
      shellQuote: (value) => value
    });

    vi.useFakeTimers();
    try {
      const resultPromise = backend.create({ access_grant: grant() });
      await vi.advanceTimersByTimeAsync(15_000);

      await expect(resultPromise).resolves.toMatchObject({
        error_code: "create_failed",
        status: "failed"
      });
      expect(sandbox.destroys).toBe(1);
      expect(registry.record).toMatchObject({ status: "pending" });

      releaseCreate?.();
      await registry.removed;
      expect(sandbox.destroys).toBe(2);
      expect(sandbox.sessions).toEqual([]);
      expect(registry.record).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
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
    for await (const event of backend.execute({
      argv: ["sleep", "10"],
      egress_access: { kind: "deny_all" },
      lease: created.lease
    })) {
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
    for await (const event of backend.execute({
      argv: ["true"],
      egress_access: { kind: "deny_all" },
      lease: created.lease
    })) {
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
    for await (const event of backend.execute({
      argv: ["yes"],
      egress_access: { kind: "deny_all" },
      lease: created.lease
    })) {
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
