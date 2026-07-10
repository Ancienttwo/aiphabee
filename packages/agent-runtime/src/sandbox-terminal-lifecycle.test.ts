import { describe, expect, it, vi } from "vitest";

import {
  AGENT_RUNNER_SELECTION_VERSION,
  SANDBOX_BACKEND_REQUIRED_CAPABILITIES,
  SANDBOX_HARD_TIMEOUT_MS,
  SANDBOX_SOFT_TIMEOUT_MS,
  SandboxTerminalLifecycleError,
  runSandboxTerminalLifecycle,
  type SandboxBackend,
  type SandboxBackendAccessGrant,
  type SandboxDestroyResult,
  type SandboxExecutionEvent,
  type SandboxExecutionFailureReason,
  type SandboxExecutionHandle,
  type SandboxKillReason,
  type SandboxLease,
  type SandboxTerminalLifecycleRecord
} from "./index.js";

type ExecutionMode =
  | "execution_failure"
  | "execution_throw"
  | "hang"
  | "nonzero"
  | "provider_hard_timeout"
  | "output_then_hang"
  | "stream_ended"
  | "stream_rejected"
  | "success";

function grant(runId = "run-lifecycle"): SandboxBackendAccessGrant {
  return {
    layer: "research",
    owner: { kind: "run", run_id: runId },
    run_mode: "runner_remote",
    runner_family: "fastclaw",
    runner_id: "fastclaw.personal-v0",
    runner_selection_contract_version: AGENT_RUNNER_SELECTION_VERSION,
    source: "agent_runner_selection",
    tenant_id: "tenant-lifecycle",
    user_id: "user-lifecycle"
  } as unknown as SandboxBackendAccessGrant;
}

class LifecycleBackendFixture implements SandboxBackend {
  readonly backend_id = "fixture.lifecycle-v0";
  readonly capabilities = SANDBOX_BACKEND_REQUIRED_CAPABILITIES;
  active = false;
  createMode: "fail" | "hang" | "success" | "throw" = "success";
  createCalls = 0;
  destroyCalls = 0;
  destroyMode: "fail" | "hang" | "success" = "success";
  readonly files = new Map<string, Uint8Array>([
    ["artifact.bin", Uint8Array.from([1, 2, 3])]
  ]);
  readonly killReasons: SandboxKillReason[] = [];
  failureReason: SandboxExecutionFailureReason = "backend_failure";
  killResult: (reason: SandboxKillReason) => "failed" | "hang" | "terminal" = () =>
    "terminal";
  providerDestroyCalls = 0;
  resolveClosedOnDestroy = true;
  returnThrows = false;
  private executeStartedResolve: (() => void) | undefined;
  readonly executeStarted = new Promise<void>((resolve) => {
    this.executeStartedResolve = resolve;
  });
  private executionClosedResolve: (() => void) | undefined;
  readonly executionClosed = new Promise<void>((resolve) => {
    this.executionClosedResolve = resolve;
  });
  private executionReleaseResolve: (() => void) | undefined;
  readonly executionRelease = new Promise<void>((resolve) => {
    this.executionReleaseResolve = resolve;
  });
  private outputObservedResolve: (() => void) | undefined;
  readonly outputObserved = new Promise<void>((resolve) => {
    this.outputObservedResolve = resolve;
  });
  readonly lease: SandboxLease = {
    access_grant: grant(),
    backend_id: this.backend_id,
    lease_id: "lease-lifecycle",
    status: "ready"
  };

  constructor(readonly mode: ExecutionMode) {}

  async create(
    _input: Parameters<SandboxBackend["create"]>[0]
  ): Promise<Awaited<ReturnType<SandboxBackend["create"]>>> {
    this.createCalls += 1;
    if (this.createMode === "throw") throw new Error("create transport failed");
    if (this.createMode === "hang") return new Promise<never>(() => undefined);
    if (this.createMode === "fail") {
      return {
        error_code: "create_failed",
        retryable: true,
        status: "failed"
      };
    }
    this.active = true;
    return { lease: this.lease, status: "created" };
  }

  execute(_input: Parameters<SandboxBackend["execute"]>[0]): SandboxExecutionHandle {
    if (this.mode === "execution_throw") throw new Error("execute transport failed");
    const fixture = this;
    const stream: AsyncIterable<SandboxExecutionEvent> = {
      async *[Symbol.asyncIterator]() {
        fixture.executeStartedResolve?.();
        if (fixture.mode === "output_then_hang") {
          yield {
            chunk: "é",
            classification: "untrusted_process_output",
            event: "output",
            sequence: 0,
            stream: "stdout",
            terminal: false
          };
          fixture.outputObservedResolve?.();
          await fixture.executionRelease;
          return;
        }
        if (fixture.mode === "hang") {
          await fixture.executionRelease;
          return;
        }
        if (fixture.mode === "stream_rejected") throw new Error("transport interrupted");
        if (fixture.mode === "stream_ended") return;
        if (fixture.mode === "execution_failure") {
          yield {
            error_code: "execute_failed",
            event: "failed",
            reason: fixture.failureReason,
            retryable: true,
            sequence: 0,
            terminal: true
          };
          return;
        }
        if (fixture.mode === "provider_hard_timeout") {
          yield {
            error_code: "execute_failed",
            event: "failed",
            reason: "hard_timeout",
            retryable: false,
            sequence: 0,
            terminal: true
          };
          return;
        }
        if (fixture.mode === "success") {
          yield {
            chunk: "é",
            classification: "untrusted_process_output",
            event: "output",
            sequence: 0,
            stream: "stdout",
            terminal: false
          };
          yield {
            chunk: "x",
            classification: "untrusted_process_output",
            event: "output",
            sequence: 1,
            stream: "stderr",
            terminal: false
          };
        }
        yield {
          event: "exit",
          exit_code: fixture.mode === "nonzero" ? 9 : 0,
          sequence: fixture.mode === "success" ? 2 : 0,
          terminal: true
        };
      }
    };
    return {
      closed: this.executionClosed,
      [Symbol.asyncIterator]() {
        const iterator = stream[Symbol.asyncIterator]();
        return {
          next: async () => {
            try {
              const result = await iterator.next();
              if (result.done) fixture.executionClosedResolve?.();
              return result;
            } catch (error) {
              fixture.executionClosedResolve?.();
              throw error;
            }
          },
          return: fixture.returnThrows
            ? () => {
                throw new Error("iterator close failed");
              }
            : async () => {
                try {
                  return (await iterator.return?.()) ?? { done: true, value: undefined };
                } finally {
                  fixture.executionClosedResolve?.();
                }
              }
        };
      }
    };
  }

  async kill(input: { lease: SandboxLease; reason: SandboxKillReason }) {
    this.killReasons.push(input.reason);
    const result = this.killResult(input.reason);
    if (result === "hang") return new Promise<never>(() => undefined);
    if (result === "failed") {
      return {
        error_code: "kill_failed" as const,
        lease_id: input.lease.lease_id,
        reason: input.reason,
        retryable: true,
        status: "failed" as const,
        terminal: false as const
      };
    }
    return {
      lease_id: input.lease.lease_id,
      reason: input.reason,
      status: "killed" as const,
      terminal: true as const
    };
  }

  async destroy(_input: Parameters<SandboxBackend["destroy"]>[0]): Promise<SandboxDestroyResult> {
    this.destroyCalls += 1;
    if (!this.active) {
      return {
        lease_id: this.lease.lease_id,
        status: "already_destroyed",
        terminal: true
      };
    }
    if (this.destroyMode === "hang") return new Promise<never>(() => undefined);
    if (this.destroyMode === "fail") {
      return {
        error_code: "destroy_failed",
        lease_id: this.lease.lease_id,
        retryable: true,
        status: "failed",
        terminal: false
      };
    }
    this.providerDestroyCalls += 1;
    this.active = false;
    this.files.clear();
    if (this.resolveClosedOnDestroy) {
      this.executionReleaseResolve?.();
      if (this.returnThrows) this.executionClosedResolve?.();
    }
    return { lease_id: this.lease.lease_id, status: "destroyed", terminal: true };
  }

  async readFile(_input: Parameters<SandboxBackend["readFile"]>[0]) {
    return {
      error_code: "file_read_failed" as const,
      retryable: false,
      status: "failed" as const
    };
  }

  async writeFile(_input: Parameters<SandboxBackend["writeFile"]>[0]) {
    return {
      error_code: "file_write_failed" as const,
      retryable: false,
      status: "failed" as const
    };
  }
}

function lifecycleInput(
  backend: SandboxBackend,
  records: SandboxTerminalLifecycleRecord[],
  control?: { reason: "client_cancelled" | "global_kill" | "kill_switch" | "tenant_kill"; signal: AbortSignal }
) {
  return {
    access_grant: grant(),
    argv: ["node", "job.mjs"] as const,
    backend,
    control,
    egress_access: { kind: "deny_all" as const },
    record_terminal: async (record: SandboxTerminalLifecycleRecord) => {
      records.push(record);
    },
    run_id: "run-lifecycle"
  };
}

describe("sandbox terminal lifecycle", () => {
  it("records observed success usage, destroys once, and leaves cleanup idempotent", async () => {
    const backend = new LifecycleBackendFixture("success");
    const records: SandboxTerminalLifecycleRecord[] = [];

    const result = await runSandboxTerminalLifecycle(lifecycleInput(backend, records));

    expect(result).toBe(records[0]);
    expect(records).toHaveLength(1);
    expect(result).toMatchObject({
      cleanup: { release_safe: true, status: "destroyed" },
      execution_terminal_seen: true,
      terminal_record_count: 1,
      terminal_state: "completed",
      usage: {
        estimated: false,
        exit_code: 0,
        measurement: "observed",
        output_event_count: 2,
        stderr_bytes: 1,
        stdout_bytes: 2
      }
    });
    expect(result.usage.lifecycle_wall_clock_ms).toBeGreaterThanOrEqual(0);
    expect(result.usage.execution_wall_clock_ms).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(result)).not.toContain("é");
    expect(JSON.stringify(result)).not.toContain('"x"');
    expect(backend.active).toBe(false);
    expect(backend.files.size).toBe(0);
    expect(backend.providerDestroyCalls).toBe(1);

    await expect(backend.destroy({ lease: backend.lease })).resolves.toMatchObject({
      status: "already_destroyed",
      terminal: true
    });
    expect(backend.providerDestroyCalls).toBe(1);
  });

  it.each([
    ["execution_failure", "execution_failed", true],
    ["execution_throw", "execution_failed", false],
    ["nonzero", "execution_failed", true],
    ["provider_hard_timeout", "hard_timeout", true],
    ["stream_ended", "stream_interrupted", false],
    ["stream_rejected", "stream_interrupted", false]
  ] as const)("maps %s to one terminal state", async (mode, terminalState, terminalSeen) => {
    const backend = new LifecycleBackendFixture(mode);
    const records: SandboxTerminalLifecycleRecord[] = [];

    const result = await runSandboxTerminalLifecycle(lifecycleInput(backend, records));

    expect(result.terminal_state).toBe(terminalState);
    expect(result.execution_terminal_seen).toBe(terminalSeen);
    expect(records).toEqual([result]);
    expect(backend.providerDestroyCalls).toBe(1);
    if (terminalState === "stream_interrupted") {
      expect(backend.killReasons).toEqual(["stream_interrupted"]);
    }
  });

  it.each([
    ["client_cancelled", "client_cancelled"],
    ["global_kill", "global_killed"],
    ["hard_timeout", "hard_timeout"],
    ["kill_switch", "kill_switch"],
    ["soft_timeout", "soft_timeout"],
    ["stream_interrupted", "stream_interrupted"],
    ["tenant_kill", "tenant_killed"]
  ] as const)("preserves provider terminal reason %s", async (reason, terminalState) => {
    const backend = new LifecycleBackendFixture("execution_failure");
    backend.failureReason = reason;
    const records: SandboxTerminalLifecycleRecord[] = [];

    const result = await runSandboxTerminalLifecycle(lifecycleInput(backend, records));

    expect(result).toMatchObject({
      execution_terminal_seen: true,
      requested_kill_reason: reason,
      terminal_state: terminalState
    });
    expect(records).toEqual([result]);
  });

  it.each([
    ["client_cancelled", "client_cancelled"],
    ["tenant_kill", "tenant_killed"],
    ["global_kill", "global_killed"],
    ["kill_switch", "kill_switch"]
  ] as const)("terminates one live run for %s", async (reason, terminalState) => {
    const backend = new LifecycleBackendFixture("hang");
    const controller = new AbortController();
    const records: SandboxTerminalLifecycleRecord[] = [];
    const resultPromise = runSandboxTerminalLifecycle(
      lifecycleInput(backend, records, { reason, signal: controller.signal })
    );
    await backend.executeStarted;
    controller.abort();

    const result = await resultPromise;

    expect(result.terminal_state).toBe(terminalState);
    expect(result.requested_kill_reason).toBe(reason);
    expect(result.cleanup).toMatchObject({ release_safe: true, status: "destroyed" });
    expect(records).toEqual([result]);
    expect(backend.killReasons).toEqual([reason]);
  });

  it("does not create compute when control is already aborted", async () => {
    const backend = new LifecycleBackendFixture("hang");
    const controller = new AbortController();
    const records: SandboxTerminalLifecycleRecord[] = [];
    controller.abort();

    const result = await runSandboxTerminalLifecycle(
      lifecycleInput(backend, records, {
        reason: "client_cancelled",
        signal: controller.signal
      })
    );

    expect(result).toMatchObject({
      cleanup: { release_safe: true, status: "not_required" },
      lease_id: null,
      terminal_state: "client_cancelled"
    });
    expect(backend.createCalls).toBe(0);
    expect(records).toEqual([result]);
  });

  it("rejects a run identity that does not match the access grant before create", async () => {
    const backend = new LifecycleBackendFixture("success");

    await expect(
      runSandboxTerminalLifecycle({
        ...lifecycleInput(backend, []),
        access_grant: grant("run-other")
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(backend.createCalls).toBe(0);
  });

  it("terminates a cancelled create attempt at the create deadline without claiming cleanup", async () => {
    vi.useFakeTimers();
    try {
      const backend = new LifecycleBackendFixture("success");
      backend.createMode = "hang";
      const controller = new AbortController();
      const records: SandboxTerminalLifecycleRecord[] = [];
      const resultPromise = runSandboxTerminalLifecycle(
        lifecycleInput(backend, records, {
          reason: "client_cancelled",
          signal: controller.signal
        })
      );
      await vi.advanceTimersByTimeAsync(1);
      controller.abort();
      await vi.advanceTimersByTimeAsync(29_999);

      const result = await resultPromise;

      expect(result).toMatchObject({
        cleanup: { release_safe: false, status: "backend_owned_unconfirmed" },
        lease_id: null,
        terminal_state: "client_cancelled"
      });
      expect(records).toEqual([result]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("destroys a lease that appears after the create deadline without emitting a second record", async () => {
    vi.useFakeTimers();
    try {
      const backend = new LifecycleBackendFixture("success");
      let releaseCreate: (() => void) | undefined;
      backend.create = () =>
        new Promise((resolve) => {
          releaseCreate = () => {
            backend.active = true;
            resolve({ lease: backend.lease, status: "created" });
          };
        });
      let cleanupObservedResolve: (() => void) | undefined;
      const cleanupObserved = new Promise<void>((resolve) => {
        cleanupObservedResolve = resolve;
      });
      const destroy = backend.destroy.bind(backend);
      backend.destroy = async (input) => {
        const result = await destroy(input);
        cleanupObservedResolve?.();
        return result;
      };
      const records: SandboxTerminalLifecycleRecord[] = [];
      const resultPromise = runSandboxTerminalLifecycle(lifecycleInput(backend, records));
      await vi.advanceTimersByTimeAsync(30_000);

      const result = await resultPromise;
      expect(result.terminal_state).toBe("create_failed");
      expect(records).toEqual([result]);

      releaseCreate?.();
      await cleanupObserved;
      expect(backend.providerDestroyCalls).toBe(1);
      expect(records).toEqual([result]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("retains observed output usage when a live run is cancelled", async () => {
    const backend = new LifecycleBackendFixture("output_then_hang");
    const controller = new AbortController();
    const records: SandboxTerminalLifecycleRecord[] = [];
    const resultPromise = runSandboxTerminalLifecycle(
      lifecycleInput(backend, records, {
        reason: "client_cancelled",
        signal: controller.signal
      })
    );
    await backend.outputObserved;
    controller.abort();

    const result = await resultPromise;

    expect(result.usage).toMatchObject({ output_event_count: 1, stdout_bytes: 2 });
    expect(result.terminal_state).toBe("client_cancelled");
    expect(result.cleanup.execution_closed).toBe(true);
  });

  it.each(["fail", "throw"] as const)(
    "records an unconfirmed backend-owned cleanup state when create %s",
    async (createMode) => {
      const backend = new LifecycleBackendFixture("success");
      backend.createMode = createMode;
      const records: SandboxTerminalLifecycleRecord[] = [];

      const result = await runSandboxTerminalLifecycle(lifecycleInput(backend, records));

      expect(result).toMatchObject({
        cleanup: { release_safe: false, status: "backend_owned_unconfirmed" },
        lease_id: null,
        terminal_state: "create_failed"
      });
      expect(backend.destroyCalls).toBe(0);
      expect(records).toEqual([result]);
    }
  );

  it("enforces soft timeout with observed time and confirmed graceful kill", async () => {
    vi.useFakeTimers();
    try {
      const backend = new LifecycleBackendFixture("hang");
      const records: SandboxTerminalLifecycleRecord[] = [];
      const resultPromise = runSandboxTerminalLifecycle(lifecycleInput(backend, records));
      await backend.executeStarted;

      await vi.advanceTimersByTimeAsync(SANDBOX_SOFT_TIMEOUT_MS);
      const result = await resultPromise;

      expect(result.terminal_state).toBe("soft_timeout");
      expect(result.requested_kill_reason).toBe("soft_timeout");
      expect(result.usage.execution_wall_clock_ms).toBeGreaterThanOrEqual(
        SANDBOX_SOFT_TIMEOUT_MS
      );
      expect(backend.killReasons).toEqual(["soft_timeout"]);
      expect(records).toEqual([result]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("escalates a failed soft kill to the hard timeout", async () => {
    vi.useFakeTimers();
    try {
      const backend = new LifecycleBackendFixture("hang");
      backend.killResult = (reason) => (reason === "hard_timeout" ? "terminal" : "failed");
      const records: SandboxTerminalLifecycleRecord[] = [];
      const resultPromise = runSandboxTerminalLifecycle(lifecycleInput(backend, records));
      await backend.executeStarted;

      await vi.advanceTimersByTimeAsync(SANDBOX_SOFT_TIMEOUT_MS);
      expect(backend.killReasons).toEqual(["soft_timeout"]);
      await vi.advanceTimersByTimeAsync(
        SANDBOX_HARD_TIMEOUT_MS - SANDBOX_SOFT_TIMEOUT_MS
      );
      const result = await resultPromise;

      expect(result.terminal_state).toBe("hard_timeout");
      expect(result.requested_kill_reason).toBe("hard_timeout");
      expect(backend.killReasons).toEqual(["soft_timeout", "hard_timeout"]);
      expect(records).toEqual([result]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("records destroy failure without fabricating release-safe cleanup", async () => {
    const backend = new LifecycleBackendFixture("success");
    backend.destroyMode = "fail";
    const records: SandboxTerminalLifecycleRecord[] = [];

    const result = await runSandboxTerminalLifecycle(lifecycleInput(backend, records));

    expect(result.terminal_state).toBe("completed");
    expect(result.cleanup).toEqual({
      execution_closed: true,
      release_safe: false,
      status: "failed"
    });
    expect(backend.active).toBe(true);
    expect(records).toEqual([result]);
  });

  it("keeps cleanup unconfirmed when the execution producer does not close", async () => {
    vi.useFakeTimers();
    try {
      const backend = new LifecycleBackendFixture("hang");
      backend.resolveClosedOnDestroy = false;
      const controller = new AbortController();
      const records: SandboxTerminalLifecycleRecord[] = [];
      const resultPromise = runSandboxTerminalLifecycle(
        lifecycleInput(backend, records, {
          reason: "client_cancelled",
          signal: controller.signal
        })
      );
      await backend.executeStarted;
      controller.abort();
      await vi.advanceTimersByTimeAsync(15_000);

      const result = await resultPromise;

      expect(result.cleanup).toEqual({
        execution_closed: false,
        release_safe: false,
        status: "destroyed"
      });
      expect(records).toEqual([result]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("still destroys and records when iterator closure throws synchronously", async () => {
    const backend = new LifecycleBackendFixture("success");
    backend.returnThrows = true;
    const records: SandboxTerminalLifecycleRecord[] = [];

    const result = await runSandboxTerminalLifecycle(lifecycleInput(backend, records));

    expect(result.cleanup).toEqual({
      execution_closed: true,
      release_safe: true,
      status: "destroyed"
    });
    expect(backend.providerDestroyCalls).toBe(1);
    expect(records).toEqual([result]);
  });

  it("fails explicitly when terminal recording fails after cleanup", async () => {
    const backend = new LifecycleBackendFixture("success");

    await expect(
      runSandboxTerminalLifecycle({
        ...lifecycleInput(backend, []),
        record_terminal: async () => {
          throw new Error("audit unavailable");
        }
      })
    ).rejects.toMatchObject({
      code: "TERMINAL_RECORD_FAILED",
      name: "SandboxTerminalLifecycleError"
    } satisfies Partial<SandboxTerminalLifecycleError>);
    expect(backend.active).toBe(false);
    expect(backend.providerDestroyCalls).toBe(1);
  });
});
